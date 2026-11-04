'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import { useGetStudentProfile, useGetIdCard } from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile, BiShow, BiDownload } from 'react-icons/bi';
import { toastUtils } from '@/components/lib/toast';

/**
 * Id Card Page
 * Displays the student's ID card information with view and download options
 * as per the Figma design.
 */
export default function IdCardPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  
  // Get school code from Redux store for API calls
  const schoolCode = useSelector(
    (state: RootState) => state.studentAuth.schoolCode
  );

  // Fetch student profile data using the API hook
  const { data, isLoading: isProfileLoading, isError, error } = useGetStudentProfile(schoolCode);

  // Fetch ID Card HTML content
  const { data: idCardData, isLoading: isCardLoading } = useGetIdCard();

  const isLoading = isProfileLoading || isCardLoading;

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('myProfile'),
      href: '/student/profile',
    },
    {
      label: translate('idCard'),
      href: '/student/profile/id-card',
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb title={translate('idCard')} items={breadcrumbItems} />
        <div className="bg-white rounded-[12px] border border-gray-200 p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22577A] mx-auto mb-4"></div>
            <p>{translate('loadingProfileData')}</p>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (isError || !data?.data) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb title={translate('idCard')} items={breadcrumbItems} />
        <div className="bg-white rounded-[12px] border border-gray-200 p-8 min-h-[400px]">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold mb-2">
              {translate('failedToLoadProfileData')}
            </p>
            <p className="text-sm text-gray-600">
              {error instanceof Error ? error.message : translate('unknownErrorOccurred')}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  const profile = data.data;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const className = profile.class_section?.full_name || 'N/A';
  const mediumName = profile.class_section?.medium?.name || 'N/A';
  const rollNo = profile.roll_number || 'N/A';
  const studentFullInfo = `${className} - ${mediumName}  |  ${translate('rollNo')} - ${rollNo}`;



  // Handle View and Download actions
  const handleAction = (shouldDownload: boolean) => {
    const pdfBase64 = idCardData?.pdf;

    if (!pdfBase64 || idCardData?.error) {
      toastUtils.error(translate('idCardContentNotFound'));
      return;
    }

    try {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (shouldDownload) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `ID_Card_${profile.first_name}_${profile.last_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error('Failed to process ID Card PDF:', e);
      toastUtils.error(translate('failedToProcessPdf'));
    }
  };

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Section */}
      <Breadcrumb title={translate('idCard')} items={breadcrumbItems} />

      {/* Main Content Card */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-4 sm:p-6 shadow-sm">
        {/* Inner Card (ID Card Item) */}
        <div className="bg-[#F8F9FA] rounded-[10px] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#F1F1F1]">
          {/* Student Info Section */}
          <div className="flex flex-col items-center md:items-start rtl:md:items-end text-center md:text-left rtl:md:text-right">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              {fullName}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-normal">
              {studentFullInfo}
            </p>
          </div>

          {/* Action Buttons Section */}
          <div className="flex items-center gap-3 rtl:flex-row-reverse">
            <button
              className="flex items-center gap-2 rtl:flex-row-reverse px-4 py-2 bg-white border border-[#22577A] text-[#22577A] rounded-[6px] text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              onClick={() => handleAction(false)}
            >
              <BiShow className="w-5 h-5" />
              {translate('view')}
            </button>
            <button
              className="flex items-center gap-2 rtl:flex-row-reverse px-4 py-2 bg-[#22577A] text-white rounded-[6px] text-sm font-medium hover:bg-[#1a4461] transition-colors shadow-sm"
              onClick={() => handleAction(true)}
            >
              <BiDownload className="w-5 h-5" />
              {translate('download')}
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
}
