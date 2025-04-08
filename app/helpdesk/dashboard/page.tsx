'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftOnRectangleIcon, 
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Import components
import DashboardSummary from '../components/DashboardSummary';
import QueryFilters from '../components/QueryFilters';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import TicketPopup from '../components/TicketPopup';

// Import types
import { 
  Ticket, 
  TicketStatus, 
  TicketCategory,
  TicketResponse,
  getStatusBadgeClass,
  getTimeElapsed
} from '../types/Ticket';

// Analytics interface
interface TicketAnalytics {
  averageResponseTime: number;
  resolutionRate: number;
  ticketsPerDay: number[];
  userQueryDistribution: { email: string; count: number }[];
  totalTickets: number;
  pendingTickets: number;
  answeredTickets: number;
  totalUsers: number;
}

export default function HelpDeskDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUserHistory, setSelectedUserHistory] = useState<any>(null);
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadTickets();
    loadAnalytics();
  }, []);
  
  // Apply search filter when it changes
  useEffect(() => {
    applySearch();
  }, [tickets, searchKeyword]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/helpdesk/auth');
      if (!response.ok) {
        router.push('/helpdesk/login');
      }
    } catch (error) {
      router.push('/helpdesk/login');
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/tickets');
      if (!response.ok) throw new Error('Failed to load tickets');
      const data = await response.json();
      
      // Transform to match enhanced Ticket interface
      const enhancedTickets: Ticket[] = data.tickets.map((ticket: any) => ({
        id: ticket.id,
        userId: ticket.userId,
        userEmail: ticket.userEmail,
        question: ticket.question,
        status: (ticket.status || 'pending') as TicketStatus,
        priority: 'medium', // Default priority (not used anymore)
        category: (ticket.category || 'general') as TicketCategory,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt || ticket.createdAt,
        responses: ticket.answer ? [
          {
            id: '1',
            content: ticket.answer,
            attachments: [],
            respondedBy: 'helpdesk',
            respondedAt: ticket.answeredAt || new Date().toISOString()
          }
        ] : [],
        isEscalated: false,
        tags: [],
        readStatus: true
      }));
      
      setTickets(enhancedTickets);
      setFilteredTickets(enhancedTickets);
    } catch (error) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      const response = await fetch('/api/helpdesk/queries/stats');
      if (!response.ok) throw new Error('Failed to load analytics data');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsError('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const applySearch = () => {
    if (!searchKeyword.trim()) {
      setFilteredTickets(tickets);
      return;
    }
    
    const keyword = searchKeyword.toLowerCase();
    const result = tickets.filter(
      ticket => 
        ticket.question.toLowerCase().includes(keyword) ||
        ticket.userEmail.toLowerCase().includes(keyword)
    );
    
    setFilteredTickets(result);
  };
  
  const handleSearch = (keywords: string) => {
    setSearchKeyword(keywords);
  };
  
  const handleSubmitAnswer = async (content: string, files: File[]) => {
    if (!selectedTicket) return;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: content }),
      });
      
      if (!response.ok) throw new Error('Failed to submit answer');
      
      // Update the ticket in the local state
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === selectedTicket.id) {
          return {
            ...ticket,
            status: 'answered' as TicketStatus,
            responses: [
              ...ticket.responses,
              {
                id: Date.now().toString(),
                content,
                attachments: [],
                respondedBy: 'helpdesk',
                respondedAt: new Date().toISOString()
              }
            ]
          };
        }
        return ticket;
      });
      
      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      closeTicketPopup();
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };
  
  const handleReject = async () => {
    if (!selectedTicket) return;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${selectedTicket.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to reject ticket');
      
      // Update the ticket in the local state
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === selectedTicket.id) {
          return {
            ...ticket,
            status: 'rejected' as TicketStatus
          };
        }
        return ticket;
      });
      
      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      closeTicketPopup();
    } catch (error) {
      console.error('Error rejecting ticket:', error);
      alert('Failed to reject ticket. Please try again.');
    }
  };
  
  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${selectedTicket.id}?action=remove`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete ticket');
      
      // Remove the ticket from the local state
      const updatedTickets = tickets.filter(ticket => ticket.id !== selectedTicket.id);
      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      closeTicketPopup();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/helpdesk/logout', { method: 'POST' });
      // Redirect to the base page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const handleViewUserHistory = (userId: string, email: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // If clicking on the same user, clear selection
    if (selectedUserHistory?.userId === userId) {
      setSelectedUserHistory(null);
    } else {
      // Calculate user history from tickets
      const userTickets = tickets.filter(t => t.userId === userId);
      const answeredUserTickets = userTickets.filter(t => t.status === 'answered');
      
      let totalResponseTime = 0;
      answeredUserTickets.forEach(ticket => {
        if (ticket.responses[0]?.respondedAt && ticket.createdAt) {
          const createdAt = new Date(ticket.createdAt);
          const respondedAt = new Date(ticket.responses[0].respondedAt);
          totalResponseTime += (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        }
      });
      
      const avgResponseTime = answeredUserTickets.length > 0
        ? Math.round(totalResponseTime / answeredUserTickets.length)
        : 0;
        
      setSelectedUserHistory({
        userId,
        email,
        numberOfTickets: userTickets.length,
        lastTicketDate: userTickets.length > 0 
          ? userTickets.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0].createdAt
          : new Date().toISOString(),
        averageResponseTime: avgResponseTime
      });
    }
  };
  
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketPopup(true);
  };
  
  const closeTicketPopup = () => {
    setShowTicketPopup(false);
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-purple-500 border-gray-600/30 rounded-full animate-spin"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare data for summary
  const totalQueries = analytics?.totalTickets || tickets.length;
  const pendingQueries = analytics?.pendingTickets || tickets.filter(t => t.status === 'pending').length;
  const resolvedQueries = analytics?.answeredTickets || tickets.filter(t => t.status === 'answered').length;
  const uniqueUsers = analytics?.totalUsers || new Set(tickets.map(t => t.userId)).size;

  return (
    <div className="helpdesk-dashboard-page min-h-screen bg-gray-900 pb-10">
      {/* Ticket Popup */}
      {showTicketPopup && (
        <TicketPopup
          ticket={selectedTicket}
          onClose={closeTicketPopup}
          onReject={handleReject}
          onDelete={handleDeleteTicket}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Help Desk Dashboard</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
            {error}
            <button 
              onClick={() => setError('')}
              className="float-right font-bold"
            >
              &times;
            </button>
          </div>
        )}
        
        {/* Analytics Error Banner */}
        {analyticsError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
            {analyticsError}
            <button 
              onClick={() => loadAnalytics()}
              className="ml-4 px-2 py-1 bg-red-500/20 rounded-lg text-sm"
            >
              Retry
            </button>
            <button 
              onClick={() => setAnalyticsError('')}
              className="float-right font-bold"
            >
              &times;
            </button>
          </div>
        )}
        
        {/* Summary Cards */}
        <DashboardSummary 
          totalQueries={totalQueries}
          pendingQueries={pendingQueries}
          resolvedQueries={resolvedQueries}
          totalUsers={uniqueUsers}
        />
        
        {/* Search Bar - Enhanced appearance */}
        <div className="mb-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <QueryFilters onSearch={handleSearch} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Tickets List - Now takes 3 columns (60%) */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl font-semibold text-white">Support Tickets</h2>
            
            {/* Tickets Table - Now with fixed height and scrollable */}
            <div className="helpdesk-tickets-container h-[calc(100vh-320px)]">
              <div className="overflow-auto h-full">
                <table className="helpdesk-tickets-table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Question</th>
                      <th className="text-center">Status</th>
                      <th>Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          No tickets match your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map(ticket => (
                        <tr 
                          key={ticket.id} 
                          onClick={() => handleTicketClick(ticket)}
                          className={`hover:bg-gray-800/60 transition-colors ${
                            selectedUserHistory?.userId === ticket.userId ? 'bg-purple-900/20' : ''
                          }`}
                        >
                          <td className="max-w-[150px] truncate">
                            <div className="font-medium text-white">{ticket.userEmail}</div>
                          </td>
                          <td className="max-w-[250px] truncate">{ticket.question}</td>
                          <td className="text-center">
                            <span className={getStatusBadgeClass(ticket.status)}>
                              {ticket.status === 'pending' && 'Pending'}
                              {ticket.status === 'in_progress' && 'In Progress'}
                              {ticket.status === 'answered' && 'Answered'}
                              {ticket.status === 'rejected' && 'Rejected'}
                            </span>
                          </td>
                          <td className="text-gray-400 text-sm">
                            {getTimeElapsed(ticket.createdAt)}
                          </td>
                          <td>
                            <button 
                              onClick={(e) => handleViewUserHistory(ticket.userId, ticket.userEmail, e)}
                              className={`text-purple-400 hover:text-purple-300 transition-colors ${
                                selectedUserHistory?.userId === ticket.userId ? 'text-purple-300 bg-purple-400/10 p-1 rounded-full' : ''
                              }`}
                              title="View user history"
                            >
                              <span className="sr-only">View user profile</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Analytics Panel - Now takes 2 columns (40%) */}
          <div className="lg:col-span-2 lg:sticky lg:top-[84px] lg:self-start h-[calc(100vh-320px)]">
            {analyticsLoading ? (
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-t-purple-500 border-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {selectedUserHistory ? (
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 overflow-auto h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        User Profile
                      </h3>
                      <button 
                        onClick={() => setSelectedUserHistory(null)}
                        className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-purple-500/80 to-indigo-600/80 p-4 rounded-full shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div>
                          <h5 className="text-white font-medium text-lg">{selectedUserHistory.email}</h5>
                          <p className="text-gray-400 text-sm">User ID: {selectedUserHistory.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-600/10 p-4 rounded-xl border border-purple-500/20">
                          <p className="text-sm text-gray-400 mb-1">Total Tickets</p>
                          <p className="text-2xl font-bold text-white">{selectedUserHistory.numberOfTickets}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 p-4 rounded-xl border border-blue-500/20">
                          <p className="text-sm text-gray-400 mb-1">Avg. Response</p>
                          <p className="text-2xl font-bold text-white">{selectedUserHistory.averageResponseTime}h</p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 p-4 rounded-xl border border-emerald-500/20">
                        <p className="text-sm text-gray-400 mb-1">Last Activity</p>
                        <p className="text-lg font-semibold text-white">{new Date(selectedUserHistory.lastTicketDate).toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-4 rounded-xl border border-amber-500/20">
                        <p className="text-sm text-gray-400 mb-1">Engagement Score</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-gray-700 rounded-full flex-1">
                            <div 
                              className="h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                              style={{width: `${Math.min(100, selectedUserHistory.numberOfTickets * 10)}%`}}
                            ></div>
                          </div>
                          <span className="text-white font-medium">{Math.min(10, selectedUserHistory.numberOfTickets)}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    <AnalyticsDashboard 
                      analytics={analytics || {
                        averageResponseTime: 0,
                        resolutionRate: 0,
                        ticketsPerDay: [0, 0, 0, 0, 0, 0, 0],
                        userQueryDistribution: [],
                        totalTickets: 0,
                        pendingTickets: 0,
                        answeredTickets: 0,
                        totalUsers: 0
                      }}
                      isLoading={analyticsLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 