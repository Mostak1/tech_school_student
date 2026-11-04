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
import { useParams } from 'next/navigation';
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
  const params = useParams();

  // Safely cast params since we know the route structure
  const resolvedParams = {
    subjectId: params?.subjectId as string,
    lessonId: params?.lessonId as string
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
            file.type_detail !== 'Youtube Link'
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
    []
  );

  // Transform API files to media structure for videos
  // Include type_detail to determine if video should use iframe (YouTube) or video tag (direct upload)
  const transformMedia = (apiFiles: LessonTopicFile[]): TopicMedia[] => {
    return apiFiles
      .filter(
        (file) =>
          file.type_detail === 'Video Upload' ||
          file.type_detail === 'Youtube Link'
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

    return topicsResponse.data.map((topicData) => ({
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
      href: `/student/subjects/${resolvedParams.subjectId}`,
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
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#5D5D5D] mb-2">
                    {topicItem.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm font-normal leading-relaxed">
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
                        <BiLink className="text-xl sm:text-2xl text-gray-800 mr-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                        <span className="text-xs sm:text-sm font-normal text-gray-700">
                          {translate('attachedFiles')}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleFiles(topicItem.id)}
                        className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                      >
                        <div
                          className={`transition-transform duration-300 ${expandedFiles.has(topicItem.id)
                              ? 'rotate-180'
                              : 'rotate-0'
                            }`}
                        >
                          <BiChevronDown className="text-lg sm:text-xl text-[var(--primary-color)]" />
                        </div>
                      </button>
                    </div>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${expandedFiles.has(topicItem.id)
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
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <span className="text-xs sm:text-sm text-gray-700 truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({file.typeDetail})
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
                      <BiPlayCircle className="text-xl sm:text-2xl text-gray-800 mr-2 bg-[#EAEAEA] rounded-[4px] p-1" />
                      <span className="text-xs sm:text-sm font-normal text-gray-700">
                        {translate('attachedMedia')}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleMedia(topicItem.id)}
                      className="flex items-center border border-[var(--primary-color)] rounded-[4px] p-1 hover:bg-(--primary-color)/10 transition-colors duration-200"
                    >
                      <div
                        className={`transition-transform duration-300 ${expandedMedia.has(topicItem.id)
                            ? 'rotate-180'
                            : 'rotate-0'
                          }`}
                      >
                        <BiChevronDown className="text-lg sm:text-xl text-[var(--primary-color)]" />
                      </div>
                    </button>
                  </div>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedMedia.has(topicItem.id)
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
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-full px-2 sm:px-4 pb-3 sm:pb-4">
            {/* Main Video Player - Left Side (7 columns on large screens, full width on mobile) */}
            <div className="col-span-1 lg:col-span-7 flex flex-col">
              {selectedVideo && (
                <div className="relative flex-1">
                  {/* Video Player */}
                  <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] flex items-center justify-center rounded-[4px]">
                    {/* Check video type based on type_detail from API - YouTube uses iframe, Video Upload uses video tag */}
                    {selectedVideo.typeDetail === 'Youtube Link' ? (
                      // YouTube video - use iframe for proper embedding
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
                      // Direct video file upload - use video tag with multiple source types for better compatibility
                      <video
                        key={selectedVideo.id}
                        className="w-full h-full object-contain rounded-[4px]"
                        controls
                        autoPlay
                        preload="metadata"
                        crossOrigin="anonymous"
                      >
                        {/* Multiple source types for better browser compatibility */}
                        <source src={selectedVideo.url} type="video/mp4" />
                        <source src={selectedVideo.url} type="video/webm" />
                        <source src={selectedVideo.url} type="video/ogg" />
                        Your browser does not support the video tag.
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
                  {allVideos.map((video) => (
                    <div
                      key={video.id}
                      className={`mt-2 sm:mt-4 mr-2 sm:mr-4 flex items-center space-x-2 sm:space-x-3 p-2 rounded-[4px] cursor-pointer transition-colors bg-white hover:bg-[var(--light-primary-color)] border border-gray-200 ${selectedVideo?.id === video.id
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
