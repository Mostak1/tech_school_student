'use client';

import { useRouter } from 'next/navigation';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Catch-All 404 Not Found Page for Student Portal
 *
 * This page catches all non-existent routes within the student dashboard.
 * It uses a catch-all dynamic route [...not_found] to handle any unmatched paths.
 *
 * The page provides:
 * - A clear 404 message
 * - A button to return to the dashboard
 * - Proper styling consistent with the application
 */
export default function StudentNotFound() {
  const translate = useTranslate();
  const router = useRouter();
  const { collapsed } = useSidebar();

  // Navigate back to student dashboard home
  const handleGoHome = () => {
    router.push('/student/dashboard');
  };

  return (
    <Container collapsed={collapsed}>
      {/* Main 404 Content Container */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        {/* Large 404 Number */}
        
        <h1 className="text-[150px] md:text-[200px] font-bold text-gray-900 leading-none">
          404
        </h1>

        {/* Page Not Found Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {translate('pageNotFound')}
        </h2>

        {/* Description Message */}
        <p className="text-gray-600 text-base md:text-xl font-normal text-center max-w-xl mb-8">
          {translate('pageNotFoundDescription')}
        </p>

        {/* Go Back to Home Button */}
        <button
          onClick={handleGoHome}
          className="bg-(--primary-color) text-white font-medium px-6 py-3 rounded-[4px]"
        >
          {translate('goBackToHome')}
        </button>
      </div>
    </Container>
  );
}
