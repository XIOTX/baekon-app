import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();

    // Test finding the specific user
    const user = await prisma.user.findUnique({
      where: { email: 'gamebraicher@gmail.com' },
      select: { id: true, email: true, name: true, password: !!true }
    });

    return NextResponse.json({
      status: 'success',
      database: 'connected',
      userCount,
      testUser: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password
      } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
      }
    }, { status: 500 });
  }
}
