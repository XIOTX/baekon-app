import { type NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // Only allow in development or if a special env var is set
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_USER_CREATION) {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Test User'
      }
    });

    return NextResponse.json({
      message: 'Test user created successfully',
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
