export default function TestNoAuthPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page - No Auth Required</h1>

      <div className="space-y-4">
        <p>If you can see this page, the basic Next.js app is working.</p>

        <div>
          <h2 className="text-lg font-semibold">Test Links:</h2>
          <ul className="space-y-2 mt-2">
            <li>
              <a
                href="/api/auth/session"
                className="text-blue-400 hover:underline"
                target="_blank" rel="noreferrer"
              >
                Test /api/auth/session directly
              </a>
            </li>
            <li>
              <a
                href="/api/auth/debug"
                className="text-blue-400 hover:underline"
                target="_blank" rel="noreferrer"
              >
                Check auth debug info
              </a>
            </li>
            <li>
              <a
                href="/auth/signin"
                className="text-blue-400 hover:underline"
              >
                Go to sign in page
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check if /api/auth/session gives ERR_TOO_MANY_REDIRECTS</li>
            <li>Check /api/auth/debug for environment info</li>
            <li>Try signing in if the session endpoint works</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
