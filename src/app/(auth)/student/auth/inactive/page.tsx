'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

/**
 * Account Inactive Page Content
 * Separated to allow Suspense wrapping for useSearchParams
 */
function InactivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the deactivation message from URL params or use default
  const message =
    searchParams.get('message') ||
    'Your account has been deactivated. Please contact the administrator for assistance.';

  useEffect(() => {
    // Clear any remaining auth tokens when this page loads
    // This ensures the user cannot access protected pages
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_auth_state');
      // Set a flag to indicate the account is deactivated
      localStorage.setItem('account_deactivated', 'true');
    }
  }, []);

  const handleRetry = () => {
    // Clear the deactivation flag and try to login again
    if (typeof window !== 'undefined') {
      localStorage.removeItem('account_deactivated');
    }
    router.push('/student/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
      {/* Illustration */}
      <div className="relative mb-8">
        <Image
          src="/assets/images/common/Group.png"
          alt="Account Inactive"
          width={400}
          height={400}
          className="w-48 h-auto sm:w-64"
        />
      </div>

      {/* Message */}
      <p className="text-sm font-normal text-gray-600 text-center max-w-[600px] px-4 mb-8">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md px-4">
        <Button
          onClick={handleRetry}
          className="w-full rounded-lg py-6 text-sm font-medium"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

/**
 * Account Inactive Page
 *
 * This page is shown when a student's account has been deactivated by the administrator.
 * It prevents access to all other pages and provides options to retry or contact support.
 */
export default function InactivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <InactivePageContent />
    </Suspense>
  );
}
