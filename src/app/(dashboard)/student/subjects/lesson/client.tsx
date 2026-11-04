'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useLessonTopics } from '@/lib/api/student/queryHooks';
import { LessonTopicFile } from '@/lib/api/student/functions';
import { useSearchParams } from 'next/navigation';
import { useTranslate } from '@/components/hooks/useTranslate';

// Define the topic data structure based on API response
interface TopicFile {
  id: string;
  name: string;
  type: 'link' | 'file' | 'pdf' | 'image' | 'video' | 'youtube';
  url: string;
  thumbnail?: string;
  typeDetail: string;
}

interface TopicMedia {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  typeDetail: string; // Store the type_detail to determine if it's YouTube or direct video
}

/**
 * Topic Page Component
 *
 * Displays detailed information about a specific topic including:
 * - Topic title and description from API
 * - Attached files and media
 * - Expandable topic sections
 * - Video player modal for media content
 */
export default function TopicPage() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();

  // Get params directly from client router
  const searchParams = useSearchParams();

  // Safely cast params since we know the route structure
  const resolvedParams = {
    subjectId: searchParams.get('subjectId') || '',
    lessonId: searchParams.get('lessonId') || '',
  };

  // UI state management
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedMedia, setExpandedMedia] = useState<Set<string>>(new Set());

  // Video modal state management
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TopicMedia | null>(null);
  const [allVideos, setAllVideos] = useState<TopicMedia[]>([]);

  // Convert subjectId and lessonId to numbers
  const lessonId = parseInt(resolvedParams.lessonId);

  // Get file type based on type_detail
  const getFileType = (typeDetail: string): TopicFile['type'] => {
    switch (typeDetail) {
      case 'File Upload':
        return 'file';
      case 'Youtube Link':
        return 'youtube';
      case 'Video Upload':
        return 'video';
      case 'Other Link':
        return 'link';
      default:
        return 'file';
    }
  };

  // Transform API files to our component structure (exclude videos)
  const transformFiles = React.useCallback(
    (apiFiles: LessonTopicFile[]): TopicFile[] => {
      return apiFiles
        .filter(
          (file) =>
            file.type_detail !== 'Video Upload' &&
            file.type_detail !== 'Youtube Link',
        )
        .map((file) => ({
          id: file.id.toString(),
          name: file.file_name,
          type: getFileType(file.type_detail),
          url: file.file_url,
          thumbnail: file.file_thumbnail,
          typeDetail: file.type_detail,
        }));
    },
    [],
  );

  // Transform API files to media structure for videos
  // Include type_detail to determine if video should use iframe (YouTube) or video tag (direct upload)
  const transformMedia = (apiFiles: LessonTopicFile[]): TopicMedia[] => {
    return apiFiles
      .filter(
        (file) =>
          file.type_detail === 'Video Upload' ||
          file.type_detail === 'Youtube Link',
      )
      .map((file) => ({
        id: file.id.toString(),
        title: file.file_name,
        thumbnail: file.file_thumbnail,
        url: file.file_url,
        typeDetail: file.type_detail, // Store type_detail to determine rendering method
      }));
  };

  // Fetch topics data using the custom hook
  const { data: topicsResponse, isLoading, error } = useLessonTopics(lessonId);

  // Transform the data
  const allTopics = React.useMemo(() => {
    if (!topicsResponse?.success || !topicsResponse.data) {
      return [];
    }

    // Helper to parse "DD/MM/YYYY HH:MM" to Date object
    const parseDate = (dateString: string) => {
      if (!dateString) return new Date(0);
      try {
        const [datePart, timePart] = dateString.split(' ');
        if (!datePart) return new Date(0);

        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart ? timePart.split(':') : ['0', '0'];

        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour || '0'),
          parseInt(minute || '0'),
        );
      } catch {
        return new Date(0);
      }
    };

    // Sort by created_at descending (latest first)
    const sortedData = [...topicsResponse.data].sort((a, b) => {
      const dateA = parseDate(a.created_at);
      const dateB = parseDate(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedData.map((topicData) => ({
      id: topicData.id.toString(),
      title: topicData.name,
      description: topicData.description,
      content: topicData.description,
      isExpanded: true,
      files: transformFiles(topicData.file),
      media: transformMedia(topicData.file),
    }));
  }, [topicsResponse, transformFiles]);

  // Set the first topic as the main topic
  const topic = allTopics[0] || null;

  // Collect all videos from all topics
  React.useEffect(() => {
    const allVideosFromTopics = allTopics.flatMap((topic) => topic.media);
    setAllVideos(allVideosFromTopics);
  }, [allTopics]);

  // Get subject name from the API response
  // The lesson object is included in each topic, so we can get subject_with_name from the first topic
  const subjectName =
    topicsResponse?.data?.[0]?.lesson?.subject_with_name ||
    translate('subject');

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
      href: `/student/subjects/detail?id=${resolvedParams.subjectId}`,
    },
    {
      label: topic?.title || translate('topicDetail'),
    },
  ];

  // Toggle files section expansion
  const toggleFiles = (topicId: string) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  // Toggle media section expansion
  const toggleMedia = (topicId: string) => {
    setExpandedMedia((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
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
    if (type === 'link' || type === 'youtube') return true;
    return fileName.startsWith('http://') || fileName.startsWith('https://');
  };

  // Handle file click based on type
  const handleFileClick = (file: TopicFile) => {
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
  const handleVideoPlay = (media: TopicMedia) => {
    setSelectedVideo(media);
    setIsVideoModalOpen(true);
  };

  // Handle video selection from upcoming videos list
  const handleVideoSelect = (media: TopicMedia) => {
    setSelectedVideo(media);
  };

  // Convert filename to readable title
  const getVideoTitle = (filename: string) => {
    return filename
      .replace('.mp4', '') // Remove file extension
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word
  };

  // Loading state
  if (isLoading) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb title={translate('loading')} items={breadcrumbItems} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BiBookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{translate('loadingTopic')}</p>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb title={translate('error')} items={breadcrumbItems} />
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
          <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {translate('errorLoadingTopics')}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 px-4">
            {error instanceof Error
              ? error.message
              : translate('failedToLoadTopics')}
          </p>
        </div>
      </Container>
    );
  }

  // Empty state - no topics found
  if (!isLoading && allTopics.length === 0) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('noTopicsAvailable')}
          items={breadcrumbItems}
        />
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200 m-2 sm:m-4">
          <BiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {translate('noTopicsAvailable')}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 px-4">
            {translate('noTopicsMessage')}
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        title={topic?.title || translate('topics')}
        items={breadcrumbItems}
      />

      {/* All Topics Content */}
      <div className="space-y-4 bg-white rounded-lg border border-gray-200">
        {allTopics.map((topicItem) => (
          <div
            key={topicItem.id}
            className="bg-[var(--light-primary-color)] rounded-lg border border-gray-200 p-3 sm:p-4 m-2 sm:m-4 hover:shadow-md transition-shadow duration-200"
          >
            {/* Topic Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex-1">
                {/* Topic Name Block */}
                <div className="flex  gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-[#5D5D5D] mb-2">
                    {translate('topicName')}
                  </h3>
                  <p className="text-gray-800 text-xs sm:text-base font-medium leading-relaxed mb-2">
                    {topicItem.title}
                  </p>
                </div>

                {/* Topic Description Block */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#5D5D5D] mb-2">
                    {translate('topicDescription')}
                  </h3>
                  <p
                    className="text-gray-600 text-xs sm:text-sm font-normal leading-relaxed"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {topicItem.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Topic Content */}
            <div className="space-y-4 pt-4">
              {/* Attached Files */}
              {topicItem.files.length > 0 && (
                <div>
                  <div className="text-sm sm:text-base font-normal mb-2">
                    <p>{translate('topicReferenceMaterial')}</p>
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
                        onClick={() => toggleFiles(topicItem.id)}
                        className="flex items-center border border-(--primary-color) rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                      >
                        <div
                          className={`transition-transform duration-300 ${
                            expandedFiles.has(topicItem.id)
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
                        expandedFiles.has(topicItem.id)
                          ? 'grid-rows-[1fr] opacity-100 mt-4'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-2">
                          {topicItem.files.map((file) => (
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
              {topicItem.media.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BiPlayCircle className="text-xl sm:text-2xl text-gray-800 me-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                      <span className="text-xs sm:text-sm font-normal text-gray-700">
                        {translate('attachedMedia')}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleMedia(topicItem.id)}
                      className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                    >
                      <div
                        className={`transition-transform duration-300 ${
                          expandedMedia.has(topicItem.id)
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
                      expandedMedia.has(topicItem.id)
                        ? 'grid-rows-[1fr] opacity-100 mt-4'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2">
                        {topicItem.media.map((media) => (
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
                              onClick={() => handleVideoPlay(media)}
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
        ))}
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

          <div className="flex flex-col lg:grid lg:grid-cols-12 h-full overflow-hidden max-h-[80vh] sm:max-h-[85vh] lg:max-h-[90vh]">
            {/* Main Video Player - Left Side on Desktop */}
            <div className="flex-none lg:col-span-7 flex flex-col p-4 pb-2 lg:p-6 lg:pb-0 z-10 shadow-sm lg:shadow-none bg-white lg:overflow-y-auto">
              {selectedVideo && (
                <div className="flex flex-col gap-3 lg:gap-4">
                  {/* Video Player Container */}
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
                    {/* Check video type based on type_detail from API */}
                    {selectedVideo.typeDetail === 'Youtube Link' ? (
                      <iframe
                        key={selectedVideo.id}
                        src={selectedVideo.url
                          .replace('watch?v=', 'embed/')
                          .replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedVideo.title}
                      />
                    ) : (
                      <video
                        key={selectedVideo.id}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        preload="metadata"
                        crossOrigin="anonymous"
                      >
                        <source src={selectedVideo.url} type="video/mp4" />
                        <source src={selectedVideo.url} type="video/webm" />
                        <source src={selectedVideo.url} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>

                  {/* Video Title */}
                  <div className="mt-1 lg:mt-2">
                    <h3 className="text-black text-sm sm:text-base lg:text-lg font-bold leading-snug lg:leading-normal line-clamp-2">
                      {getVideoTitle(selectedVideo.title)}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Videos List - Right Side on Desktop */}
            <div className="flex-1 lg:col-span-5 bg-white p-4 pt-0 lg:p-6 lg:pt-0 overflow-y-auto min-h-0 lg:border-s lg:border-gray-100">
              <div className="mb-3 sticky top-0 bg-white pt-2 pb-1 z-10 border-b border-gray-100 lg:pt-0 lg:mt-0">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900">
                  {translate('upcomingVideos')}
                </h3>
              </div>

              <div className="space-y-3 pb-4">
                {allVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                      selectedVideo?.id === video.id
                        ? 'bg-(--primary-color)/5 border-(--primary-color)'
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    {/* Play/Pause Icon - Left */}
                    <div className="flex-none">
                      {selectedVideo?.id === video.id ? (
                        <div className="w-6 h-6 rounded-full bg-(--primary-color) flex items-center justify-center">
                          <BiPause className="text-lg text-white" />
                        </div>
                      ) : (
                        <BiPlay className="text-2xl text-gray-400" />
                      )}
                    </div>

                    {/* Thumbnail - Middle */}
                    <div className="flex-none w-20 h-12 lg:w-24 lg:h-14 rounded overflow-hidden bg-gray-100 border border-gray-100">
                      {video.thumbnail ? (
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          width={96}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <BiPlayCircle className="text-2xl" />
                        </div>
                      )}
                    </div>

                    {/* Title - Right */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-medium line-clamp-2 ${
                          selectedVideo?.id === video.id
                            ? 'text-(--primary-color)'
                            : 'text-gray-700'
                        }`}
                      >
                        {video.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
