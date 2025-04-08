import React from 'react';
import { ChartBarIcon, ClockIcon, TicketIcon, CheckCircleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface TicketAnalytics {
  averageResponseTime: number; // in hours
  resolutionRate: number; // percentage
  ticketsPerDay: number[];
  userQueryDistribution: { email: string; count: number }[];
  totalTickets: number;
  pendingTickets: number;
  answeredTickets: number;
  totalUsers: number;
}

interface AnalyticsDashboardProps {
  analytics: TicketAnalytics;
  isLoading?: boolean;
}

export default function AnalyticsDashboard({ 
  analytics, 
  isLoading = false
}: AnalyticsDashboardProps) {
  
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-t-purple-500 border-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  // Calculate the day names for the last 7 days
  const daysOfWeek: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    daysOfWeek.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  
  // Find the max value for the chart scale
  const maxTickets = Math.max(...analytics.ticketsPerDay, 1); // Ensure at least 1 to avoid division by zero
  
  // Calculate the efficiency rate (answered tickets as % of total)
  const efficiencyRate = analytics.totalTickets > 0 
    ? Math.round((analytics.answeredTickets / analytics.totalTickets) * 100)
    : 0;
  
  // Calculate average tickets per day
  const avgTicketsPerDay = analytics.ticketsPerDay.length > 0
    ? Math.round(analytics.ticketsPerDay.reduce((sum, current) => sum + current, 0) / analytics.ticketsPerDay.length)
    : 0;
  
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Performance Dashboard</h3>
        <ChartBarIcon className="w-6 h-6 text-purple-500" />
      </div>
      
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="performance-metric">
          <div className="performance-metric-icon bg-purple-500/20">
            <TicketIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="performance-metric-value">{analytics.totalTickets}</div>
            <div className="performance-metric-label">Total Tickets</div>
          </div>
        </div>
        
        <div className="performance-metric">
          <div className="performance-metric-icon bg-blue-500/20">
            <ClockIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="performance-metric-value">{analytics.averageResponseTime}h</div>
            <div className="performance-metric-label">Response Time</div>
          </div>
        </div>
        
        <div className="performance-metric">
          <div className="performance-metric-icon bg-green-500/20">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="performance-metric-value">{analytics.resolutionRate}%</div>
            <div className="performance-metric-label">Resolution</div>
          </div>
        </div>
        
        <div className="performance-metric">
          <div className="performance-metric-icon bg-yellow-500/20">
            <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="performance-metric-value">{avgTicketsPerDay}</div>
            <div className="performance-metric-label">Daily Avg</div>
          </div>
        </div>
      </div>
      
      {/* Tickets Per Day Chart */}
      <div className="mb-5 bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <h4 className="text-sm font-medium text-white mb-3">Tickets Activity (Last 7 Days)</h4>
        <div className="h-[140px] flex items-end justify-between gap-1 px-2">
          {analytics.ticketsPerDay.map((count, index) => {
            // Calculate height percentage based on max value
            const heightPercentage = (count / maxTickets) * 100;
            const colors = [
              'bg-blue-500/80 hover:bg-blue-500',
              'bg-indigo-500/80 hover:bg-indigo-500',
              'bg-purple-500/80 hover:bg-purple-500',
              'bg-violet-500/80 hover:bg-violet-500',
              'bg-fuchsia-500/80 hover:bg-fuchsia-500',
              'bg-pink-500/80 hover:bg-pink-500',
              'bg-rose-500/80 hover:bg-rose-500'
            ];
            
            return (
              <div key={index} className="flex flex-col items-center gap-1 w-full">
                <div className="w-full flex flex-col items-center justify-end h-[100px]">
                  <div className="text-xs text-gray-400 mb-1">{count}</div>
                  <div
                    className={`${colors[index]} rounded-t-md w-2/3 transition-all cursor-pointer group relative`}
                    style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {count} tickets on {daysOfWeek[index]}
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 text-xs">{daysOfWeek[index]}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Per User Query Count Distribution */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <h4 className="text-sm font-medium text-white mb-3">Per User Helpdesk Forwarded Query Count</h4>
        {analytics.userQueryDistribution.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No user query data available</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {analytics.userQueryDistribution.map((user, index) => {
              // Calculate width percentage based on total
              const total = analytics.userQueryDistribution.reduce((acc, u) => acc + u.count, 0);
              const widthPercentage = total > 0 ? (user.count / total) * 100 : 0;
              
              // Determine color based on index
              const colors = [
                'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
                'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
              ];
              const color = colors[index % colors.length];
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 truncate max-w-[150px]" title={user.email}>{user.email}</span>
                    <span className="text-gray-400">{user.count} ({Math.round(widthPercentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${Math.max(widthPercentage, 2)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 