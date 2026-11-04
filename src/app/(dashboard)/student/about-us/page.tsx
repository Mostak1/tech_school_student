'use client';

import React, { useMemo } from 'react';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile } from 'react-icons/bi';
import { useGetSchoolSettingsByType } from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function AboutUsPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();

  // Fetch about us data from API using school-settings endpoint
  const {
    data: settingsData,
    isLoading,
    error,
  } = useGetSchoolSettingsByType('about_us');

  const breadcrumbItems = useMemo(() => [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('aboutUs'),
    },
  ], [translate]);

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('aboutUs')} items={breadcrumbItems} />

      {/* Main content container */}
      <div className="bg-white rounded-[12px] border border-gray-200 p-4 mt-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">
              {translate('loadingAboutUs')}
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {translate('failedToLoadAboutUs')}
            </h3>
            <p className="text-gray-600">
              {error?.message || translate('unableToFetchAboutUs')}
            </p>
          </div>
        )}

        {/* Dynamic content from API */}
        {settingsData?.success && settingsData.data && (
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: settingsData.data }}
          />
        )}

        {/* Fallback content if no data */}
        {!isLoading &&
          !error &&
          (!settingsData?.success || !settingsData.data) && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {translate('noAboutUsAvailable')}
              </h3>
              <p className="text-gray-600">
                {translate('aboutUsNotAvailable')}
              </p>
            </div>
          )}
      </div>
    </Container>
  );
}
