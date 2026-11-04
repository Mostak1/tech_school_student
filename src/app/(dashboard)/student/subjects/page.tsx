'use client';

import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile, BiBookOpen } from 'react-icons/bi';
import { useTranslate } from '@/components/hooks/useTranslate';
import { BiChat, BiCalculator, BiGlobe, BiBook, BiChevronRight } from 'react-icons/bi';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getStudentSubjects } from '@/lib/api/student/functions';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';

// Default subject icons mapping
const getDefaultIcon = (subjectName: string) => {
  const name = subjectName.toLowerCase();
  if (name.includes('english') || name.includes('language')) return BiChat;
  if (name.includes('science')) return BiCalculator;
  if (name.includes('math')) return BiCalculator;
  if (
    name.includes('social') ||
    name.includes('history') ||
    name.includes('geography')
  )
    return BiGlobe;
  return BiBook; // Default icon
};

/**
 * My Subjects Page Component
 *
 * Displays a grid of subject cards with icons and colors
 * Fetches real data from the API and displays subjects with images
 */
export default function MySubjectsPage() {
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

    // Helper function to check if a feature is enabled by its name
    const isFeatureEnabled = (featureName: string) => {
      // If features list is empty or undefined, show all items (default behavior)
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      // Check if the feature name exists in the values of enabledFeatures object
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase(),
      );
    };

    // Check if Academics Management is enabled
    if (!isFeatureEnabled('Academics Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // Get authentication state to ensure query only runs when authenticated
  const { isAuthenticated } = useSelector(
    (state: RootState) => state.studentAuth,
  );
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const isRtl = currentLanguage === 'ar';

  // Fetch subjects data from API
  // refetchOnMount: 'always' ensures data is refetched when component mounts
  // This fixes the issue where subjects don't show after login without manual refresh
  // refetchOnWindowFocus: true provides additional fallback for data freshness
  const {
    data: subjectsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['student-subjects'],
    queryFn: getStudentSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Always refetch when component mounts to ensure fresh data after login
    refetchOnMount: 'always',
    // Refetch when window regains focus as a fallback
    refetchOnWindowFocus: true,
    // Only run query when user is authenticated
    enabled: isAuthenticated,
  });

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('mySubject'),
    },
  ];

  // Combine core and elective subjects
  const allSubjects = [
    ...(subjectsData?.core_subjects || []),
    ...(subjectsData?.elective_subjects || []),
  ];

  // Loading state
  if (isLoading) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb title={translate('mySubjects')} items={breadcrumbItems} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ms-2 text-gray-600">
            {translate('loadingSubjects')}
          </span>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb title={translate('mySubjects')} items={breadcrumbItems} />
        <div className="text-center py-12">
          <BiBookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {translate('errorLoadingSubjects')}
          </h3>
          <p className="text-gray-500">
            {translate('errorLoadingSubjectsMessage')}
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('mySubjects')} items={breadcrumbItems} />

      {/* Subjects Grid */}
      {allSubjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 bg-white p-4 rounded-[12px] border border-gray-200">
          {allSubjects.map((subject) => {
            const IconComponent = getDefaultIcon(subject.name);

            return (
              <Link
                href={`/student/subjects/detail?id=${subject.id}`}
                key={subject.id}
              >
                <div className="bg-white rounded-[12px] border flex items-center gap-4 border-gray-200 p-3 cursor-pointer group hover:shadow-md transition-shadow">
                  {/* Subject Icon/Image */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: subject.bg_color || '#e5e7eb' }}
                  >
                    {subject.image ? (
                      <Image
                        src={subject.image}
                        alt={subject.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IconComponent className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Subject Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {subject.name_with_type || subject.name}
                    </h3>
                    {subject.type && (
                      <p className="text-sm text-gray-500 capitalize">
                        {subject.type}
                      </p>
                    )}
                  </div>

                  {/* Right Arrow Icon in Square Bracket */}
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 border border-[var(--primary-color)] rounded-[4px] flex items-center justify-center group-hover:border-[var(--primary-color)]/40 transition-colors">
                      <BiChevronRight
                        className={`w-4 h-4 text-[var(--primary-color)] group-hover:text-[var(--primary-color)]/80 transition-colors ${isRtl ? 'rotate-180' : ''
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {/* Empty state message if no subjects */}
      {allSubjects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-[12px] border border-gray-200">
          <BiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {translate('noSubjectsAvailable')}
          </h3>
          <p className="text-gray-500">
            {translate('noSubjectsAvailableMessage')}
          </p>
        </div>
      )}
    </Container>
  );
}
