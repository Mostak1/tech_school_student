'use client';
import { useState, useEffect } from 'react';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiFilter, BiHomeSmile, BiRightArrowAlt, BiLoaderAlt } from 'react-icons/bi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useGetSessionYears, useGetGallery, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { Gallery, SessionYear, getGallery } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useRouter } from 'next/navigation';

const COLOR_PALETTE = [
  '#FFB74D', '#FF6B9D', '#FFA726', '#AB47BC',
  '#66BB6A', '#EF5350', '#42A5F5', '#8D6E63',
];

const getGalleryItemColor = (id: number) => COLOR_PALETTE[id % COLOR_PALETTE.length];

export default function GalleryPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const router = useRouter();

  const { data: schoolSettings, isLoading: isLoadingSettings } = useGetSchoolSettings();

  useEffect(() => {
    if (isLoadingSettings || !schoolSettings?.data) return;

    const enabledFeatures = schoolSettings.data.features || {};

    const isFeatureEnabled = (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) return false;
      return Object.values(enabledFeatures).some(
        (feature) => typeof feature === 'string' && feature.toLowerCase() === featureName.toLowerCase(),
      );
    };

    if (!isFeatureEnabled('School Gallery Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  const [selectedSessionYearId, setSelectedSessionYearId] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(8);
  const [allGalleries, setAllGalleries] = useState<Gallery[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { data: sessionYearsData, isLoading: sessionYearsLoading } = useGetSessionYears();
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } =
    useGetGallery(selectedSessionYearId || 0, offset, limit);

  useEffect(() => {
    if (!selectedSessionYearId && sessionYearsData?.data && sessionYearsData.data.length > 0) {
      const defaultYear = sessionYearsData.data.find((year: SessionYear) => year.default === 1);
      setSelectedSessionYearId(defaultYear ? defaultYear.id : sessionYearsData.data[0].id);
    }
  }, [sessionYearsData, selectedSessionYearId]);

  // Reset when session year changes — handler only sets the ID, this effect handles cleanup
  useEffect(() => {
    if (selectedSessionYearId) {
      setAllGalleries([]);
      setOffset(0);
      setHasMore(true);
    }
  }, [selectedSessionYearId]);

  useEffect(() => {
    if (galleryData?.data && offset === 0) {
      setAllGalleries(galleryData.data);
      setHasMore(galleryData.data.length === limit);
      setIsLoadingMore(false);
    }
  }, [galleryData, offset, limit]);

  const handleLoadMore = async () => {
    if (!selectedSessionYearId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const newOffset = offset + limit;

    try {
      const response = await getGallery(selectedSessionYearId, newOffset, limit);
      if (response.data?.length > 0) {
        setAllGalleries((prev) => [...prev, ...response.data]);
        setOffset(newOffset);
        setHasMore(response.data.length === limit);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSessionYearChange = (sessionYearId: string) => {
    const parsedId = parseInt(sessionYearId);
    if (!isNaN(parsedId)) {
      setSelectedSessionYearId(parsedId);
    }
  };

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    { label: translate('gallery') },
  ];

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('gallery')} items={breadcrumbItems} />

      <div className="bg-white rounded-[12px] border border-gray-200 p-4">
        <div className="flex justify-end mb-4 items-center gap-2">
          <BiFilter className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-900 font-normal">{translate('sessionYear')}</span>
          <div className="flex items-center gap-2 bg-white rounded-[6px] border border-gray-300 px-3 py-2">
            <Select
              value={selectedSessionYearId?.toString() || ''}
              onValueChange={handleSessionYearChange}
              disabled={sessionYearsLoading}
            >
              <SelectTrigger className="w-auto h-auto border-none shadow-none focus:ring-0 text-sm font-normal p-0 gap-1">
                <SelectValue
                  placeholder={sessionYearsLoading ? translate('loading') : translate('selectYear')}
                />
              </SelectTrigger>
              <SelectContent>
                {sessionYearsData?.data?.map((item: SessionYear) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {galleryLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-2 text-gray-600">
              <BiLoaderAlt className="w-5 h-5 animate-spin" />
              <span>{translate('loadingGallery')}</span>
            </div>
          </div>
        ) : galleryError ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">{translate('failedToLoadGallery')}</p>
              <p className="text-gray-500 text-sm">{translate('pleaseTryAgainLater')}</p>
            </div>
          </div>
        ) : allGalleries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {allGalleries.map((gallery: Gallery) => (
              <Link
                key={gallery.id}
                href={`/student/gallery/detail?id=${gallery.id}`}
                className="bg-white rounded-[12px] border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 group relative hover:shadow-lg"
              >
                <div
                  className="w-full h-[280px] flex items-center justify-center relative bg-cover bg-center"
                  style={{
                    backgroundColor: getGalleryItemColor(gallery.id),
                    backgroundImage: gallery.thumbnail ? `url(${gallery.thumbnail})` : 'none',
                  }}
                >
                  {!gallery.thumbnail && (
                    <span className="text-white text-sm font-medium opacity-50">
                      {translate('galleryImage')}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-in-out pointer-events-none">
                    <div className="bg-white rounded-[8px] p-3 absolute bottom-3 left-3 right-3">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-gray-900 font-semibold text-base">{gallery.title}</h3>
                          <p className="text-gray-500 text-sm">
                            {gallery.total_photos > 0 && <>{gallery.total_photos} {translate('photos')}</>}
                            {gallery.total_photos > 0 && gallery.total_videos > 0 && ' | '}
                            {gallery.total_videos > 0 && <>{gallery.total_videos} {translate('videos')}</>}
                          </p>
                        </div>
                        <div className="bg-(--primary-color) w-8 h-8 rounded-md flex items-center justify-center">
                          <BiRightArrowAlt className="w-5 h-5 text-white rtl:rotate-180" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-2">{translate('noGalleryItemsFound')}</p>
              <p className="text-gray-500 text-sm">{translate('trySelectingDifferentSessionYear')}</p>
            </div>
          </div>
        )}

        {hasMore && (
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
                <span>{translate('loadMore')}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </Container>
  );
}
