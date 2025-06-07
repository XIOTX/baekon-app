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

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "loading") return; // Still loading

    const isAuthPage = pathname.startsWith('/auth/');

    if (!session && !isAuthPage) {
      router.push('/auth/signin');
    }
  }, [session, status, router, pathname]);

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

  // Show main app only when authenticated
  if (session) {
    return <div className="antialiased">{children}</div>;
  }

  // Show nothing while redirecting
  return null;
}
