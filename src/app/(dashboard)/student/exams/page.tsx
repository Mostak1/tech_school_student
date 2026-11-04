'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { CustomTabs, TabContent } from '@/components/ui/custom-tabs';
import { Button } from '@/components/ui/button';
import {
  BiHomeSmile,
  BiCalendar,
  BiCalendarWeek,
  BiRightArrowAlt,
} from 'react-icons/bi';
import {
  useOfflineExamList,
  useGetStudentSubjects,
  useOnlineExamList,
  useGetSchoolSettings,
} from '@/lib/api/student/queryHooks';
import type { OnlineExamListItem } from '@/lib/api/student/functions';
import ExamKeyModal from '@/components/ui/pages/dashboard/ExamKeyModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch } from '@/components/store';
import {
  setExamKey,
  OnlineExamData,
} from '@/components/store/slices/examSlice';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Exam interface
 * Defines structure for exam data from API
 * Uses the same structure as Redux ExamData for consistency
 */
interface Exam {
  id: number;
  name: string;
  description: string;
  exam_starting_date: string; // Format: "DD-MM-YYYY"
  exam_ending_date: string; // Format: "DD-MM-YYYY"
  status: 'ongoing' | 'upcoming' | 'completed';
  type: 'offline' | 'online';
  publish: number; // 0 or 1
  session_year: string;
  exam_status: string; // "1", "2", etc.
  total_marks?: number; // Total marks for the exam (optional for offline exams)
  exam_key?: number; // Exam key for validation (optional)
  duration?: number; // Duration for the exam (optional)
}

/**
 * Utility function to map exam_status number to human-readable label
 * Maps numeric exam status values to readable labels
 * @param examStatus - Exam status as string number ("0", "1", "2", "3") or readable string
 * @returns Human-readable status label
 */
const getExamStatusLabel = (examStatus: string): string => {
  // Try to parse as number first
  const statusNum = parseInt(examStatus, 10);

  // If it's a valid number (0-3), map it to the label translation key
  if (!isNaN(statusNum) && statusNum >= 0 && statusNum <= 3) {
    switch (statusNum) {
      case 0:
        return 'upcoming';
      case 1:
        return 'ongoing';
      case 2:
        return 'completed';
      case 3:
        return 'allExams';
      default:
        return examStatus; // Return original if somehow out of range
    }
  }

  // Handle string statuses - map to translation keys
  const statusLower = examStatus.toLowerCase();
  if (statusLower === 'upcoming') return 'upcoming';
  if (statusLower === 'ongoing' || statusLower === 'on going') return 'ongoing';
  if (statusLower === 'completed') return 'completed';
  if (statusLower === 'all details' || statusLower === 'all') return 'allExams';

  // If not a valid number or known string, return as-is
  return examStatus;
};

/**
 * Get badge colors based on exam_status from API
 * Returns color classes for background, text, and border based on exam_status number
 * @param examStatus - Exam status as string number ("0", "1", "2", "3")
 * @returns Object with bg, text, and border color classes
 */
const getExamStatusBadgeColors = (examStatus: string) => {
  // Try to parse as number first
  let statusNum = parseInt(examStatus, 10);

  // If not a number, try to map from string
  if (isNaN(statusNum)) {
    const statusLower = examStatus.toLowerCase();
    if (statusLower === 'upcoming') statusNum = 0;
    else if (statusLower === 'ongoing' || statusLower === 'on going')
      statusNum = 1;
    else if (statusLower === 'completed') statusNum = 2;
  }

  // If it's a valid number (0-3), return appropriate colors
  if (!isNaN(statusNum) && statusNum >= 0 && statusNum <= 3) {
    switch (statusNum) {
      case 0: // Upcoming
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-300',
        };
      case 1: // On Going
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          border: 'border-yellow-300',
        };
      case 2: // Completed
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300',
        };
      case 3: // All Details
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          border: 'border-purple-300',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-300',
        };
    }
  }

  // Default colors if exam_status is not a valid number
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  };
};

/**
 * Utility function to calculate exam status based on current date
 * @param startDate - Exam start date in DD-MM-YYYY or DD-MM-YYYY HH:mm format
 * @param endDate - Exam end date in DD-MM-YYYY or DD-MM-YYYY HH:mm format
 * @returns Status: 'upcoming', 'ongoing', or 'completed'
 */
const calculateExamStatus = (
  startDate: string,
  endDate: string
): 'upcoming' | 'ongoing' | 'completed' => {
  const today = new Date();

  // Convert DD-MM-YYYY or DD-MM-YYYY HH:mm to Date object
  // Handles both formats: "28-10-2025" and "28-10-2025 10:52"
  const parseDate = (dateStr: string): Date => {
    // Split by space to separate date and time
    const [datePart] = dateStr.split(' ');
    // Split date part by dash
    const [day, month, year] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const examStartDate = parseDate(startDate);
  const examEndDate = parseDate(endDate);

  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  examStartDate.setHours(0, 0, 0, 0);
  examEndDate.setHours(23, 59, 59, 999); // End of day

  if (today < examStartDate) {
    return 'upcoming';
  } else if (today >= examStartDate && today <= examEndDate) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

/**
 * Transform API data to Exam interface
 * Converts API response to the format expected by the component
 */
const transformApiDataToExam = (apiData: {
  id: number;
  name: string;
  description: string;
  exam_starting_date: string;
  exam_ending_date: string;
  publish: number;
  session_year: string;
  exam_status: string;
}): Exam => {
  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description,
    exam_starting_date: apiData.exam_starting_date,
    exam_ending_date: apiData.exam_ending_date,
    status: calculateExamStatus(
      apiData.exam_starting_date,
      apiData.exam_ending_date
    ),
    type: 'offline', // All exams from this API are offline
    publish: apiData.publish,
    session_year: apiData.session_year,
    exam_status: apiData.exam_status,
  };
};

/**
 * Transform Online Exam API data to Exam interface
 * Converts online exam API response to the format expected by the component
 * Uses the actual API response structure from OnlineExamListItem
 */
const transformOnlineExamApiDataToExam = (
  apiData: OnlineExamListItem
): Exam => {
  return {
    id: apiData.id,
    name: apiData.subject_with_name, // Use subject name as exam name
    description: apiData.title, // Use title as description
    exam_starting_date: apiData.start_date,
    exam_ending_date: apiData.end_date,
    status: calculateExamStatus(apiData.start_date, apiData.end_date),
    type: 'online', // All exams from this API are online
    publish: 1, // Online exams are always published
    session_year: apiData.session_year_id.toString(), // Use session year ID
    exam_status: apiData.exam_status_name,
    total_marks: apiData.total_marks, // Include total marks for online exams
    exam_key: apiData.exam_key, // Use actual exam key from API
    duration: apiData.duration, // Include duration from API
  };
};

/**
 * Exams Page Component
 *
 * Displays student exams with tab navigation (Offline Exam/Online Exam)
 * Shows exam cards with details, dates, and status badges
 */
export default function ExamsPage() {
  // Get sidebar state for container adjustment
  const { collapsed } = useSidebar();
  const translate = useTranslate();

  // Router for navigation
  const router = useRouter();

  // Redux dispatch and selectors
  const dispatch = useAppDispatch();
  
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
          feature.toLowerCase() === featureName.toLowerCase()
      );
    };

    // Check if Exam Management is enabled
    // If not, redirect to dashboard
    if (!isFeatureEnabled('Exam Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // State for active tab (offline or online)
  const [activeTab, setActiveTab] = useState<string>('offline');

  // State for status filter (using numeric values: 3 = all, 0 = upcoming, 1 = ongoing, 2 = completed)
  const [statusFilter, setStatusFilter] = useState<string>('3');

  // State for subject filter
  const [subjectFilter, setSubjectFilter] = useState<string>('all-subjects');

  // State for exam key modal
  const [isExamKeyModalOpen, setIsExamKeyModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Get query parameters for tab activation from notifications
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Handle query parameters to activate tab when coming from notification
  useEffect(() => {
    if (tabParam === 'online') {
      setActiveTab('online');
    } else if (tabParam === 'offline') {
      setActiveTab('offline');
    }
    // Optionally, you can scroll to or highlight the specific exam using examIdParam
    // For now, just activating the tab is sufficient
  }, [tabParam]);

  /**
   * Handle tab change and reset filters
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset filters when switching tabs
    setStatusFilter('3'); // Reset to "all" (3 = all exams)
    setSubjectFilter('all-subjects');
  };

  /**
   * Convert status filter string to numeric value for API
   * Maps dropdown values to API status numbers
   * @param statusValue - Status filter from dropdown ("3", "0", "1", "2")
   * @returns Numeric status value for API
   */
  const getStatusFilterNumber = (statusValue: string): number => {
    const parsed = parseInt(statusValue, 10);
    // Check if parsed value is NaN, not if it's falsy (because 0 is falsy but valid)
    if (isNaN(parsed)) {
      return 3; // Default to 3 (all) if invalid
    }
    return parsed;
  };

  // Get numeric status for API call (only used for offline exams)
  const apiStatusFilter = useMemo(() => {
    // Only calculate when on offline tab
    if (activeTab === 'offline') {
      return getStatusFilterNumber(statusFilter);
    }
    // Return default value when not on offline tab
    return 3;
  }, [statusFilter, activeTab]);

  // Fetch offline exam data from API with status filter
  // Only fetch when on offline tab to avoid unnecessary API calls
  const {
    data: offlineExamData,
    isLoading,
    error,
    refetch: refetchOfflineExams,
  } = useOfflineExamList(apiStatusFilter, activeTab === 'offline');

  // Track previous status to detect changes (only for offline tab)
  const prevStatusRef = React.useRef<number>(apiStatusFilter);

  // Force refetch when status filter changes (ONLY for offline tab)
  // This ensures API is called even when React Query might use cached data
  useEffect(() => {
    // Only refetch if we're on offline tab and status actually changed
    if (activeTab === 'offline' && prevStatusRef.current !== apiStatusFilter) {
      prevStatusRef.current = apiStatusFilter;
      refetchOfflineExams();
    }
  }, [apiStatusFilter, activeTab, refetchOfflineExams]);

  // Fetch subjects data from API for the subject filter dropdown
  const { data: subjectsData } = useGetStudentSubjects();

  // Get selected subject ID for online exam filtering
  const selectedSubjectId = useMemo(() => {
    if (subjectFilter === 'all-subjects' || !subjectsData) return null;

    const allSubjects = [
      ...(subjectsData.core_subjects || []),
      ...(subjectsData.elective_subjects || []),
    ];

    const subject = allSubjects.find(
      (s) => s.class_subject_id.toString() === subjectFilter
    );
    return subject?.class_subject_id || null;
  }, [subjectFilter, subjectsData]);

  // Fetch online exam data from API based on selected subject
  const {
    data: onlineExamData,
    isLoading: isLoadingOnlineExams,
    error: onlineExamError,
  } = useOnlineExamList(selectedSubjectId);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('exams'),
    },
  ];

  /**
   * Process offline exams data separately
   * Transforms API data to Exam interface
   * Note: Status filtering is now handled by the API, not client-side
   */
  const processOfflineExams = useMemo(() => {
    if (!offlineExamData?.data) return [];

    // Transform API data to Exam interface
    // API already returns filtered data based on status parameter
    const transformedExams = offlineExamData.data.map(transformApiDataToExam);

    return transformedExams;
  }, [offlineExamData]);

  /**
   * Process online exams data separately
   * Transforms and filters online exam data based on status filter
   */
  const processOnlineExams = useMemo(() => {
    // Check if we have valid data structure
    // Response structure: { success, message, data: { data: [...] } }
    if (!onlineExamData) {
      return [];
    }

    // Debug: Log the response structure to help identify issues
    // Remove this after debugging
    if (onlineExamData && process.env.NODE_ENV === 'development') {
      // console.log('Online Exam Data Response:', onlineExamData);
    }

    // Check if data exists
    if (!onlineExamData.data) {
      return [];
    }

    // Handle different possible response structures
    // Case 1: Paginated response with data.data array
    let examsArray: OnlineExamListItem[] | undefined;
    if (onlineExamData.data.data && Array.isArray(onlineExamData.data.data)) {
      examsArray = onlineExamData.data.data;
    }
    // Case 2: Direct array in data
    else if (Array.isArray(onlineExamData.data)) {
      examsArray = onlineExamData.data;
    }

    // If no valid array found, return empty
    if (!examsArray || examsArray.length === 0) {
      return [];
    }

    // Transform online exam API data to Exam interface
    // Wrap in try-catch to handle any transformation errors
    let transformedExams: Exam[] = [];
    try {
      transformedExams = examsArray.map(transformOnlineExamApiDataToExam);
    } catch (error) {
      console.error('Error transforming online exam data:', error);
      console.error('Failed exam data:', examsArray);
      return [];
    }

    // Apply status filter
    // Note: statusFilter uses numeric values ('3' = all, '0' = upcoming, '1' = ongoing, '2' = completed)
    // For online exams, we map these to string status values
    let statusFilteredExams = transformedExams;
    if (statusFilter !== '3' && statusFilter !== 'all') {
      // Map numeric status filter to string status
      const statusMap: Record<string, 'upcoming' | 'ongoing' | 'completed'> = {
        '0': 'upcoming',
        '1': 'ongoing',
        '2': 'completed',
      };
      const targetStatus = statusMap[statusFilter];
      if (targetStatus) {
        statusFilteredExams = transformedExams.filter(
          (exam) => exam.status === targetStatus
        );
      }
    }

    // Subject filtering is already handled by the API call based on selectedSubjectId
    return statusFilteredExams;
  }, [onlineExamData, statusFilter]);

  /**
   * Get filtered exams based on active tab
   */
  const filteredExams = useMemo(() => {
    if (activeTab === 'offline') {
      return processOfflineExams;
    } else if (activeTab === 'online') {
      return processOnlineExams;
    }
    return [];
  }, [activeTab, processOfflineExams, processOnlineExams]);

  /**
   * Handle view timetable button click
   * Navigates to the exam timetable page
   */
  const handleViewTimetable = (examId: number) => {
    // Updated to new offline route structure
    router.push(`/student/exams/offline/detail?id=${examId}`);
  };

  /**
   * Handle offline exam start
   * Navigates to offline exam details page
   */
  const handleOfflineExamStart = (exam: Exam) => {
    // For offline exams, navigate to exam details (new route)
    router.push(`/student/exams/offline/detail?id=${exam.id}`);
  };

  /**
   * Handle online exam start
   * Opens the exam key modal and stores exam data in Redux
   */
  const handleOnlineExamStart = (exam: Exam) => {
    // Store online exam data in Redux using proper OnlineExamData interface
    const examData: OnlineExamData = {
      id: exam.id,
      title: exam.description, // Use description as title
      subject_with_name: exam.name, // Use name as subject_with_name
      start_date: exam.exam_starting_date,
      end_date: exam.exam_ending_date,
      total_marks: exam.total_marks || 0,
      exam_key: exam.exam_key || 0,
      duration: exam.duration || 0, // Not available in current Exam interface
      exam_status_name: exam.exam_status,
    };

    // Store complete exam data in Redux
    dispatch({ type: 'exam/setSelectedExam', payload: examData });

    // If exam has a predefined exam key, store it for validation
    if (exam.exam_key) {
      dispatch(setExamKey({ examId: exam.id, examKey: exam.exam_key }));
    } else {
    }

    // Open the exam key modal
    setSelectedExam(exam);
    setIsExamKeyModalOpen(true);
  };

  /**
   * Handle start exam button click
   * Routes to appropriate handler based on exam type
   */
  const handleStartExam = (exam: Exam) => {
    if (exam.type === 'offline') {
      handleOfflineExamStart(exam);
    } else {
      handleOnlineExamStart(exam);
    }
  };

  /**
   * Handle online exam key submission
   * Validates the exam key and starts the online exam
   */
  const handleOnlineExamKeySubmit = async () => {
    if (!selectedExam) return;

    try {
      // TODO: Implement exam key validation and exam start logic
      // Navigate to the online exam page
      router.push(`/student/exams/online/detail?id=${selectedExam.id}`);

      // Close the modal
      setIsExamKeyModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('exams')} items={breadcrumbItems} />

      {/* Custom Tabs */}
      <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden">
        <CustomTabs
          items={[
            {
              id: 'offline',
              label: translate('offlineExam'),
            },
            {
              id: 'online',
              label: translate('onlineExam'),
            },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mb-4 bg-white border-b border-gray-200 px-3 md:px-4 pt-3 md:pt-4"
          buttonClassName="px-0 pb-2 md:pb-3 pt-0 text-sm md:text-base"
          isActiveClassName="bg-white pb-2 md:pb-3 pt-0"
        />

        {/* Status Filter - Only show for offline exams */}
        {activeTab === 'offline' && (
          <div className="px-3 md:px-4 py-3 md:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="status-filter"
                  className="text-base font-normal text-gray-700"
                >
                  {translate('status')}
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-9 rounded-[2px] border border-gray-200 shadow-none">
                    <SelectValue placeholder={translate('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Value "3" = All Exams */}
                    <SelectItem value="3">{translate('allExams')}</SelectItem>
                    {/* Value "0" = Upcoming */}
                    <SelectItem value="0">{translate('upcoming')}</SelectItem>
                    {/* Value "1" = On Going */}
                    <SelectItem value="1">{translate('ongoing')}</SelectItem>
                    {/* Value "2" = Completed */}
                    <SelectItem value="2">{translate('completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Offline Exam Tab Content */}
        <TabContent value="offline" activeTab={activeTab}>
          <div className="px-3 md:px-4 pb-3 md:pb-4">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--primary-color) mx-auto mb-4"></div>
                <p className="text-sm md:text-base text-gray-500">
                  {translate('loadingOfflineExams')}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8 md:py-12 bg-red-50 rounded-lg">
                <p className="text-sm md:text-base text-red-600">
                  {translate('failedToLoadOfflineExams')}
                </p>
              </div>
            )}

            {/* Exams List */}
            {!isLoading && !error && (
              <div className="space-y-4">
                {filteredExams.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
                    <BiCalendarWeek className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                      {translate('noOfflineExams')}
                    </h3>
                    <p className="text-sm md:text-base text-gray-500 px-4">
                      {translate('noOfflineExamsMessage')}
                    </p>
                  </div>
                ) : (
                  filteredExams.map((exam) => {
                    // Get badge colors based on exam_status from API
                    const examStatusBadge = exam.exam_status
                      ? getExamStatusBadgeColors(exam.exam_status)
                      : null;

                    return (
                      <div
                        key={exam.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 "
                      >
                        {/* Date and Status Row */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          {/* Date with Calendar Icon */}
                          <div className="flex items-center gap-2 text-gray-700  p-1 rounded-md border border-gray-200 mb-4">
                            <BiCalendarWeek className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                            <span className="text-xs md:text-sm font-normal">
                              {exam.exam_starting_date} –{' '}
                              {exam.exam_ending_date}
                            </span>
                          </div>

                          {/* Exam Status Badge from API */}
                          {exam.exam_status && examStatusBadge && (
                            <span
                              className={`px-2 md:px-3 py-1 rounded-[4px] text-xs md:text-sm font-medium border ${examStatusBadge.bg} ${examStatusBadge.text} ${examStatusBadge.border} self-start`}
                            >
                              {translate(getExamStatusLabel(exam.exam_status))}
                            </span>
                          )}
                        </div>

                        {/* Exam Title */}
                        <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2 md:mb-3">
                          {exam.name}
                        </h3>

                        {/* Exam Description */}
                        <p className="text-gray-600 text-xs md:text-sm font-normal mb-3 md:mb-4 leading-relaxed">
                          {exam.description}
                        </p>

                        {/* View Timetable Button */}
                        <Button
                          onClick={() => handleViewTimetable(exam.id)}
                          className="bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-3 md:px-4 py-1.5 md:py-1 rounded-[4px] text-xs md:text-sm font-medium flex items-center gap-2 transition-colors duration-200 shadow-none h-auto w-full sm:w-auto"
                        >
                          <BiCalendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          {translate('viewTimetable')}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </TabContent>

        {/* Online Exam Tab Content */}
        <TabContent value="online" activeTab={activeTab}>
          <div className="px-3 md:px-4 pb-3 md:pb-4">
            {/* Loading State */}
            {isLoadingOnlineExams && (
              <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--primary-color) mx-auto mb-4"></div>
                <p className="text-sm md:text-base text-gray-500">
                  {translate('loadingOnlineExams')}
                </p>
              </div>
            )}

            {/* Error State */}
            {onlineExamError && (
              <div className="text-center py-8 md:py-12 bg-red-50 rounded-lg">
                <p className="text-sm md:text-base text-red-600">
                  {translate('failedToLoadOnlineExams')}
                </p>
              </div>
            )}

            {/* Exams List */}
            {!isLoadingOnlineExams && !onlineExamError && (
              <div className="space-y-4">
                {/* Header with dropdown - Mobile responsive */}
                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="block text-sm md:text-base font-normal text-gray-900">
                    {translate('subjects')}
                  </label>
                  <Select
                    value={subjectFilter}
                    onValueChange={setSubjectFilter}
                  >
                    <SelectTrigger className="w-full sm:w-auto sm:max-w-xs h-[36px] md:h-[40px] rounded-[4px] border border-gray-200 shadow-none">
                      <SelectValue placeholder={translate('selectSubject')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-subjects">
                        {translate('allSubjects')}
                      </SelectItem>
                      {/* Dynamically render subjects from API */}
                      {subjectsData && (
                        <>
                          {/* Core subjects */}
                          {subjectsData.core_subjects?.map((subject) => (
                            <SelectItem
                              key={`core-${subject.id}`}
                              value={subject.class_subject_id.toString()}
                            >
                              <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-left">
                                {subject.name_with_type}
                              </span>
                            </SelectItem>
                          ))}
                          {/* Elective subjects */}
                          {subjectsData.elective_subjects?.map((subject) => (
                            <SelectItem
                              key={`elective-${subject.id}`}
                              value={subject.class_subject_id.toString()}
                            >
                              <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-left">
                                {subject.name_with_type}
                              </span>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {filteredExams.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
                    <BiCalendarWeek className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                    <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                      {translate('noOnlineExamsFound')}
                    </h3>
                    <p className="text-sm md:text-base text-gray-500">
                      {translate('noOnlineExamsMessage')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {filteredExams.map((exam) => {
                      // Get badge colors based on exam_status from API
                      const examStatusBadge = exam.exam_status
                        ? getExamStatusBadgeColors(exam.exam_status)
                        : null;

                      return (
                        <div
                          key={exam.id}
                          className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Mobile: Stack vertically, Desktop: Side by side */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            {/* Left section - Exam details */}
                            <div className="flex-1">
                              <h3 className="text-sm md:text-base font-medium text-gray-900 mb-1">
                                {exam.name}
                              </h3>
                              <p className="text-xs md:text-sm font-normal text-gray-600 mb-3 md:mb-4">
                                {exam.description}
                              </p>
                              {/* Button: Full width on mobile, auto width on desktop */}
                              <Button
                                onClick={() => handleStartExam(exam)}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-3 md:px-4 py-2 bg-(--primary-color) text-white text-xs md:text-sm font-medium rounded-[4px] hover:bg-(--primary-color)/90 transition-colors focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:ring-offset-2"
                              >
                                {translate('startExam')}{' '}
                                <BiRightArrowAlt className="text-lg md:text-xl ml-1" />
                              </Button>
                            </div>

                            {/* Right section - Marks, Date/Time, and Status Badge */}
                            <div className="text-left sm:text-right sm:ml-6">
                              <div className="text-sm md:text-base font-medium text-gray-900 mb-2">
                                {exam.total_marks || 0} {translate('marks')}
                              </div>
                              <div className="text-xs md:text-sm font-normal text-gray-600 space-y-1 mb-2">
                                <p className="wrap-break-word">
                                  {exam.exam_starting_date} -{' '}
                                  {exam.exam_ending_date}
                                </p>
                              </div>
                              {/* Exam Status Badge from API */}
                              {exam.exam_status && examStatusBadge && (
                                <span
                                  className={`inline-block px-2 md:px-3 py-1 rounded-[4px] text-xs md:text-sm font-medium border ${examStatusBadge.bg} ${examStatusBadge.text} ${examStatusBadge.border}`}
                                >
                                  {translate(getExamStatusLabel(exam.exam_status))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabContent>
      </div>

      {/* Exam Key Modal - Only for Online Exams */}
      <ExamKeyModal
        open={isExamKeyModalOpen}
        onOpenChange={setIsExamKeyModalOpen}
        onStartExam={handleOnlineExamKeySubmit}
      />
    </Container>
  );
}
