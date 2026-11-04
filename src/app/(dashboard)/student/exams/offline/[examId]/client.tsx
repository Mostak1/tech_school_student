'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
}

/**
 * View Timetable Page Component (Offline)
 *
 * Displays detailed exam timetable for a specific offline exam
 * Route: /student/exams/offline/[examId]
 * No layout wrapper specific to this route (uses default student layout only)
 */
export default function ViewTimetablePage() {
  const translate = useTranslate();
  // Get exam ID from URL params (renamed to match [examId])
  const params = useParams();
  const examId = params.examId as string;

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
      href: `/student/exams/offline/${examId}`,
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
                {/* Mobile Layout - Stack vertically on small screens */}
                <div className="flex flex-col sm:hidden space-y-3">
                  {/* Top row with icon and subject info */}
                  <div className="flex items-start gap-3">
                    {/* Subject Icon */}
                    <div
                      className="rounded-lg w-12 h-12 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: exam.color }}
                    >
                      <BiBook className="w-6 h-6 text-white" />
                    </div>

                    {/* Subject Name and Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 mb-1">
                        {exam.subject}
                      </h3>
                      <p className="text-sm font-normal text-gray-600">
                        {exam.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom row with date, time and marks */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {exam.date}
                      </p>
                      <p className="text-xs font-normal text-gray-600">
                        {exam.time}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {exam.marks}
                      </p>
                      <p className="text-xs font-normal text-gray-500">
                        {translate('marks')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout - Keep horizontal layout for larger screens */}
                <div className="hidden sm:flex items-center gap-3 md:gap-4">
                  {/* Subject Icon */}
                  <div
                    className="rounded-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: exam.color }}
                  >
                    <BiBook className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>

                  {/* Subject Name and Description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 mb-0.5">
                      {exam.subject}
                    </h3>
                    <p className="text-xs md:text-sm font-normal text-gray-600">
                      {exam.description}
                    </p>
                  </div>

                  {/* Date and Time - with left divider */}
                  <div className="shrink-0 text-left min-w-[140px] md:min-w-[250px] border-l border-gray-200 pl-3 md:pl-4">
                    <p className="text-base font-medium text-gray-900 mb-0.5">
                      {exam.date}
                    </p>
                    <p className="text-xs md:text-sm font-normal text-gray-600">
                      {exam.time}
                    </p>
                  </div>

                  {/* Marks - with left divider */}
                  <div className="shrink-0 text-left min-w-[60px] md:min-w-[150px] border-l border-gray-200 pl-3 md:pl-4">
                    <p className="text-base font-medium text-gray-900 mb-0.5">
                      {exam.marks}
                    </p>
                    <p className="text-xs md:text-sm font-normal text-gray-500">
                      {translate('marks')}
                    </p>
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
