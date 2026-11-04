'use client';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile, BiMessageDetail, BiPhone } from 'react-icons/bi';
import Image from 'next/image';
import { useGetTeachersList, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import Tooltip from '@/components/ui/pages/common/Tooltip';
import { useRouter } from 'next/navigation';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Teacher data interface (grouped by teacher)
 * This represents a teacher with all their subjects grouped together
 */
interface Teacher {
  id: number; // Teacher ID
  name: string; // Full name
  image: string; // Profile image URL
  mobile: string; // Mobile number, country code prefixed when available
  displaySubjects: string[]; // Subjects to display on card
  moreSubjects: number; // Number of additional subjects beyond the first 3
  allSubjects: string[]; // All subject names (for future use)
}

/**
 * Teachers Page Component
 *
 * Displays a list of teachers with their information and subjects.
 * Fetches data from the API and groups subjects by teacher.
 */
export default function TeachersPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const router = useRouter();

  // Fetch school settings to check for feature access
  const { data: schoolSettings, isLoading: isLoadingSettings } =
    useGetSchoolSettings();

  const enabledFeatures = useMemo(
    () => schoolSettings?.data?.features || {},
    [schoolSettings]
  );

  const isFeatureEnabled = useCallback(
    (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase()
      );
    },
    [enabledFeatures]
  );

  // Check feature permission and redirect if disabled
  useEffect(() => {
    // Skip check while loading
    if (isLoadingSettings) return;

    if (!isFeatureEnabled('Teacher Management')) {
      router.push('/student/dashboard');
    }
  }, [isFeatureEnabled, isLoadingSettings, router]);

  // Get student ID from Redux store
  // The logged-in user's data is stored in Redux after login
  const user = useSelector((state: RootState) => state.studentAuth.user);
  const studentId = user?.id || null;

  // Fetch teachers data from API with student ID
  const {
    data: teachersData,
    isLoading,
    error,
  } = useGetTeachersList(studentId);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('teachers'),
    },
  ];

  /**
   * Process teachers data and group by teacher ID
   * Each teacher may have multiple subjects, so we group them together
   */
  const teachers: Teacher[] = useMemo(() => {
    // Return empty array if no data or data is empty
    if (!teachersData?.data || teachersData.data.length === 0) {
      return [];
    }

    // Group teacher-subject entries by teacher ID
    const teacherMap = new Map<number, Teacher>();

    teachersData.data.forEach((item) => {
      const teacherId = item.teacher.id;
      const subjectName = item.subject.name_with_type; // e.g. "AI - Theory"

      // If teacher already exists in map, add the subject
      if (teacherMap.has(teacherId)) {
        const teacher = teacherMap.get(teacherId)!;
        teacher.allSubjects.push(subjectName);
      } else {
        // Create new teacher entry
        teacherMap.set(teacherId, {
          id: item.teacher.id,
          name: item.teacher.full_name,
          image: item.teacher.image,
          mobile: item.teacher.mobile
            ? `${item.teacher.country_code ? `+${item.teacher.country_code} ` : ''}${item.teacher.mobile}`
            : '',
          displaySubjects: [], // Will be set below
          moreSubjects: 0, // Will be calculated below
          allSubjects: [subjectName],
        });
      }
    });

    // Process each teacher to create subjects string and moreSubjects count
    const processedTeachers: Teacher[] = [];

    teacherMap.forEach((teacher) => {
      // Show all subjects if 2 or fewer, otherwise show 1
      const displayCount = teacher.allSubjects.length <= 2 ? teacher.allSubjects.length : 1;
      const displaySubjects = teacher.allSubjects.slice(0, displayCount);

      // Set display subjects
      teacher.displaySubjects = displaySubjects;

      // Calculate how many additional subjects beyond the currently displayed ones
      teacher.moreSubjects = Math.max(
        0,
        teacher.allSubjects.length - displayCount
      );

      processedTeachers.push(teacher);
    });

    return processedTeachers;
  }, [teachersData]);

  /**
   * Handles chat button click for a teacher
   * Navigates to the chats page with the teacher ID as a query parameter
   * The chats page will automatically open that teacher's chat
   */
  const handleChatClick = (teacherId: number) => {
    // Navigate to chats page with teacher ID in query params
    // This will open the chat with the specific teacher
    router.push(`/student/chats?teacherId=${teacherId}`);
  };

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb */}
      <Breadcrumb title={translate('teachers')} items={breadcrumbItems} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-(--primary-color) mx-auto mb-3"></div>
            <p className="text-sm">{translate('loadingTeachers')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">
            {translate('failedToLoadTeachers')}.{' '}
            {translate('pleaseTryAgainLater')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && teachers.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-base">
            {translate('noTeachersAssignedYet')}
          </p>
        </div>
      )}

      {/* Teachers Grid */}
      {!isLoading && !error && teachers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {/* Map over teachers array to render each teacher card */}
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-[12px] border border-gray-200 overflow-hidden p-3"
            >
              {/* Teacher Image */}
              <div className="relative h-[210px] rounded-[8px] overflow-hidden mb-3">
                <Image
                  src={teacher.image}
                  alt={teacher.name}
                  className="w-full h-full object-contain"
                  width={400}
                  height={210}
                  unoptimized
                />
              </div>

              {/* Teacher Info */}
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Teacher Name */}
                    <h3 className="text-base font-medium text-gray-900 text-[15px] mb-0.5 leading-tight">
                      {teacher.name}
                    </h3>

                    {/* Subjects */}
                    <div className="text-sm font-normal text-gray-500 leading-tight mb-1.5">
                      {teacher.displaySubjects.map((subject, index) => (
                        <p key={index} className="truncate mb-0.5 last:mb-0">
                          {subject}
                        </p>
                      ))}
                    </div>

                    {/* Mobile Number */}
                    {teacher.mobile && (
                      <a
                        href={`tel:${teacher.mobile.replace(/\s/g, '')}`}
                        className="flex items-center gap-1 text-sm font-normal text-gray-500 leading-tight mb-1.5 hover:text-(--primary-color)"
                        dir="ltr"
                      >
                        <BiPhone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{teacher.mobile}</span>
                      </a>
                    )}

                    {/* Additional Subjects Count with Tooltip */}
                    {/* Only show if moreSubjects is greater than 0 */}
                    {teacher.moreSubjects > 0 ? (
                      <Tooltip
                        content={
                          <ul className="text-start">
                            {teacher.allSubjects.slice(1).map((subject, index) => (
                              <li key={index} className="block py-0.5">
                                {subject}
                              </li>
                            ))}
                          </ul>
                        }
                        position="top"
                      >
                        <p className="text-(--primary-color) text-sm font-normal leading-tight cursor-pointer">
                          + {teacher.moreSubjects} {translate('more')}
                        </p>
                      </Tooltip>
                    ) : (
                      <p className="text-(--primary-color) text-sm font-normal leading-tight invisible">
                        + 1 {translate('more')}
                      </p>
                    )}
                  </div>

                  {/* Chat Button */}
                  {isFeatureEnabled('Chat Module') && (
                    <button
                      onClick={() => handleChatClick(teacher.id)}
                      className="w-8 h-8 bg-(--primary-color) rounded flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors shrink-0"
                      aria-label={`${translate('chatWith')} ${teacher.name}`}
                    >
                      <BiMessageDetail className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
