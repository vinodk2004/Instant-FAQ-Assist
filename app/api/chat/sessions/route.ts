import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Get all chat sessions for the current user
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
    ) as { userId: string };

    const { db } = await connectToDatabase();
    const sessions = await db.collection('chatSessions')
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ lastUpdated: -1 })
      .toArray();

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new chat session
export async function POST(request: Request) {
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

    const { title, messages } = await request.json();

    // Check for duplicate sessions with the same title
    const { db } = await connectToDatabase();
    const existingSession = await db.collection('chatSessions').findOne({
      userId: new ObjectId(decoded.userId),
      title: title,
    });

    if (existingSession) {
      // Update existing session instead of creating a new one
      const result = await db.collection('chatSessions').updateOne(
        { _id: existingSession._id },
        {
          $set: {
            messages,
            lastUpdated: new Date(),
          },
        }
      );

      return NextResponse.json({
        session: {
          id: existingSession._id,
          title,
          messages,
          lastUpdated: new Date(),
        },
      });
    }

    // Create new session if no duplicate found
    const result = await db.collection('chatSessions').insertOne({
      userId: new ObjectId(decoded.userId),
      title,
      messages,
      lastUpdated: new Date(),
    });

    return NextResponse.json({
      session: {
        id: result.insertedId,
        title,
        messages,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a chat session
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
    ) as { userId: string };

    const { sessionId, title, messages } = await request.json();

    const { db } = await connectToDatabase();
    
    // Check if another session with the same title exists
    const existingSession = await db.collection('chatSessions').findOne({
      userId: new ObjectId(decoded.userId),
      title: title,
      _id: { $ne: new ObjectId(sessionId) },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: 'A session with this title already exists' },
        { status: 400 }
      );
    }

    const result = await db.collection('chatSessions').updateOne(
      {
        _id: new ObjectId(sessionId),
        userId: new ObjectId(decoded.userId),
      },
      {
        $set: {
          title,
          messages,
          lastUpdated: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Chat session updated successfully',
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a chat session
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // First verify the session belongs to the user
    const session = await db.collection('chatSessions').findOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(decoded.userId),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the session
    const result = await db.collection('chatSessions').deleteOne({
      _id: new ObjectId(sessionId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete chat session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 