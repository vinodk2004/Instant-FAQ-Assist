import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the help desk token
    cookies().delete('helpdesk_token');
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Help desk logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 