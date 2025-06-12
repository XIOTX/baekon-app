"use client";

import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import BaekonApp from './BaekonAppContent'

export default function Page() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading BÆKON...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">BÆKON</h1>
            <p className="text-gray-300">AI-Powered Schedule Assistant</p>
          </div>

          <button
            onClick={() => signIn('credentials', { callbackUrl: '/' })}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Sign In
          </button>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Demo Account: gamebraicher@gmail.com
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <BaekonApp userId={session.user?.id} />
}
