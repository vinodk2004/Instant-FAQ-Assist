import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// This will proxy requests to the Python Flask API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Improved cookie parsing to handle more formats and cookie headers properly
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse cookies properly using regex to find the token
    // Match 'token=' that is either at the start of the string or after a space/semicolon
    const tokenMatch = cookieHeader.match(/(^|[;\s])token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[2] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string; email: string; name: string };

    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Sending request to Flask API:', { message });

    // Get the Flask API URL from environment variables with fallback
    const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000/api/faq';
    console.log('Using Flask API URL:', FLASK_API_URL);
    
    const response = await fetch(FLASK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flask API error:', errorText);
      throw new Error(`Flask API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from Flask API:', data);

    // If confidence is low, forward to helpdesk
    if (data.confidence_score < 0.80) {
      const { db } = await connectToDatabase();
      
      // Create a new ticket with all required fields
      const ticket = {
        from: decoded.email,
        name: decoded.name,
        question: message,
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: null,
        category: 'FAQ',
        source: 'chat',
        confidence_score: data.confidence_score,
        userId: decoded.userId,
        userEmail: decoded.email,
        userName: decoded.name,
        department: 'Customer Support',
        ticketType: 'FAQ Query',
        description: `User query: ${message}\nConfidence score: ${data.confidence_score}`,
        attachments: [],
        history: [{
          action: 'created',
          timestamp: new Date(),
          user: decoded.name,
          details: 'Ticket created from FAQ chat'
        }]
      };

      // Insert the ticket into the database
      await db.collection('tickets').insertOne(ticket);
      
      return NextResponse.json({
        answer: "I'm not confident I have the right answer for this question. I've forwarded your query to our help desk team, and they'll get back to you shortly.",
        confidence_score: data.confidence_score,
        forwarded_to_helpdesk: true
      });
    }

    // Return response to the client
    return NextResponse.json({
      answer: data.answer,
      confidence_score: data.confidence_score,
      forwarded_to_helpdesk: false
    });
  } catch (error) {
    console.error('Error in FAQ API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process FAQ request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 