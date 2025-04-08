import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// This will proxy requests to the Python Flask API
export async function POST(req: NextRequest) {
  try {
    console.log('FAQ API route called');
    const token = await getToken({ req });
    if (!token) {
      console.log('No token found, returning unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.userId;
    const { message } = await req.json();
    console.log('Received message:', message);

    if (!message) {
      console.log('No message provided');
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    console.log('Connected to MongoDB');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || '';
      if (!apiUrl) {
        console.error('API URL is not configured');
        throw new Error('API URL is not configured');
      }
      
      console.log('Making request to backend:', apiUrl);
      console.log('Request body:', JSON.stringify({ message }));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Failed to get response from FAQ model: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      
      // Check if the confidence score is below threshold
      if (data.confidence_score < 0.7) {
        console.log('Low confidence score, creating helpdesk ticket');
        // Forward to helpdesk
        const ticket = {
          userId: userId,
          query: message,
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
    } catch (error: any) {
      console.error('Error querying FAQ model:', error);
      return NextResponse.json(
        { error: 'Failed to process your query', details: error?.message || 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in FAQ route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 