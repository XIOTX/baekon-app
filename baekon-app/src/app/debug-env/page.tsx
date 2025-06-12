export default function DebugEnvPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Current Domain (from browser):</h2>
          <p className="font-mono bg-gray-800 p-2 rounded">
            {typeof window !== 'undefined' ? window.location.origin : 'Server-side render'}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Expected NEXTAUTH_URL should be:</h2>
          <p className="font-mono bg-gray-800 p-2 rounded">
            https://baekon-app-production-59d0.up.railway.app
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to Railway Dashboard → Your Project → Variables</li>
            <li>Set or update: <code className="bg-gray-800 px-2 py-1 rounded">NEXTAUTH_URL=https://baekon-app-production-59d0.up.railway.app</code></li>
            <li>Redeploy the service</li>
            <li>Test authentication again</li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Quick Test Links:</h2>
          <ul className="space-y-2">
            <li><a href="/api/auth/debug" className="text-blue-400 hover:underline">Check Auth Debug Info</a></li>
            <li><a href="/auth/signin" className="text-blue-400 hover:underline">Try Sign In</a></li>
            <li><a href="/api/auth/session" className="text-blue-400 hover:underline">Check Session Endpoint</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
