'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import NProgress from 'nprogress';
import { RootState } from '@/components/store';

/**
 * Auth Layout - Protects authentication routes
 *
 * This layout wraps all authentication pages (login, reset-password, etc.)
 * If user is already authenticated, redirect them to dashboard
 * This prevents authenticated users from accessing login/auth pages
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Get authentication state from Redux
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.studentAuth
  );

  // Show/hide NProgress based on loading state
  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }

    // Cleanup on unmount
    return () => {
      NProgress.done();
    };
  }, [loading]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace('/student/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Don't render auth pages if user is authenticated
  // The redirect will happen via useEffect
  if (isAuthenticated) {
    return null;
  }

  // Render auth pages for unauthenticated users
  return <>{children}</>;
}
