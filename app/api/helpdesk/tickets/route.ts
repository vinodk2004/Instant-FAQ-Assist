import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const tickets = await db.collection('tickets')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Convert MongoDB _id to string id for the frontend
    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id.toString(),
      userId: ticket.userId,
      userEmail: ticket.userEmail,
      question: ticket.question,
      status: ticket.status,
      createdAt: ticket.createdAt,
      answer: ticket.answer
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, userEmail, question } = await request.json();
    const { db } = await connectToDatabase();

    const ticket = {
      userId,
      userEmail,
      question,
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await db.collection('tickets').insertOne(ticket);
    return NextResponse.json({ ticket: { ...ticket, id: result.insertedId } });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
} 