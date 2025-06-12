"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  // COMPLETELY REMOVED: Redirect logic to debug router errors
  useEffect(() => {
    console.log('ClientBody auth state:', { status, hasSession: !!session, pathname });
    // No redirects - just logging
  }, [session, status, pathname]);

  // Show loading during authentication check
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show auth pages without session check
  if (pathname.startsWith('/auth/')) {
    return <div className="antialiased">{children}</div>;
  }

  // TEMPORARY: Show app regardless of auth state for debugging
  return <div className="antialiased">{children}</div>;
}
