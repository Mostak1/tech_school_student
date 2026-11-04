'use client';

import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile, BiBookOpen, BiChevronRight } from 'react-icons/bi';
import Link from 'next/link';
import { useGetStudentSubjects, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';

/**
 * Report Page Component
 *
 * Displays a grid of subject cards with icons and colors.
 * Fetches real subject data from the API using the subjects endpoint.
 * Shows both core and elective subjects in a unified grid layout.
 */
export default function ReportPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
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

    // Check if either Exam Management OR Assignment Management is enabled
    // The report page contains both exam and assignment reports
    const isExamEnabled = isFeatureEnabled('Exam Management');
    const isAssignmentEnabled = isFeatureEnabled('Assignment Management');

    if (!isExamEnabled && !isAssignmentEnabled) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // Fetch subjects from API
  // This hook automatically handles loading states, errors, and caching
  const { data, isLoading, error } = useGetStudentSubjects();

  // Get RTL state from language selector
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const isRtl = currentLanguage === 'ar';

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('subjects'),
    },
  ];

  // Combine core and elective subjects into one array
  // This creates a unified list for display
  const allSubjects = [
    ...(data?.core_subjects || []),
    ...(data?.elective_subjects || []),
  ];

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('subjects')} items={breadcrumbItems} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 bg-white rounded-[12px] border border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-(--primary-color) border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{translate('loadingSubjects')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-6">
          <div className="text-center">
            <BiBookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              {translate('errorLoadingSubjects')}
            </h3>
            <p className="text-red-600">
              {error instanceof Error
                ? error.message
                : translate('failedToLoadSubjects')}
            </p>
          </div>
        </div>
      )}

      {/* Subjects Grid - Only show when data is loaded */}
      {!isLoading && !error && allSubjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 bg-white p-4 rounded-[12px] border border-gray-200">
          {allSubjects.map((subject) => {
            return (
              <Link
                href={`/student/report/detail?id=${subject.class_subject_id}`}
                key={subject.id}
              >
                <div className="bg-white rounded-[12px] border flex items-center gap-4 border-gray-200 p-3 cursor-pointer group hover:shadow-md transition-shadow">
                  {/* Subject Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: subject.bg_color || '#f3f4f6' }}
                  >
                    <Image
                      src={subject.image || ''}
                      alt={subject.name}
                      width={0}
                      height={0}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  </div>

                  {/* Subject Name - Use name_with_type to show full details */}
                  <div className="flex flex-col min-w-0 flex-1 text-start">
                    <h3
                      className="text-base font-medium text-gray-900 w-full line-clamp-2 overflow-hidden text-ellipsis text-start"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                      title={subject.name}
                    >
                      {subject.name}
                    </h3>
                    {/* Show subject type if available */}
                    {subject.type && (
                      <span className="text-sm text-gray-500 text-start">
                        {subject.type}
                      </span>
                    )}
                  </div>

                  {/* Right Arrow Icon in Square Bracket with RTL support */}
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

      {/* Empty state - Only show when data is loaded but no subjects found */}
      {!isLoading && !error && allSubjects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-[12px] border border-gray-200">
          <BiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {translate('noReportAvailable')}
          </h3>
          <p className="text-gray-500">{translate('reportWillAppearHere')}</p>
        </div>
      )}
    </Container>
  );
}
