import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get all tickets
    const tickets = await db.collection('tickets')
      .find({})
      .toArray();
    
    // Calculate average response time (in hours)
    let totalResponseTime = 0;
    let answeredTickets = 0;
    
    tickets.forEach(ticket => {
      if (ticket.status === 'answered' && ticket.answeredAt && ticket.createdAt) {
        const createdAt = new Date(ticket.createdAt);
        const answeredAt = new Date(ticket.answeredAt);
        const responseTimeHours = (answeredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalResponseTime += responseTimeHours;
        answeredTickets++;
      }
    });
    
    const averageResponseTime = answeredTickets > 0 
      ? parseFloat((totalResponseTime / answeredTickets).toFixed(1))
      : 0;
    
    // Calculate resolution rate
    const resolvedTickets = tickets.filter(t => t.status === 'answered').length;
    const totalProcessedTickets = tickets.filter(t => 
      t.status === 'answered' || t.status === 'rejected'
    ).length;
    
    const resolutionRate = totalProcessedTickets > 0 
      ? Math.round((resolvedTickets / totalProcessedTickets) * 100)
      : 0;
    
    // Calculate tickets per day for the last 7 days
    const ticketsPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      const count = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.createdAt);
        return ticketDate >= date && ticketDate < nextDay;
      }).length;
      
      ticketsPerDay.push(count);
    }
    
    // Calculate per-user query distribution
    const userCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
      if (ticket.userEmail) {
        userCounts[ticket.userEmail] = (userCounts[ticket.userEmail] || 0) + 1;
      }
    });
    
    const userQueryDistribution = Object.keys(userCounts).map(email => ({
      email,
      count: userCounts[email]
    })).sort((a, b) => b.count - a.count).slice(0, 10); // Get top 10 users
    
    // Create and return the stats object
    const stats = {
      averageResponseTime,
      resolutionRate,
      ticketsPerDay,
      userQueryDistribution,
      totalTickets: tickets.length,
      pendingTickets: tickets.filter(t => t.status === 'pending').length,
      answeredTickets: resolvedTickets,
      totalUsers: new Set(tickets.map(t => t.userId)).size
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket statistics' },
      { status: 500 }
    );
  }
} 