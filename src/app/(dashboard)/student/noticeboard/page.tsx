'use client';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { BiBookOpen, BiHomeSmile, BiX } from 'react-icons/bi';
import { useRouter } from 'next/navigation';
import { Download, Loader2, ExternalLink } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useGetAnnouncements, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import type { Announcement } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function NoticeboardPage() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();
  const router = useRouter();

  // Fetch school settings to check for feature access
  const { data: schoolSettings, isLoading: isLoadingSettings } =
    useGetSchoolSettings();

  // Check feature permission and redirect if disabled
  useEffect(() => {
    // Skip check while loading
    if (isLoadingSettings || !schoolSettings?.data) return;

    const enabledFeatures = schoolSettings.data.features || {};

    const isFeatureEnabled = (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase()
      );
    };

    if (!isFeatureEnabled('Announcement Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // State for modal visibility and selected announcement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Fetch announcements from API with type 'class'
  // This will automatically handle loading states, caching, and error handling
  const { data, isLoading, error } = useGetAnnouncements({ type: 'class' });

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('noticeboard'),
    },
  ];

  // Handler for opening modal with selected announcement
  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  // Handler for closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  // Handler for downloading attachment files or opening links
  const handleDownloadAttachment = (fileUrl: string) => {
    // Open the file or link in a new tab
    window.open(fileUrl, '_blank');
  };

  // Helper function to check if attachment is a link (YouTube, website, etc.)
  // Links have type "4" or type_detail "Other Link"
  const isLink = (file: { type: string; type_detail: string }) => {
    return file.type === '4' || file.type_detail === 'Other Link';
  };

  // Get announcements array from API response
  const announcements = data?.data?.data || [];

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('noticeboard')} items={breadcrumbItems} />
      {/* Main container with responsive padding */}
      <div className="min-h-screen bg-white p-2 sm:p-4 rounded-lg border border-gray-200">
        {/* Loading State - Show spinner while fetching data */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-color)]" />
          </div>
        )}

        {/* Error State - Show error message if API fails */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              {translate('failedToLoadAnnouncements')}
            </p>
          </div>
        )}

        {/* Empty State - Show message when no announcements are available */}
        {!isLoading && !error && announcements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
          
                <BiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />

            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {translate('noAnnouncements')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm px-4">
              {translate('noAnnouncementsAvailable')}
            </p>
          </div>
        )}

        {/* Announcements List - Show when data is loaded successfully */}
        {!isLoading && !error && announcements.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-[var(--light-primary-color)] rounded-lg border border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4"
              >
                {/* Content section - takes full width on mobile, flex-1 on desktop */}
                <div className="flex-1 w-full sm:w-auto">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 leading-tight text-left rtl:text-right">
                    {announcement.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed text-left rtl:text-right">
                    {announcement.description}
                  </p>
                </div>
                {/* Button section - full width on mobile, auto width on desktop */}
                <button
                  onClick={() => handleViewDetails(announcement)}
                  className="bg-(--primary-color) text-white text-xs sm:text-sm font-medium px-3 py-2 sm:py-1 rounded whitespace-nowrap transition-colors w-full sm:w-auto hover:bg-(--primary-color)/90"
                >
                  {translate('viewDetails')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent
          className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          {selectedAnnouncement && (
            <>
              {/* Modal Header - Mobile responsive with better spacing */}
              <DialogHeader className="flex flex-row items-start justify-between border-b p-3 sm:p-6">
                <DialogTitle className="text-sm sm:text-base text-left rtl:text-right font-bold text-gray-900 pr-2 sm:pr-4 rtl:pl-2 rtl:pr-0 sm:rtl:pl-4 sm:rtl:pr-0 leading-tight flex-1">
                  {selectedAnnouncement.title}
                </DialogTitle>
                <DialogClose
                  onClick={handleCloseModal}
                  className="flex-shrink-0"
                >
                  <BiX className="w-5 h-5 sm:w-8 sm:h-8 cursor-pointer text-gray-400 bg-(--light-primary-color) border border-gray-200 rounded-[4px] p-1" />
                </DialogClose>
              </DialogHeader>

              {/* Modal Content - Mobile responsive with proper scrolling */}
              <div className="p-3 sm:p-6 !pt-0 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Date Tag - Mobile responsive sizing */}
                <div className="flex items-start">
                  <span className="bg-(--primary-color) text-white text-sm sm:text-base font-normal px-2 py-1 sm:px-3 sm:py-2 rounded-[4px]">
                    {selectedAnnouncement.created_at}
                  </span>
                </div>

                {/* File Attachments (if exist) - Mobile responsive layout */}
                {selectedAnnouncement.file &&
                  selectedAnnouncement.file.length > 0 && (
                    <div className="space-y-2">
                      {selectedAnnouncement.file.map((file) => {
                        // Check if this is a link (YouTube, website, etc.) or a file
                        const isLinkAttachment = isLink(file);

                        return (
                          <div
                            key={file.id}
                            className="bg-[var(--light-primary-color)] rounded-lg p-2 sm:p-3 flex items-center justify-between border border-gray-200 gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900 text-xs sm:text-sm font-medium truncate block text-left rtl:text-right">
                                {file.file_name ||
                                  (isLinkAttachment
                                    ? translate('link')
                                    : translate('attachment'))}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {/* Show file extension for files, or "Link" badge for links */}
                                {isLinkAttachment ? (
                                  <span className="text-[var(--primary-color)] text-xs font-medium">
                                    {file.type_detail}
                                  </span>
                                ) : (
                                  file.file_extension && (
                                    <span className="text-gray-500 text-xs uppercase">
                                      {file.file_extension}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                            {/* Show link icon for links, download icon for files */}
                            <button
                              onClick={() =>
                                handleDownloadAttachment(file.file_url)
                              }
                              className="bg-(--primary-color) text-white p-1.5 sm:p-2 rounded hover:bg-(--primary-color)/90 transition-colors flex-shrink-0"
                              title={
                                isLinkAttachment
                                  ? translate('openLink')
                                  : translate('downloadFile')
                              }
                            >
                              {isLinkAttachment ? (
                                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Description - Mobile responsive text sizing */}
                <div className="bg-[var(--light-primary-color)] rounded-lg p-3 sm:p-4">
                  <p className="text-[var(--primary-color)] text-sm sm:text-base font-normal leading-relaxed">
                    {selectedAnnouncement.description}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
