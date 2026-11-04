'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Link from 'next/link';
import {
  Lesson,
  getSubjectAnnouncements,
  SubjectAnnouncement,
} from '@/lib/api/student/functions';
import { useSubjectDetails, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import {
  BiHomeSmile,
  BiBookOpen,
  BiChevronDown,
  BiLink,
  BiPlay,
  BiLinkExternal,
  BiDownload,
  BiPlayCircle,
  BiX,
  BiPause,
} from 'react-icons/bi';
import { CustomTabs, TabContent } from '@/components/ui/custom-tabs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useTranslate } from '@/components/hooks/useTranslate';

// Define the chapter data structure
interface ChapterFile {
  id: string;
  name: string;
  type: 'link' | 'file' | 'pdf' | 'image';
  url: string;
}

interface ChapterMedia {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  files: ChapterFile[];
  media: ChapterMedia[];
  isExpanded: boolean;
  secondaryTitle?: string;
  secondaryDescription?: string;
}

// Helper function to transform API lesson data to Chapter format
const transformLessonToChapter = (lesson: Lesson): Chapter => {
  // Separate files based on type_detail
  const mediaFiles: ChapterMedia[] = [];
  const attachedFiles: ChapterFile[] = [];

  lesson.file.forEach((file) => {
    if (
      file.type_detail === 'Video Upload' ||
      file.type_detail === 'Youtube Link'
    ) {
      // Video files go to media section (for modal and upcoming videos)
      mediaFiles.push({
        id: file.id.toString(),
        title: file.file_name,
        thumbnail: file.file_thumbnail || file.youtube_url_action?.img || '',
        url: file.file_url,
      });
    } else {
      // Other files go to attached files section
      // Create full filename with extension
      const fullFileName = file.file_extension
        ? `${file.file_name}.${file.file_extension}`
        : file.file_name;

      attachedFiles.push({
        id: file.id.toString(),
        name: fullFileName,
        type: getFileType(file.file_extension, file.type_detail),
        url: file.file_url,
      });
    }
  });

  return {
    id: lesson.id.toString(),
    title: lesson.name,
    description: lesson.description,
    files: attachedFiles,
    media: mediaFiles,
    isExpanded: false,
    secondaryTitle: 'chapterDescription', // Store the key, translate later
    secondaryDescription: lesson.description,
  };
};

// Helper function to determine file type based on extension and type_detail
const getFileType = (
  extension: string,
  typeDetail: string
): 'link' | 'file' | 'pdf' | 'image' => {
  if (typeDetail === 'Other Link') return 'link';
  if (extension === 'pdf') return 'pdf';
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(
      extension.toLowerCase()
    )
  )
    return 'image';
  return 'file';
};

// Helper function to transform API announcement data to UI format
const transformAnnouncementToUI = (
  apiAnnouncement: SubjectAnnouncement
): Announcement => {
  // Separate files based on type_detail
  const mediaFiles: AnnouncementMedia[] = [];
  const attachedFiles: AnnouncementFile[] = [];

  apiAnnouncement.file.forEach((file) => {
    if (
      file.type_detail === 'Video Upload' ||
      file.type_detail === 'Youtube Link'
    ) {
      // Video files go to media section
      mediaFiles.push({
        id: file.id.toString(),
        title: file.file_name,
        thumbnail: file.file_thumbnail || '',
        url: file.file_url,
      });
    } else {
      // Other files go to attached files section
      // Check if file_name already has an extension to avoid duplication
      let fullFileName = file.file_name;

      // For links, use the URL as the display name if file_name is empty or just a URL
      if (
        file.type_detail === 'Other Link' &&
        (!file.file_name || file.file_name.startsWith('http'))
      ) {
        fullFileName = file.file_url;
      } else if (file.file_extension && !file.file_name.includes('.')) {
        fullFileName = `${file.file_name}.${file.file_extension}`;
      }

      attachedFiles.push({
        id: file.id.toString(),
        name: fullFileName,
        type: getFileType(file.file_extension, file.type_detail),
        url: file.file_url,
      });
    }
  });

  return {
    id: apiAnnouncement.id.toString(),
    title: apiAnnouncement.title,
    description: apiAnnouncement.description,
    content: apiAnnouncement.description, // Use description as content
    files: attachedFiles,
    media: mediaFiles,
    createdAt: apiAnnouncement.created_at,
    updatedAt: apiAnnouncement.updated_at,
    isImportant: false, // API doesn't provide this field, default to false
    author: 'Teacher', // API doesn't provide author, use default
  };
};

// Define the announcement data structure
interface AnnouncementFile {
  id: string;
  name: string;
  type: 'link' | 'file' | 'pdf' | 'image';
  url: string;
}

interface AnnouncementMedia {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  content: string;
  files: AnnouncementFile[];
  media: AnnouncementMedia[];
  createdAt: string;
  updatedAt: string;
  isImportant: boolean;
  author: string;
}

// We'll fetch the subject data dynamically from the API instead of hardcoding

import { useParams } from 'next/navigation';



/**
 * Subject Details Page Component
 *
 * Displays detailed information about a specific subject including:
 * - Chapter listings with descriptions
 * - Attached files and media
 * - Tab navigation (Chapter/Announcement)
 * - Expandable chapter sections
 */
export default function SubjectDetailsPage() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();
  
  // Get params directly from client router
  const params = useParams();
  const subjectId = params?.subjectId as string;

  // Fetch school settings to check for feature access
  const { data: schoolSettings } = useGetSchoolSettings();
  const enabledFeatures = React.useMemo(
    () => schoolSettings?.data?.features || {},
    [schoolSettings]
  );

  const isFeatureEnabled = React.useCallback((featureName: string) => {
    if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
      return false;
    }
    return Object.values(enabledFeatures).some(
      (feature) =>
        typeof feature === 'string' &&
        feature.toLowerCase() === featureName.toLowerCase()
    );
  }, [enabledFeatures]);

  const isAnnouncementManagementEnabled = isFeatureEnabled('Announcement Management');
  const isLessonManagementEnabled = isFeatureEnabled('Lesson Management');

  // Determine available tabs based on features
  const tabItems = React.useMemo(() => {
    const items = [];
    if (isLessonManagementEnabled) {
      items.push({ id: 'chapter', label: translate('chapter') });
    }
    if (isAnnouncementManagementEnabled) {
      items.push({ id: 'announcement', label: translate('announcement') });
    }
    return items;
  }, [isLessonManagementEnabled, isAnnouncementManagementEnabled, translate]);

  // Set initial active tab to the first available tab
  const [activeTab, setActiveTab] = useState<string>('');

  // Update active tab when tabItems change
  React.useEffect(() => {
    if (tabItems.length === 0) {
      if (activeTab !== '') setActiveTab('');
    } else if (!tabItems.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabItems[0].id);
    }
  }, [tabItems, activeTab]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMedia, setExpandedMedia] = useState<Set<string>>(new Set());
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<
    Set<string>
  >(new Set());
  const [expandedAnnouncementFiles, setExpandedAnnouncementFiles] = useState<
    Set<string>
  >(new Set());
  const [expandedAnnouncementMedia, setExpandedAnnouncementMedia] = useState<
    Set<string>
  >(new Set());

  // Video modal state management
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ChapterMedia | null>(null);
  const [allVideos, setAllVideos] = useState<ChapterMedia[]>([]);
  const [currentChapterVideos, setCurrentChapterVideos] = useState<
    ChapterMedia[]
  >([]);

  // Fetch subject details using TanStack Query
  const {
    data: subjectDetails,
    isLoading,
    error,
  } = useSubjectDetails(subjectId);

  // Transform lessons to chapters
  const chapters = React.useMemo(() => {
    if (!subjectDetails?.lessons) {
      return [];
    }
    return subjectDetails.lessons.map((lesson) =>
      transformLessonToChapter(lesson)
    );
  }, [subjectDetails?.lessons]);

  // Set subject name
  const subjectName = subjectDetails?.subject?.name || translate('subject');

  // Collect all videos from all chapters
  React.useEffect(() => {
    if (chapters.length > 0) {
      const allVideosFromChapters = chapters.flatMap((chapter) =>
        chapter.media.map((video) => ({
          ...video,
          id: `${chapter.id}-${video.id}`, // Create unique ID by combining chapter and video ID
        }))
      );
      setAllVideos(allVideosFromChapters);
    }
  }, [chapters]);

  // Announcements loading and error states
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(
    null
  );

  // Fetch announcements when subject details are loaded
  React.useEffect(() => {
    const fetchAnnouncements = async () => {
      // Only fetch if the feature is enabled and class_subject_id is available
      if (!subjectDetails?.subject?.class_subject_id || !isAnnouncementManagementEnabled) return;

      try {
        setIsAnnouncementsLoading(true);
        setAnnouncementsError(null);
        const announcementsResponse = await getSubjectAnnouncements({
          type: 'subject',
          class_subject_id: subjectDetails.subject.class_subject_id,
        });

        if (!announcementsResponse.success) {
          throw new Error(
            announcementsResponse.message || 'Failed to fetch announcements'
          );
        }

        // Transform API data to UI format
        const transformedAnnouncements =
          announcementsResponse.data?.data?.map(transformAnnouncementToUI) ||
          [];

        setAnnouncements(transformedAnnouncements);
      } catch (err) {
        setAnnouncementsError(
          err instanceof Error ? err.message : 'Failed to fetch announcements'
        );
        setAnnouncements([]);
      } finally {
        setIsAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [subjectDetails?.subject?.class_subject_id, isAnnouncementManagementEnabled]);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('mySubject'),
      href: '/student/subjects',
    },
    {
      label: subjectName,
    },
  ];

  // State for expanded chapters
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // Toggle files section expansion
  const toggleFiles = (chapterId: string) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // Toggle media section expansion
  const toggleMedia = (chapterId: string) => {
    setExpandedMedia((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // Toggle announcement expansion
  const toggleAnnouncement = (announcementId: string) => {
    setExpandedAnnouncements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
  };

  // Toggle announcement files section expansion
  const toggleAnnouncementFiles = (announcementId: string) => {
    setExpandedAnnouncementFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
  };

  // Toggle announcement media section expansion
  const toggleAnnouncementMedia = (announcementId: string) => {
    setExpandedAnnouncementMedia((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
  };

  // Helper function to check if a file is an image
  const isImageFile = (fileName: string, type: string) => {
    if (type === 'image') return true;
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.svg',
    ];
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  // Helper function to check if a file is a link
  const isLinkFile = (fileName: string, type: string) => {
    if (type === 'link') return true;
    return fileName.startsWith('http://') || fileName.startsWith('https://');
  };

  // Handle file click based on type
  const handleFileClick = (file: ChapterFile | AnnouncementFile) => {
    if (isImageFile(file.name, file.type)) {
      // Download image file
      downloadFile(file.url, file.name);
    } else if (isLinkFile(file.name, file.type)) {
      // Open link in new tab
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else {
      // For other file types, try to download
      downloadFile(file.url, file.name);
    }
  };

  // Download file function
  const downloadFile = (url: string, fileName: string) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get file icon based on type
  const getFileIcon = (type: string, fileName: string) => {
    if (isImageFile(fileName, type)) {
      return <BiDownload className="w-4 h-4 text-black" />;
    } else if (isLinkFile(fileName, type)) {
      return <BiLinkExternal className="w-4 h-4 text-black" />;
    } else {
      return <BiDownload className="w-4 h-4 text-black" />;
    }
  };

  // Handle video play - open modal with selected video
  const handleVideoPlay = (media: ChapterMedia, chapterId: string) => {
    setSelectedVideo(media);

    // Filter videos to show only from the current chapter
    const chapterVideos = allVideos.filter((video) =>
      video.id.startsWith(`${chapterId}-`)
    );

    setCurrentChapterVideos(chapterVideos);

    setIsVideoModalOpen(true);
  };

  // Handle video selection from upcoming videos list
  const handleVideoSelect = (media: ChapterMedia) => {
    setSelectedVideo(media);
  };

  // Convert filename to readable title
  const getVideoTitle = (filename: string) => {
    return filename
      .replace('.mp4', '') // Remove file extension
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word
  };

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={subjectName} items={breadcrumbItems} />

      {/* Custom Tabs */}
      <div className=" bg-white rounded-lg border border-gray-200">
        {tabItems.length > 0 ? (
          <CustomTabs
            items={tabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-6 bg-white border-b border-gray-200 px-6 pt-4"
            buttonClassName="px-0 pb-3 pt-0"
            isActiveClassName="bg-white pb-3 pt-0"
          />
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
            <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {translate('noFeaturesEnabled')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 px-4">
              {translate('noFeaturesEnabledMessage')}
            </p>
          </div>
        )}

        {/* Chapter Tab Content */}
        <TabContent value="chapter" activeTab={activeTab}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
                <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {translate('loadingChapters')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {translate('loadingChaptersMessage')}
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
                <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {translate('errorLoadingChapters')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {error instanceof Error
                    ? error.message
                    : translate('failedToLoadChapters')}
                </p>
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
                <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {translate('noChaptersAvailable')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {translate('noChaptersAvailableMessage')}
                </p>
              </div>
            ) : (
              chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="bg-[var(--light-primary-color)] rounded-lg border border-gray-200 p-3 sm:p-4 m-2 sm:m-4"
                >
                  {/* Chapter Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#5D5D5D] mb-2">
                          {chapter.title}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm font-normal leading-relaxed">
                          {chapter.description}
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-4">
                        <h3 className="text-sm sm:text-base font-bold text-[#5D5D5D] mb-2">
                          {translate(
                            chapter.secondaryTitle || 'chapterDescription'
                          )}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm font-normal leading-relaxed">
                          {chapter.secondaryDescription}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Stack buttons vertically, Desktop: Horizontal layout */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:gap-x-2 sm:ms-4">
                      <Link
                        href={`/student/subjects/${subjectId}/lessons/${chapter.id}`}
                      >
                        <button className="bg-[var(--secondary-color)] hover:bg-[#22577A]/90 text-white text-xs sm:text-base font-normal py-2 px-3 sm:py-1 sm:px-2 rounded-[4px] w-full sm:w-auto">
                          {translate('viewTopics')}
                        </button>
                      </Link>
                      {/* Only show expand button if there are files or media to expand */}
                      {(chapter.files.length > 0 ||
                        chapter.media.length > 0) && (
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="text-xs sm:text-base font-normal rounded-[4px] bg-(--primary-color) py-2 px-3 sm:py-2 sm:px-2 text-white transition-all duration-200 hover:bg-(--primary-color)/80 w-full sm:w-auto flex items-center justify-center"
                        >
                          <div
                            className={`transition-transform duration-300 ${
                              expandedChapters.has(chapter.id)
                                ? 'rotate-180'
                                : 'rotate-0'
                            }`}
                          >
                            <BiChevronDown className="text-lg sm:text-xl text-white" />
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chapter Content - Smooth transition */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedChapters.has(chapter.id)
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4 pt-4">
                        {/* Attached Files */}
                        {chapter.files.length > 0 && (
                          <div>
                            <div className="text-sm sm:text-base font-normal mb-2">
                              <p>{translate('chapterReferenceMaterial')}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <BiLink className="text-xl sm:text-2xl text-gray-800 me-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                                  <span className="text-xs sm:text-sm font-normal text-gray-700">
                                    {translate('attachedFiles')}
                                  </span>
                                </div>
                                <button
                                  onClick={() => toggleFiles(chapter.id)}
                                  className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                                >
                                  <div
                                    className={`transition-transform duration-300 ${
                                      expandedFiles.has(chapter.id)
                                        ? 'rotate-180'
                                        : 'rotate-0'
                                    }`}
                                  >
                                    <BiChevronDown className="text-lg sm:text-xl text-[var(--primary-color)]" />
                                  </div>
                                </button>
                              </div>
                              <div
                                className={`grid transition-all duration-300 ease-in-out ${
                                  expandedFiles.has(chapter.id)
                                    ? 'grid-rows-[1fr] opacity-100 mt-4'
                                    : 'grid-rows-[0fr] opacity-0'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="space-y-2">
                                    {chapter.files.map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between p-2 sm:p-3 bg-[var(--light-primary-color)] rounded-[4px] border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                                        onClick={() => handleFileClick(file)}
                                      >
                                        <div className="flex items-center gap-x-2 sm:gap-x-3 flex-1 min-w-0">
                                          <span className="text-xs sm:text-sm text-gray-700 truncate">
                                            {file.name}
                                          </span>
                                        </div>
                                        <button
                                          className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileClick(file);
                                          }}
                                        >
                                          {getFileIcon(file.type, file.name)}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attached Media */}
                        {chapter.media.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <BiPlayCircle className="text-xl sm:text-2xl text-gray-800 me-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                                <span className="text-xs sm:text-sm font-normal text-gray-700">
                                  {translate('attachedMedia')}
                                </span>
                              </div>
                              <button
                                onClick={() => toggleMedia(chapter.id)}
                                className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                              >
                                <div
                                  className={`transition-transform duration-300 ${
                                    expandedMedia.has(chapter.id)
                                      ? 'rotate-180'
                                      : 'rotate-0'
                                  }`}
                                >
                                  <BiChevronDown className="text-lg sm:text-xl text-[var(--primary-color)]" />
                                </div>
                              </button>
                            </div>
                            <div
                              className={`grid transition-all duration-300 ease-in-out ${
                                expandedMedia.has(chapter.id)
                                  ? 'grid-rows-[1fr] opacity-100 mt-4'
                                  : 'grid-rows-[0fr] opacity-0'
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="space-y-2">
                                  {chapter.media.map((media) => (
                                    <div
                                      key={media.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-[var(--light-primary-color)] rounded-[4px] border border-gray-200 space-y-2 sm:space-y-0"
                                    >
                                      <div className="flex items-center gap-x-2 sm:gap-x-3 flex-1 min-w-0">
                                        <div className="w-[70px] h-[40px] sm:w-[94px] sm:h-[53px] bg-[#EAEAEA] rounded-[4px] flex items-center justify-center flex-shrink-0">
                                          <Image
                                            src={media.thumbnail}
                                            alt={media.title}
                                            width={0}
                                            height={0}
                                            className="w-full h-full object-cover rounded-[4px]"
                                          />
                                        </div>
                                        <span className="text-xs sm:text-sm font-normal text-gray-900 truncate">
                                          {media.title}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleVideoPlay(media, chapter.id)
                                        }
                                        className="bg-(--primary-color) hover:bg-(--primary-color)/80 text-white text-xs sm:text-sm font-normal rounded-[4px] py-2 px-3 sm:py-1 sm:px-2 flex items-center justify-center gap-1 w-full sm:w-auto"
                                      >
                                        <BiPlay className="text-lg sm:text-xl text-white" />
                                        {translate('play')}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabContent>

        {/* Announcement Tab Content */}
        <TabContent value="announcement" activeTab={activeTab}>
          <div className="space-y-4">
            {isAnnouncementsLoading ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
                <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {translate('loadingAnnouncements')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {translate('loadingAnnouncementsMessage')}
                </p>
              </div>
            ) : announcementsError ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
                <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {translate('errorLoadingAnnouncements')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {announcementsError}
                </p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
                <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {translate('noAnnouncements')}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  {translate('noAnnouncementsMessage')}
                </p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-[var(--light-primary-color)] rounded-lg border border-gray-200 p-3 sm:p-4 m-2 sm:m-4"
                >
                  {/* Announcement Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#5D5D5D] mb-2">
                          {announcement.title}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm font-normal leading-relaxed">
                          {announcement.description}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Stack buttons vertically, Desktop: Horizontal layout */}
                    {/* Only show expand button if there are files or media to expand */}
                    {(announcement.files.length > 0 ||
                      announcement.media.length > 0) && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:gap-x-2 sm:ms-4">
                        <button
                          onClick={() => toggleAnnouncement(announcement.id)}
                          className="text-xs sm:text-base font-normal rounded-[4px] bg-(--primary-color) py-2 px-3 sm:py-2 sm:px-2 text-white transition-all duration-200 hover:bg-(--primary-color)/80 w-full sm:w-auto flex items-center justify-center"
                        >
                          <div
                            className={`transition-transform duration-300 ${
                              expandedAnnouncements.has(announcement.id)
                                ? 'rotate-180'
                                : 'rotate-0'
                            }`}
                          >
                            <BiChevronDown className="text-lg sm:text-xl text-white" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Announcement Content - Smooth transition */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedAnnouncements.has(announcement.id)
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4 pt-4">
                        {/* Attached Files */}
                        {announcement.files.length > 0 && (
                          <div>
                            <div className="text-sm sm:text-base font-normal mb-2">
                              <p>
                                {translate('announcementReferenceMaterial')}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <BiLink className="text-xl sm:text-2xl text-gray-800 me-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                                  <span className="text-xs sm:text-sm font-normal text-gray-700">
                                    {translate('attachedFiles')}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    toggleAnnouncementFiles(announcement.id)
                                  }
                                  className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                                >
                                  <div
                                    className={`transition-transform duration-300 ${
                                      expandedAnnouncementFiles.has(
                                        announcement.id
                                      )
                                        ? 'rotate-180'
                                        : 'rotate-0'
                                    }`}
                                  >
                                    <BiChevronDown className="text-lg sm:text-xl text-[var(--primary-color)]" />
                                  </div>
                                </button>
                              </div>
                              <div
                                className={`grid transition-all duration-300 ease-in-out ${
                                  expandedAnnouncementFiles.has(announcement.id)
                                    ? 'grid-rows-[1fr] opacity-100 mt-4'
                                    : 'grid-rows-[0fr] opacity-0'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="space-y-2">
                                    {announcement.files.map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between p-2 sm:p-3 bg-[var(--light-primary-color)] rounded-[4px] border border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                                        onClick={() => handleFileClick(file)}
                                      >
                                        <div className="flex items-center gap-x-2 sm:gap-x-3 flex-1 min-w-0">
                                          <span className="text-xs sm:text-sm text-gray-700 truncate">
                                            {file.name}
                                          </span>
                                        </div>
                                        <button
                                          className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileClick(file);
                                          }}
                                        >
                                          {getFileIcon(file.type, file.name)}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attached Media */}
                        {announcement.media.length > 0 && (
                          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <BiPlayCircle className="text-xl sm:text-2xl text-gray-800 me-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                                <span className="text-xs sm:text-sm font-normal text-gray-700">
                                  {translate('attachedMedia')}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  toggleAnnouncementMedia(announcement.id)
                                }
                                className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                              >
                                <div
                                  className={`transition-transform duration-300 ${
                                    expandedAnnouncementMedia.has(
                                      announcement.id
                                    )
                                      ? 'rotate-180'
                                      : 'rotate-0'
                                  }`}
                                >
                                  <BiChevronDown className="text-lg sm:text-xl text-[var(--primary-color)]" />
                                </div>
                              </button>
                            </div>
                            <div
                              className={`grid transition-all duration-300 ease-in-out ${
                                expandedAnnouncementMedia.has(announcement.id)
                                  ? 'grid-rows-[1fr] opacity-100 mt-4'
                                  : 'grid-rows-[0fr] opacity-0'
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="space-y-2">
                                  {announcement.media.map((media) => (
                                    <div
                                      key={media.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-[var(--light-primary-color)] rounded-[4px] border border-gray-200 space-y-2 sm:space-y-0"
                                    >
                                      <div className="flex items-center gap-x-2 sm:gap-x-3 flex-1 min-w-0">
                                        <div className="w-[70px] h-[40px] sm:w-[94px] sm:h-[53px] bg-[#EAEAEA] rounded-[4px] flex items-center justify-center flex-shrink-0">
                                          <Image
                                            src={media.thumbnail}
                                            alt={media.title}
                                            width={0}
                                            height={0}
                                            className="w-full h-full object-cover rounded-[4px]"
                                          />
                                        </div>
                                        <span className="text-xs sm:text-sm font-normal text-gray-900 truncate">
                                          {media.title}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleVideoPlay(
                                            media,
                                            announcement.id
                                          )
                                        }
                                        className="bg-(--primary-color) hover:bg-(--primary-color)/80 text-white text-xs sm:text-sm font-normal rounded-[4px] py-2 px-3 sm:py-1 sm:px-2 flex items-center justify-center gap-1 w-full sm:w-auto"
                                      >
                                        <BiPlay className="text-lg sm:text-xl text-white" />
                                        {translate('play')}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabContent>
      </div>

      {/* Video Player Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent
          className="!w-[95vw] !max-w-[1200px] !max-h-[90vh] p-0 bg-white"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-200 p-3 sm:p-4">
            <DialogTitle className="text-gray-900 text-lg sm:text-xl font-bold">
              {translate('playingVideos')}
            </DialogTitle>
            <DialogClose>
              <BiX className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-gray-400 bg-[var(--light-primary-color)] border border-gray-200 rounded-[4px] p-1 flex-shrink-0" />
            </DialogClose>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-full px-2 sm:px-4 pb-3 sm:pb-4">
            {/* Main Video Player - Left Side (7 columns on large screens, full width on mobile) */}
            <div className="col-span-1 lg:col-span-7 flex flex-col">
              {selectedVideo && (
                <div className="relative flex-1">
                  {/* Video Player */}
                  <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] flex items-center justify-center rounded-[4px]">
                    {selectedVideo.url.includes('youtube.com') ||
                    selectedVideo.url.includes('youtu.be') ? (
                      // YouTube video - use iframe
                      <iframe
                        key={selectedVideo.id}
                        src={selectedVideo.url
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full rounded-[4px]"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedVideo.title}
                      />
                    ) : (
                      // Direct video file
                      <video
                        key={selectedVideo.id}
                        className="w-full h-full object-contain rounded-[4px]"
                        controls
                        autoPlay
                        preload="metadata"
                      >
                        <source src={selectedVideo.url} type="video/mp4" />
                        <source src={selectedVideo.url} type="video/webm" />
                        <source src={selectedVideo.url} type="video/ogg" />
                        {translate('browserDoesNotSupportVideo')}
                      </video>
                    )}
                  </div>

                  {/* Video Title */}
                  <div className="mt-2 sm:mt-4">
                    <h3 className="text-black text-sm sm:text-lg lg:text-xl font-bold">
                      {getVideoTitle(selectedVideo.title)}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Videos - Right Side (5 columns on large screens, full width on mobile) */}
            <div className="col-span-1 lg:col-span-5 bg-white flex flex-col">
              <div className="mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                  {translate('upcomingVideos')}
                </h3>
              </div>

              <div className="flex-1">
                <div className="space-y-1 sm:space-y-2 overflow-y-auto h-[300px] sm:h-[400px]">
                  {currentChapterVideos.filter(
                    (video) => video.id !== selectedVideo?.id
                  ).length === 0 ? (
                    <div className="text-center py-8">
                      <BiPlay className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {translate('noMoreVideosInChapter')}
                      </p>
                    </div>
                  ) : (
                    currentChapterVideos
                      .filter((video) => video.id !== selectedVideo?.id)
                      .map((video) => (
                        <div
                          key={video.id}
                          className={`mt-2 sm:mt-4 me-2 sm:me-4 flex items-center gap-x-2 sm:gap-x-3 p-2 rounded-[4px] cursor-pointer transition-colors bg-white hover:bg-[var(--light-primary-color)] border border-gray-200 ${
                            selectedVideo?.id === video.id
                              ? 'bg-blue-50 border-blue-200'
                              : ''
                          }`}
                          onClick={() => handleVideoSelect(video)}
                        >
                          {/* Video Info - First on mobile, second on desktop */}
                          <div className="flex-1 min-w-0 order-1 lg:order-2">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {video.title}
                            </p>
                          </div>

                          {/* Video Thumbnail - Second on mobile, first on desktop */}
                          <div className="w-[60px] h-[34px] sm:w-[94px] sm:h-[53px] bg-gray-200 rounded flex items-center justify-center flex-shrink-0 order-2 lg:order-1">
                            <Image
                              src={video.thumbnail}
                              alt={video.title}
                              width={0}
                              height={0}
                              className="w-full h-full object-cover rounded-[4px]"
                            />
                          </div>

                          {/* Play/Pause Icon */}
                          <div className="flex-shrink-0">
                            {selectedVideo?.id === video.id ? (
                              <BiPause className="text-lg sm:text-2xl text-black" />
                            ) : (
                              <BiPlay className="text-lg sm:text-2xl text-black" />
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
