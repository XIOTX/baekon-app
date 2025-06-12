import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Test endpoint called - NextAuth bypass');

    // Simple test response
    return NextResponse.json({
      status: 'ok',
      message: 'API working',
      timestamp: new Date().toISOString(),
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasUrl: !!process.env.NEXTAUTH_URL,
        url: process.env.NEXTAUTH_URL
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
