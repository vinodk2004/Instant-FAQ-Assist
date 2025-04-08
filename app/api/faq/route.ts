import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// This will proxy requests to the Python Flask API
export async function POST(req: NextRequest) {
  try {
    // Temporary bypass auth for testing
    /*
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.userId;
    */
    const userId = "test-user"; // Temporary user ID for testing

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Temporarily comment out database connection for testing
    // const { db } = await connectToDatabase();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || '';
      if (!apiUrl) {
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Failed to get response from FAQ model: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      
      // Commenting out the confidence score check to simplify debugging
      /*
      // Check if the confidence score is below threshold
      if (data.confidence_score < 0.7) {
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
      */

      return NextResponse.json(data);
    } catch (error: any) {
      console.error('Error querying FAQ model:', error);
      return NextResponse.json(
        { 
          answer: "I apologize, but I'm having trouble connecting to the FAQ model. Please try again later.",
          confidence: 0,
          error: error?.message || 'Unknown error' 
        },
        { status: 200 } // Return 200 instead of 500 to allow the frontend to display the error message
      );
    }
  } catch (error: any) {
    console.error('Error in FAQ route:', error);
    return NextResponse.json(
      { 
        answer: "I apologize, but there was an error processing your request. Please try again later.",
        confidence: 0,
        error: error?.message || 'Unknown error'
      },
      { status: 200 } // Return 200 instead of 500 to allow the frontend to display the error message
    );
  }
} 