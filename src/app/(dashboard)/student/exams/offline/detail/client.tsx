'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { BiHomeSmile, BiBook, BiArrowBack } from 'react-icons/bi';
import { getExamDetails, ExamTimetableItem } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Processed Exam Item Interface
 * Defines structure for processed exam data for display
 */
interface ProcessedExamItem {
  id: string;
  subject: string;
  description: string;
  date: string;
  time: string;
  marks: number;
  color: string; // Color for subject icon
  image: string; // Subject image URL
}

/**
 * View Timetable Page Component (Offline)
 *
 * Displays detailed exam timetable for a specific offline exam
 * Route: /student/exams/offline/detail
 * No layout wrapper specific to this route (uses default student layout only)
 */
export default function ViewTimetablePage() {
  const translate = useTranslate();
  // Get exam ID from Query Params
  const searchParams = useSearchParams();
  const examId = searchParams.get('id') || '';

  // Get router for navigation
  const router = useRouter();

  // Get sidebar state for container adjustment
  const { collapsed } = useSidebar();

  // State for exam data
  const [examData, setExamData] = useState<ExamTimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch exam details from API
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getExamDetails({ exam_id: parseInt(examId) });

        if (response.error) {
          setError(response.message || translate('failedToFetchExamDetails'));
        } else {
          setExamData(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching exam details:', err);
        setError(translate('failedToFetchExamDetails'));
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  /**
   * Process API data into display format
   * Converts API response to the format expected by the UI
   */
  const processExamData = (data: ExamTimetableItem[]): ProcessedExamItem[] => {
    return data.map((item) => ({
      id: item.exam_timetable_id.toString(),
      subject: item.subject.name,
      description: item.subject.type,
      date: item.date,
      time: `${item.starting_time} – ${item.ending_time}`,
      marks: item.total_marks,
      color: item.subject.bg_color, // Store the actual color value
      image: item.subject.image,
    }));
  };

  // Process the exam data for display
  const processedData = processExamData(examData);

  // Only show offline exams (theory and practical)
  const timetableData = {
    offline: processedData.filter(
      (item) =>
        item.description.toLowerCase() === 'theory' ||
        item.description.toLowerCase() === 'practical',
    ),
    online: [], // No online exams
  };

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('exams'),
      href: '/student/exams',
    },
    {
      label: translate('offlineExamDetails'),
      href: `/student/exams/offline/detail?id=${examId}`,
    },
  ];

  // Get all offline exams (no filtering needed)
  const filteredExams = timetableData.offline;

  /**
   * Handle back button click
   * Navigates back to the exams list page
   */
  const handleBackClick = () => {
    router.push('/student/exams');
  };

  // Show loading state
  if (loading) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('viewTimetable')}
          items={breadcrumbItems}
        />

        {/* Back Button */}
        <div className="mb-4">
          <Button
            onClick={handleBackClick}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
          >
            <BiArrowBack className="w-4 h-4" />
            {translate('backToExams')}
          </Button>
        </div>

        <div className="bg-white rounded-[12px] border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--primary-color) mx-auto mb-4"></div>
          <p className="text-gray-600">{translate('loadingExamDetails')}</p>
        </div>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container collapsed={collapsed}>
        <Breadcrumb
          title={translate('viewTimetable')}
          items={breadcrumbItems}
        />

        {/* Back Button */}
        <div className="mb-4">
          <Button
            onClick={handleBackClick}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
          >
            <BiArrowBack className="w-4 h-4" />
            {translate('backToExams')}
          </Button>
        </div>

        <div className="bg-white rounded-[12px] border border-gray-200 p-8 text-center">
          <div className="text-red-500 mb-4">
            <BiBook className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {translate('errorLoadingExamDetails')}
            </h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('viewTimetable')} items={breadcrumbItems} />

      {/* Back Button */}
      <div className="mb-4">
        <Button
          onClick={handleBackClick}
          variant="outline"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400"
        >
          <BiArrowBack className="w-4 h-4" />
          {translate('backToExams')}
        </Button>
      </div>

      {/* Exam Details Content */}
      <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden p-3 md:p-4">
        {/* Offline Exam Content */}
        {/* Exams List */}
        <div className="space-y-3 md:space-y-4">
          {filteredExams.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
              <BiBook className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                {translate('noExamsFound')}
              </h3>
              <p className="text-sm md:text-base text-gray-500 px-4">
                {translate('noExamsScheduledForCategory')}
              </p>
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="p-3 md:p-4  space-y-4 bg-(--light-primary-color) border border-gray-200 rounded-[12px] overflow-hidden"
              >
                {/* Responsive Layout */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                  {/* Subject Icon - Visible on all screens */}
                  <div className="flex items-start gap-3 sm:gap-4 w-full lg:w-auto">
                    <div
                      className="rounded-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: exam.color || 'transparent' }}
                    >
                      {exam.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={exam.image}
                          alt={exam.subject}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BiBook className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      )}
                    </div>

                    {/* Subject Name and Description - Tablet/Mobile Only (beside icon) */}
                    <div className="flex-1 min-w-0 lg:hidden">
                      <h3 className="text-base font-medium text-gray-900 mb-0.5 break-words">
                        {exam.subject}
                      </h3>
                      <p className="text-sm font-normal text-gray-600">
                        {exam.description}
                      </p>
                    </div>
                  </div>

                  {/* Subject Name and Description - Desktop Only */}
                  <div className="hidden lg:block flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 mb-0.5 break-words">
                      {exam.subject}
                    </h3>
                    <p className="text-xs md:text-sm font-normal text-gray-600">
                      {exam.description}
                    </p>
                  </div>

                  {/* Info Section (Date/Time & Marks) */}
                  <div className="flex flex-row items-center justify-between lg:justify-end gap-0 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200/60">
                    {/* Date and Time */}
                    <div className="text-left lg:min-w-[250px] lg:border-l lg:border-gray-200 lg:pl-4">
                      <p className="text-sm md:text-base font-medium text-gray-900 mb-0.5">
                        {exam.date}
                      </p>
                      <p className="text-xs md:text-sm font-normal text-gray-600">
                        {exam.time}
                      </p>
                    </div>

                    {/* Marks */}
                    <div className="text-right lg:text-left min-w-[60px] lg:min-w-[150px] border-l border-gray-300 lg:border-gray-200 pl-3 lg:pl-4">
                      <p className="text-sm md:text-base font-medium text-gray-900 mb-0.5">
                        {exam.marks}
                      </p>
                      <p className="text-xs md:text-sm font-normal text-gray-500">
                        {translate('marks')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}
