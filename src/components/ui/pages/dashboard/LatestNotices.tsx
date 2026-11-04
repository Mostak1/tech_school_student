'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BiX } from 'react-icons/bi';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { useGetAnnouncements } from '@/lib/api/student/queryHooks';
import type { Announcement } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function LatestNotices() {
  const translate = useTranslate();
  // State to manage which notice modal is open
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(
    null
  );

  // Fetch announcements from API with type 'class'
  // This will automatically handle loading states, caching, and error handling
  const { data, isLoading, error } = useGetAnnouncements({ type: 'class' });

  // Handler for opening modal with selected announcement
  const handleViewDetails = (announcement: Announcement) => {
    setSelectedNotice(announcement);
  };

  // Handler for closing modal
  const handleCloseModal = () => {
    setSelectedNotice(null);
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
    <div className="bg-white rounded-[12px] border border-gray-200">
      <h2 className="text-lg sm:text-xl font-medium text-gray-800 border-b border-gray-200 p-3 sm:p-4 md:p-6 leading-relaxed">
        {translate('latestNotices')}
      </h2>

      {/* Loading State - Show spinner while fetching data */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-color)]" />
        </div>
      )}

      {/* Error State - Show error message if API fails */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-3 sm:m-4 md:m-6">
          <p className="text-red-600 text-sm">
            {translate('failedToLoadAnnouncements')}
          </p>
        </div>
      )}

      {/* Empty State - Show message when no announcements are available */}
      {!isLoading && !error && announcements.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 m-3 sm:m-4 md:m-6 text-center">
          <p className="text-gray-600 text-sm">
            {translate('noAnnouncementsAvailable')}
          </p>
        </div>
      )}

      {/* Announcements List - Show when data is loaded successfully */}
      {!isLoading && !error && announcements.length > 0 && (
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          {announcements.slice(0, 6).map((announcement) => (
            <div
              key={announcement.id}
              className="bg-[var(--light-primary-color)] p-3 sm:p-4 rounded-[12px] border border-gray-200"
            >
              <div className="flex flex-wrap flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-4">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-1 leading-relaxed">
                    {announcement.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed line-clamp-1 sm:line-clamp-1">
                    {announcement.description}
                  </p>
                </div>
                <button
                  onClick={() => handleViewDetails(announcement)}
                  className="bg-(--primary-color) leading-relaxed text-white px-3 sm:px-4 py-2 sm:py-2 rounded-[8px] text-xs sm:text-sm font-normal hover:bg-(--primary-color)/80 transition-colors whitespace-nowrap w-full sm:w-auto"
                >
                  {translate('viewDetails')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing notice details */}
      <Dialog open={selectedNotice !== null} onOpenChange={handleCloseModal}>
        <DialogContent
          className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] p-0 overflow-hidden"
          showCloseButton={false}
        >
          {selectedNotice && (
            <>
              {/* Modal Header - Mobile responsive with better spacing */}
              <DialogHeader className="flex flex-row items-start justify-between border-b p-3 sm:p-6">
                <DialogTitle className="text-sm sm:text-base text-left font-bold text-gray-900 pr-2 sm:pr-4 leading-tight flex-1">
                  {selectedNotice.title}
                </DialogTitle>
                <DialogClose
                  onClick={handleCloseModal}
                  className="flex-shrink-0"
                >
                  <BiX className="w-5 h-5 sm:w-8 sm:h-8 cursor-pointer text-gray-400 bg-[var(--light-primary-color)] border border-gray-200 rounded-[4px] p-1" />
                </DialogClose>
              </DialogHeader>

              {/* Modal Content - Mobile responsive with proper scrolling */}
              <div className="p-3 sm:p-6 !pt-0 space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Date Tag - Mobile responsive sizing */}
                <div className="flex items-start">
                  <span className="bg-(--primary-color) text-white text-sm sm:text-base font-normal px-2 py-1 sm:px-3 sm:py-2 rounded-[4px]">
                    {selectedNotice.created_at}
                  </span>
                </div>

                {/* File Attachments (if exist) - Mobile responsive layout */}
                {selectedNotice.file && selectedNotice.file.length > 0 && (
                  <div className="space-y-2">
                    {selectedNotice.file.map((file) => {
                      // Check if this is a link (YouTube, website, etc.) or a file
                      const isLinkAttachment = isLink(file);

                      return (
                        <div
                          key={file.id}
                          className="bg-[var(--light-primary-color)] rounded-lg p-2 sm:p-3 flex items-center justify-between border border-gray-200 gap-2"
                        >
                          <div className="flex-1 min-w-0 max-w-[200px] sm:max-w-[300px]">
                            <span className="text-gray-900 text-xs sm:text-sm font-medium block break-all">
                              {isLinkAttachment
                                ? file.file_url
                                : file.file_name || translate('attachment')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {/* Show file extension for files, or "Link" badge for links */}
                              {isLinkAttachment ? (
                                <span className="text-[var(--primary-color)] text-xs font-medium">
                                  {file.type_detail || translate('link')}
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
                    {selectedNotice.description}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
