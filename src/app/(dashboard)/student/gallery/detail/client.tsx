'use client';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import {
  BiHomeSmile,
  BiImageAlt,
  BiDownload,
  BiExpand,
  BiX,
  BiChevronLeft,
  BiChevronRight,
  BiLoaderAlt,
} from 'react-icons/bi';
import React, { useState, useEffect, useMemo } from 'react';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Image from 'next/image';
import { useGetGalleryDetails } from '@/lib/api/student/queryHooks';
import type { GalleryDetails, GalleryFile } from '@/lib/api/student/functions';
import { useSearchParams } from 'next/navigation';
import { useTranslate } from '@/components/hooks/useTranslate';
import { getGalleryDetails } from '@/lib/api/student/functions';
import { IoMdPlay } from "react-icons/io";

export default function GalleryDetails() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  // Get Gallery ID from Query Params
  const searchParams = useSearchParams();
  const galleryId = parseInt(searchParams.get('id') || '0');

  const [activeTab, setActiveTab] = useState('images');
  // State for lightbox modal (for images)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State for video modal
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Pagination state - initial offset is 0 and limit is 5
  const [offset, setOffset] = useState(0);
  const [limit] = useState(5);
  const [allPhotos, setAllPhotos] = useState<GalleryFile[]>([]);
  const [allVideos, setAllVideos] = useState<GalleryFile[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [galleryInfo, setGalleryInfo] = useState<GalleryDetails | null>(null);

  // Fetch initial gallery details from API
  // Note: We'll need to get sessionYearId from context or URL params
  // For now, using a default session year ID of 1
  const {
    data: galleryDetailsData,
    isLoading: galleryDetailsLoading,
    error: galleryDetailsError,
  } = useGetGalleryDetails(galleryId, 1, 0, limit + 1);

  // Accumulate gallery data when new data is fetched
  // Only handle initial load (offset=0) from query hook to avoid duplicates
  // Load more is handled manually in handleLoadMore function
  useEffect(() => {
    if (galleryDetailsData?.data && offset === 0) {
      // Only process initial load to avoid conflicts with manual load more
      setGalleryInfo(galleryDetailsData.data);
      // setAllPhotos and setAllVideos removed from here as they are set along with hasMore check

      // Check if there are more items to load
      const newPhotos = galleryDetailsData.data.photos || [];
      const newVideos = galleryDetailsData.data.videos || [];

      // Check if there are more items to load (if we got more than limit)
      const hasMorePhotosData = newPhotos.length > limit;
      const hasMoreVideosData = newVideos.length > limit;

      setHasMorePhotos(hasMorePhotosData);
      setHasMoreVideos(hasMoreVideosData);

      // Only display up to the limit, keeping the extra item just for the check
      setAllPhotos(hasMorePhotosData ? newPhotos.slice(0, limit) : newPhotos);
      setAllVideos(hasMoreVideosData ? newVideos.slice(0, limit) : newVideos);
      setIsLoadingMore(false);
    }
  }, [galleryDetailsData, offset, limit]);

  // Get images and videos from accumulated arrays
  const images = useMemo(() => allPhotos, [allPhotos]);
  const videos = useMemo(() => allVideos, [allVideos]);

  // Update active tab based on available content
  useEffect(() => {
    if (images.length > 0 && videos.length === 0) {
      setActiveTab('images');
    } else if (videos.length > 0 && images.length === 0) {
      setActiveTab('videos');
    }
  }, [images.length, videos.length]);

  // Handle Load More button click
  // Manually fetches more items and appends them, avoiding query hook to prevent duplicates
  const handleLoadMore = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const newOffset = offset + limit;

    try {
      const response = await getGalleryDetails(
        galleryId,
        1,
        newOffset,
        limit + 1,
      );
      if (response.data) {
        const newPhotos = response.data.photos || [];
        const newVideos = response.data.videos || [];

        if (newPhotos.length > 0 || newVideos.length > 0) {
          // Check if there are more items to load
          const hasMorePhotosData = newPhotos.length > limit;
          const hasMoreVideosData = newVideos.length > limit;

          // Slice if we have more, otherwise keep all
          const photosToAdd = hasMorePhotosData
            ? newPhotos.slice(0, limit)
            : newPhotos;
          const videosToAdd = hasMoreVideosData
            ? newVideos.slice(0, limit)
            : newVideos;

          // Append new items with deduplication to prevent duplicate keys
          setAllPhotos((prev) => {
            const existingIds = new Set(prev.map((photo) => photo.id));
            const uniqueNewPhotos = photosToAdd.filter(
              (photo) => !existingIds.has(photo.id),
            );
            return [...prev, ...uniqueNewPhotos];
          });

          setAllVideos((prev) => {
            const existingIds = new Set(prev.map((video) => video.id));
            const uniqueNewVideos = videosToAdd.filter(
              (video) => !existingIds.has(video.id),
            );
            return [...prev, ...uniqueNewVideos];
          });

          setOffset(newOffset);
          setHasMorePhotos(hasMorePhotosData);
          setHasMoreVideos(hasMoreVideosData);
        } else {
          setHasMorePhotos(false);
          setHasMoreVideos(false);
        }
      } else {
        setHasMorePhotos(false);
        setHasMoreVideos(false);
      }
    } catch (error) {
      console.error('Error loading more gallery items:', error);
      setHasMorePhotos(false);
      setHasMoreVideos(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('gallery'),
      href: '/student/gallery',
    },
    {
      label:
        galleryInfo?.title ||
        galleryDetailsData?.data?.title ||
        translate('galleryDetails'),
    },
  ];

  // Transform API images data for display
  const AllImages = images.map((file: GalleryFile, index: number) => ({
    id: file.id ? String(file.id) : `img-${index}`,
    image: file.file_url,
    title: file.file_name,
  }));

  // Transform API videos data for display
  const AllVideos = videos.map((file: GalleryFile, index: number) => ({
    id: file.id ? String(file.id) : `vid-${index}`,
    thumbnail: file.youtube_url_action?.img || '',
    videoUrl:
      file.youtube_url_action?.embed_url ||
      file.youtube_url_action?.file_url ||
      file.file_url,
    title: file.file_name,
  }));

  // Function to handle image download
  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Function to handle video download (for YouTube videos)
  const handleVideoDownload = (videoUrl: string, videoTitle: string) => {
    // For YouTube videos, we can't download directly due to security restrictions
    // Instead, we'll open the YouTube link in a new tab
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      // Extract the original YouTube URL from the embed URL
      const originalUrl = videoUrl.replace('/embed/', '/watch?v=');
      window.open(originalUrl, '_blank');
    } else {
      // For direct video files, try to download
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${videoTitle}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to open lightbox with selected image
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  // Function to close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Function to navigate to previous image in lightbox
  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? AllImages.length - 1 : prev - 1,
    );
  };

  // Function to navigate to next image in lightbox
  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === AllImages.length - 1 ? 0 : prev + 1,
    );
  };

  // Video modal functions
  // Function to open video modal with selected video
  const openVideoModal = (index: number) => {
    setCurrentVideoIndex(index);
    setIsVideoModalOpen(true);
  };

  // Function to close video modal
  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
  };

  // Function to navigate to previous video
  const goToPreviousVideo = () => {
    setCurrentVideoIndex((prev) =>
      prev === 0 ? AllVideos.length - 1 : prev - 1,
    );
  };

  // Function to navigate to next video
  const goToNextVideo = () => {
    setCurrentVideoIndex((prev) =>
      prev === AllVideos.length - 1 ? 0 : prev + 1,
    );
  };

  // Show loading state
  if (galleryDetailsLoading) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('galleryDetails')}
          items={breadcrumbItems}
        />
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-2 text-gray-600">
              <BiLoaderAlt className="w-5 h-5 animate-spin" />
              <span>{translate('loadingGalleryDetails')}</span>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Show error state
  if (galleryDetailsError) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('galleryDetails')}
          items={breadcrumbItems}
        />
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">
                {translate('failedToLoadGalleryDetails')}
              </p>
              <p className="text-gray-500 text-sm">
                {translate('pleaseTryAgainLater')}
              </p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Show no data state
  if (!galleryDetailsData?.data) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('galleryDetails')}
          items={breadcrumbItems}
        />
        <div className="bg-white rounded-[12px] border border-gray-200 p-4">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                {translate('noGalleryDetailsFound')}
              </p>
              <p className="text-gray-500 text-sm">
                {translate('galleryMayNotExistOrRemoved')}
              </p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('gallery')} items={breadcrumbItems} />
      <div className="min-h-screen bg-white rounded-[12px] border border-gray-200 overflow-hidden p-4">
        <div className="mx-auto">
          {/* Tab Navigation - Always show tabs */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 sm:px-12 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'images'
                  ? 'bg-(--primary-color) text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              {translate('images')}
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 sm:px-12 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'videos'
                  ? 'bg-(--primary-color) text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              {translate('videos')}
            </button>
          </div>

          {/* Main Content */}
          <div className="bg-[var(--light-primary-color)] border border-gray-200 rounded-[12px] p-3 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-medium mb-2">
                  {galleryInfo?.title || galleryDetailsData?.data?.title || ''}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base font-normal">
                  {galleryInfo?.description ||
                    galleryDetailsData?.data?.description ||
                    ''}
                </p>
              </div>
              <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm font-normal border rounded-[4px] py-1 px-2 self-start">
                <BiImageAlt className="text-xl sm:text-2xl" />
                <span>
                  {activeTab === 'images'
                    ? `${AllImages.length} ${translate('photos')}`
                    : `${AllVideos.length} ${translate('videos')}`}
                </span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="mb-6 relative overflow-hidden rounded-[12px]">
              <Image
                src={
                  galleryInfo?.thumbnail ||
                  galleryDetailsData?.data?.thumbnail ||
                  'https://dummyimage.com/1200x400/4a5568/ffffff&text=Gallery+Image'
                }
                alt={
                  galleryInfo?.title ||
                  galleryDetailsData?.data?.title ||
                  'Gallery'
                }
                width={0}
                height={0}
                className="w-full h-32 sm:h-64 md:h-96 object-cover rounded-[12px]"
              />
            </div>

            {/* Image Gallery - Shows when Images tab is active */}
            {activeTab === 'images' && (
              <>
                {AllImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6 mb-6">
                    {AllImages.map((item, index) => (
                      <div
                        key={item.id}
                        className="relative group overflow-hidden rounded-lg"
                      >
                        {/* Image */}
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={0}
                          height={0}
                          className="w-full h-32 md:h-48 object-cover"
                        />

                        {/* Hover Overlay with Buttons - Glassmorphism Effect */}
                        <div className="absolute rounded-lg inset-0">
                          {/* Blurred Background Layer - sits behind buttons, shows blur effect on image */}
                          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Buttons Container - sits on top of blur layer, always clear */}
                          <div className="absolute inset-0 flex items-center justify-center gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {/* Lightbox Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(index);
                              }}
                              className="bg-white text-gray-800 p-3 rounded-[4px] border border-[var(--primary-color)] hover:bg-gray-50 transition-colors"
                              title={translate('viewInLightbox')}
                            >
                              <BiExpand className="w-5 h-5" />
                            </button>
                            {/* Download Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item.image, item.title);
                              }}
                              className="bg-(--primary-color) text-white p-3 rounded-[4px] border border-white"
                              title={translate('downloadImage')}
                            >
                              <BiDownload className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <BiImageAlt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {translate('noImagesAvailable')}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {translate('galleryDoesNotContainImages')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Load More Button for Images - Only show if there are more items to load */}
                {AllImages.length > 0 && (hasMorePhotos || hasMoreVideos) && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="bg-(--primary-color) text-white px-6 py-2 rounded-[4px] font-medium hover:bg-(--primary-color)/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <BiLoaderAlt className="w-5 h-5 animate-spin" />
                          <span>{translate('loading')}</span>
                        </>
                      ) : (
                        <span>{translate('loadMore') || 'Load More'}</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Video Gallery - Shows when Videos tab is active */}
            {activeTab === 'videos' && (
              <>
                {AllVideos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6 mb-6">
                    {AllVideos.map((item, index) => (
                      <div
                        key={item.id}
                        className="relative group overflow-hidden rounded-lg"
                      >
                        {/* Video Thumbnail */}
                        <div className="w-full h-32 md:h-48 object-cover">
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            width={0}
                            height={0}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Hover Overlay with Play Button - Glassmorphism Effect */}
                        <div className="absolute rounded-lg inset-0">
                          {/* Blurred Background Layer - sits behind button, shows blur effect on thumbnail */}
                          <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Button Container - sits on top of blur layer */}
                          <div className="absolute inset-0 flex  items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-3">
                            {/* Play Video Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openVideoModal(index);
                              }}
                              className="bg-white text-gray-800 p-3 rounded-[4px] border border-[var(--primary-color)] hover:bg-gray-50 transition-colors"
                              title={translate('playVideo')}
                            >
                              <IoMdPlay className="w-5 h-5" />
                            </button>
                            {/* Open Video Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoDownload(item.videoUrl, item.title);
                              }}
                              className="bg-(--primary-color) text-white p-3 rounded-[4px] border border-white"
                              title={translate('openVideo')}
                            >
                              <BiDownload className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 text-gray-300 mx-auto mb-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <p className="text-gray-600 mb-2">
                        {translate('noVideosAvailable')}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {translate('galleryDoesNotContainVideos')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Load More Button for Videos - Only show if there are more items to load */}
                {AllVideos.length > 0 && (hasMorePhotos || hasMoreVideos) && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="bg-(--primary-color) text-white px-6 py-2 rounded-[4px] font-medium hover:bg-(--primary-color)/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <BiLoaderAlt className="w-5 h-5 animate-spin" />
                          <span>{translate('loading')}</span>
                        </>
                      ) : (
                        <span>{translate('loadMore') || 'Load More'}</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal - For Images */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-2 sm:p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 transition-colors z-10"
            title={translate('closeLightbox')}
          >
            <BiX className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
          {/* Image Title and Counter */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 rounded-b-lg">
            {/* <p className="text-white text-center text-lg font-medium">
              {AllImages[currentImageIndex].title}
            </p> */}
            <p className="text-white/80 text-center text-xs sm:text-sm">
              {currentImageIndex + 1} / {AllImages.length}
            </p>
          </div>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-1 sm:left-4 text-white hover:text-gray-300 transition-colors z-10"
            title={translate('previousImage')}
          >
            <BiChevronLeft className="w-8 h-8 sm:w-12 sm:h-12" />
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-7xl mx-auto px-10 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={AllImages[currentImageIndex].image}
              alt={AllImages[currentImageIndex].title}
              width={0}
              height={0}
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-1 sm:right-4 text-white hover:text-gray-300 transition-colors z-10"
            title={translate('nextImage')}
          >
            <BiChevronRight className="w-8 h-8 sm:w-12 sm:h-12" />
          </button>
        </div>
      )}

      {/* Video Modal - For Videos */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-2 sm:p-4"
          onClick={closeVideoModal}
        >
          {/* Close Button */}
          <button
            onClick={closeVideoModal}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 transition-colors z-10"
            title={translate('closeVideo')}
          >
            <BiX className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>

          {/* Video Title and Counter */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 rounded-b-lg">
            <p className="text-white text-center text-base sm:text-lg font-medium mb-1">
              {AllVideos[currentVideoIndex].title}
            </p>
            <p className="text-white/80 text-center text-xs sm:text-sm">
              {currentVideoIndex + 1} / {AllVideos.length}
            </p>
          </div>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPreviousVideo();
            }}
            className="absolute left-1 sm:left-4 text-white hover:text-gray-300 transition-colors z-10"
            title={translate('previousVideo')}
          >
            <BiChevronLeft className="w-8 h-8 sm:w-12 sm:h-12" />
          </button>

          {/* Video Player Container */}
          <div
            className="relative max-w-7xl w-full mx-auto px-10 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              key={AllVideos[currentVideoIndex].videoUrl}
              src={AllVideos[currentVideoIndex].videoUrl}
              title={AllVideos[currentVideoIndex].title}
              className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNextVideo();
            }}
            className="absolute right-1 sm:right-4 text-white hover:text-gray-300 transition-colors z-10"
            title={translate('nextVideo')}
          >
            <BiChevronRight className="w-8 h-8 sm:w-12 sm:h-12" />
          </button>
        </div>
      )}
    </Container>
  );
}
