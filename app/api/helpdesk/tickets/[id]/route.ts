import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { answer } = await request.json();
    const { db } = await connectToDatabase();

    // Make sure we have a valid ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID format' },
        { status: 400 }
      );
    }

    // First, get the ticket to retrieve the question
    const ticket = await db.collection('tickets').findOne(
      { _id: new ObjectId(params.id) }
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update the ticket with the answer
    const result = await db.collection('tickets').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: 'answered',
          answer,
          answeredAt: new Date(),
        },
      }
    );

    // Add the answer to the FAQ collection for future reference
    await db.collection('faqs').insertOne({
      question: ticket.question,
      answer: answer,
      createdAt: new Date(),
      source: 'helpdesk'
    });

    return NextResponse.json({ message: 'Ticket answered successfully' });
  } catch (error) {
    console.error('Error answering ticket:', error);
    return NextResponse.json(
      { error: 'Failed to answer ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const action = new URL(request.url).searchParams.get('action');

    // Make sure we have a valid ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID format' },
        { status: 400 }
      );
    }

    // If action is 'remove', permanently delete the ticket
    if (action === 'remove') {
      const result = await db.collection('tickets').deleteOne(
        { _id: new ObjectId(params.id) }
      );

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Ticket permanently deleted' });
    } 
    // Otherwise, just mark as rejected (default behavior)
    else {
      const result = await db.collection('tickets').updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            status: 'rejected',
            rejectedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Ticket rejected successfully' });
    }
  } catch (error) {
    console.error('Error processing ticket:', error);
    return NextResponse.json(
      { error: 'Failed to process ticket' },
      { status: 500 }
    );
  }
} 