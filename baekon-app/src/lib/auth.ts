import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  // Temporarily use JWT sessions to bypass database session issues on Railway
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Trust Railway's proxy headers

  // Debug URL configuration
  debug: true,

  // Session configuration - use JWT for reliability
  session: {
    strategy: 'jwt', // Use JWT sessions temporarily
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Authorize function called with:', { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user.password) {
            console.log('User not found or no password');
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Invalid password');
            return null
          }

          console.log('User authenticated successfully:', { id: user.id, email: user.email });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('Database error during auth:', error)
          return null
        }
      }
    })
  ],

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback start:', {
        hasToken: !!token,
        hasUser: !!user,
        tokenEmail: token?.email,
        userEmail: user?.email
      });

      // Add user info to JWT token on first sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        console.log('JWT token updated with user data:', {
          userId: token.id,
          userEmail: token.email
        });
      }

      console.log('JWT callback result:', {
        hasToken: !!token,
        userId: token?.id,
        userEmail: token?.email
      });
      return token
    },

    async session({ session, token }) {
      console.log('Session callback start:', {
        hasSession: !!session,
        hasToken: !!token,
        sessionUserEmail: session?.user?.email,
        tokenEmail: token?.email
      });

      // Add user info from JWT token to session
      if (token && session?.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        console.log('Session updated with token data:', {
          userId: session.user.id,
          userEmail: session.user.email
        });
      }

      console.log('Session callback result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      return session
    }
  }
}
