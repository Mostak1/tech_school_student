'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

// TODO: Uncomment these imports when implementing the actual home page
// import Layout from '@/components/shared/layout/Layout';
// import Hero from '@/components/ui/pages/home/Hero';
// import Aboutus from '@/components/ui/pages/home/Aboutus';
// import EduProgram from '@/components/ui/pages/home/EduProgram';

/**
 * Root Page - Redirects to Student Dashboard
 *
 * This page serves as the entry point for the application.
 * It automatically redirects users to the student dashboard.
 * The authentication logic in the student layout will handle
 * redirecting unauthenticated users to the login page.
 *
 * TODO: When implementing the actual home page, replace the redirect logic
 * with the commented components below.
 */
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to student dashboard immediately on component mount
  // Only redirect if we are actually at the root path to avoid interfering with deep links
  // that might be served via SPA fallback (index.html)
  useEffect(() => {
    if (pathname === '/') {
      router.replace('/student/dashboard');
    }
  }, [router, pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Welcome to eSchool</h1>
      <div className="bg-yellow-100 p-4 mb-4 rounded border border-yellow-300 max-w-md">
        <p className="font-mono text-sm">Debug Info:</p>
        <p className="font-mono text-sm">
          Current Path: <strong>{pathname}</strong>
        </p>
        {pathname !== '/' && (
          <p className="text-red-600 text-xs mt-2">
            Warning: You are on a deep link but seeing the Home page. This
            indicates a Static Export routing mismatch.
          </p>
        )}
      </div>
      <p className="mb-4 text-gray-600">Checking authentication...</p>
      <button
        onClick={() => router.push('/student/dashboard')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Dashboard
      </button>
    </div>
  );

  // Return null removed
  // return null;

  // TODO: Uncomment this when implementing the actual home page
  // return (
  //   <Layout>
  //     <main>
  //       <Hero />
  //       <Aboutus />
  //       <EduProgram />
  //     </main>
  //   </Layout>
  // );
}
