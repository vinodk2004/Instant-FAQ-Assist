import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// This will proxy requests to the Python Flask API
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.userId;
    const { userInput } = await req.json();

    if (!userInput) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from FAQ model');
      }

      const data = await response.json();
      
      // Check if the confidence score is below threshold
      if (data.confidence_score < 0.7) {
        // Forward to helpdesk
        const ticket = {
          userId: userId,
          query: userInput,
          status: 'pending',
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('tickets').insertOne(ticket);
        
        return NextResponse.json({
          answer: "I'm not entirely sure about this. I've forwarded your query to our support team who will get back to you shortly.",
          confidence_score: data.confidence_score
        });
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error('Error querying FAQ model:', error);
      return NextResponse.json(
        { error: 'Failed to process your query' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in FAQ route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 