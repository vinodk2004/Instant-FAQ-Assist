import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    // Improved cookie parsing to handle more formats and cookie headers properly
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse cookies properly using regex to find the token
    // Match 'token=' that is either at the start of the string or after a space/semicolon
    const tokenMatch = cookieHeader.match(/(^|[;\s])token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[2] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string; email: string; name: string };

    const { db } = await connectToDatabase();
    
    // Find answered tickets for this user
    const answeredTickets = await db.collection('tickets')
      .find({
        userId: decoded.userId,
        status: 'answered'
      })
      .sort({ answeredAt: -1 })
      .toArray();

    // Format tickets for frontend
    const formattedTickets = answeredTickets.map(ticket => ({
      id: ticket._id.toString(),
      question: ticket.question,
      answer: ticket.answer,
      answeredAt: ticket.answeredAt,
      seen: ticket.seen || false
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error) {
    console.error('User notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Mark a notification as seen
export async function PUT(request: Request) {
  try {
    // Improved cookie parsing to handle more formats and cookie headers properly
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse cookies properly using regex to find the token
    // Match 'token=' that is either at the start of the string or after a space/semicolon
    const tokenMatch = cookieHeader.match(/(^|[;\s])token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[2] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string; email: string; name: string };

    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    const result = await db.collection('tickets').updateOne(
      { 
        _id: new ObjectId(ticketId),
        userId: decoded.userId
      },
      {
        $set: { seen: true }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Ticket not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Marking notification as seen error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
} 