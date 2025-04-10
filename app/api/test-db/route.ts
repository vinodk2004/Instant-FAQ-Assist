import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    // Test the database connection
    const { db } = await connectToDatabase();
    
    // Try to ping the database
    await db.command({ ping: 1 });
    
    // Create the users collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col: { name: string }) => col.name);
    
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      // Create a unique index on email
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      collections: collectionNames
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 