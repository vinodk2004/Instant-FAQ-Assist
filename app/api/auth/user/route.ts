import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Improved cookie parsing to handle more formats and cookie headers properly
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header:', cookieHeader);
    
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
    
    console.log('Extracted token:', token?.substring(0, 10) + '...');

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      // Verify the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; email: string; name: string };
      
      console.log('Token verified successfully, userId:', decoded.userId);

      const { db } = await connectToDatabase();
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user: {
          name: user.name,
          email: user.email,
        },
      });
    } catch (jwtError: any) {
      console.error('JWT verification error details:', {
        error: jwtError.message,
        name: jwtError.name,
        stack: jwtError.stack,
        token: token?.length
      });
      
      // Try to decode the token without verification to see what's inside
      try {
        const decodedNoVerify = jwt.decode(token);
        console.log('Token contents (not verified):', decodedNoVerify);
      } catch (decodeError) {
        console.error('Cannot even decode token:', decodeError);
      }
      
      return NextResponse.json(
        { error: 'Authentication failed: ' + jwtError.message },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 