import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Get a specific chat session by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    ) as { userId: string };

    // Make sure we have a valid ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const session = await db.collection('chatSessions').findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(decoded.userId)
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching chat session by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 