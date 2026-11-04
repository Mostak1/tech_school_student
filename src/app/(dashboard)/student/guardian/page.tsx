'use client';
import React, { useMemo } from 'react';
import { BiHomeSmile } from 'react-icons/bi';
import Image from 'next/image';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useGuardianDetails } from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function GuardianPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();

  // Fetch guardian details using TanStack Query
  const {
    data: guardianResponse,
    isLoading: loading,
    error,
  } = useGuardianDetails();

  // Extract guardian data from response
  const guardian = guardianResponse?.success
    ? guardianResponse.data?.guardian
    : null;

  const breadcrumbItems = useMemo(() => [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('guardian'),
    },
  ], [translate]);

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('guardian')} items={breadcrumbItems} />

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {translate('loadingGuardianDetails')}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {translate('error')}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {error instanceof Error
                    ? error.message
                    : translate('failedToFetchGuardianDetails')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Details - Show when data is loaded */}
      {!loading && !error && guardian && (
        <div className="mt-6">
          <div className="bg-white rounded-[12px] border border-gray-200 p-3 md:p-4">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start border border-gray-200 rounded-[12px] p-4 md:p-5 bg-[var(--light-primary-color)]">
              {/* Profile Image Section */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-[8px] border border-gray-800 overflow-hidden p-1">
                  <Image
                    src={guardian.image || '/assets/images/common/user.png'}
                    alt={guardian.full_name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-[8px]"
                  />
                </div>
              </div>

              {/* Information Grid - Fixed to prevent overlap on tablet/mobile */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-10 md:gap-y-8">
                {/* Name Field */}
                <div className="min-h-[65px]">
                  <label className="block text-sm md:text-base font-normal text-gray-600 mb-1 md:mb-2">
                    {translate('name')}
                  </label>
                  <p className="text-sm md:text-base font-normal text-gray-900">
                    {guardian.full_name}
                  </p>
                </div>

                {/* Gender Field */}
                <div className="min-h-[65px] md:border-l md:border-gray-200 md:pl-6">
                  <label className="block text-sm md:text-base font-normal text-gray-600 mb-1 md:mb-2">
                    {translate('gender')}
                  </label>
                  <p className="text-sm md:text-base font-normal text-gray-900">
                    {guardian.gender}
                  </p>
                </div>

                {/* Email Field */}
                <div className="min-h-[65px]">
                  <label className="block text-sm md:text-base font-normal text-gray-600 mb-1 md:mb-2">
                    {translate('email')}
                  </label>
                  <p className="text-sm md:text-base font-normal text-gray-900 break-words">
                    {guardian.email}
                  </p>
                </div>

                {/* Mobile Field */}
                <div className="min-h-[65px] md:border-l md:border-gray-200 md:pl-6">
                  <label className="block text-sm md:text-base font-normal text-gray-600 mb-1 md:mb-2">
                    {translate('mobile')}
                  </label>
                  <p className="text-sm md:text-base font-normal text-gray-900">
                    {guardian.mobile}
                  </p>
                </div>

                {/* Current Address Field - Spans full width */}
                {guardian.current_address && (
                  <div className="min-h-[65px] md:col-span-2">
                    <label className="block text-sm md:text-base font-normal text-gray-600 mb-1 md:mb-2">
                      {translate('currentAddress')}
                    </label>
                    <p className="text-sm md:text-base font-normal text-gray-900">
                      {guardian.current_address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && !guardian && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {translate('noGuardianInformation')}
            </h3>
            <p className="text-gray-600">
              {translate('guardianDetailsNotAvailable')}
            </p>
          </div>
        </div>
      )}
    </Container>
  );
}
