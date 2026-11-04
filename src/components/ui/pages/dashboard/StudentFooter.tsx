'use client';
import React from 'react';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';

/**
 * Student Footer Component
 * Displays footer text from school settings API
 * Falls back to default copyright text if API data is not available
 */
export default function StudentFooter() {
  // Fetch school settings data including footer_text
  const { data: schoolSettings, isLoading } = useGetSchoolSettings();

  // Get footer text from API response, or use default text
  // The API returns footer_text in the data object
  const footerText =
    schoolSettings?.data?.settings?.footer_text ||
    `© ${new Date().getFullYear()} WRTeam. All Rights Reserved`;

  return (
    <div className="bg-(--primary-color) border-t border-gray-200 py-4 mt-auto relative z-50">
      <div
        className="text-center text-base font-normal text-white"
        suppressHydrationWarning
      >
        {/* Show loading state or footer text */}
        {isLoading ? (
          <span className="opacity-70">Loading...</span>
        ) : (
          footerText
        )}
      </div>
    </div>
  );
}
