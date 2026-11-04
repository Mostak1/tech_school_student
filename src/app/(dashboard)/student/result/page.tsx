'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { FilterSelect } from '@/components/ui/pages/dashboard/common/FilterSelect';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { CustomTabs, TabContent } from '@/components/ui/custom-tabs';
import {
  BiHomeSmile,
  BiCalendar,
  BiChevronDown,
  BiChevronRight,
  BiDownload,
} from 'react-icons/bi';
import { FiCheck, FiX } from 'react-icons/fi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetExamMarks,
  useGetStudentSubjects,
  useOnlineExamResultList,
  useGetSchoolSettings,
  useGetSessionYears,
  useGetSemesters,
} from '@/lib/api/student/queryHooks';
import type {
  ExamResult,
  OnlineExamResultListItem,
  StudentUser,
  SessionYear,
  Semester,
} from '@/lib/api/student/functions';
import { getStudentExamResultPdf } from '@/lib/api/student/functions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Subject Result Interface
 * Defines structure for individual subject results
 */
interface SubjectResult {
  name: string;
  subjectType: string;
  marks: number;
  totalMarks: number;
  grade: string;
}

/**
 * Assessment Result Interface
 * Defines structure for assessment data with subjects
 */
interface AssessmentResult {
  id: string;
  title: string;
  date: string;
  subjectCount: number;
  subjects: SubjectResult[];
  totalObtained: number;
  totalMarks: number;
  percentage: number;
  overallGrade: string;
  status: 'Passed' | 'Failed';
  type: 'online' | 'offline';
  examId: number;
}

/**
 * Assessment Card Component
 * Displays collapsible assessment result card
 */
interface AssessmentCardProps {
  assessment: AssessmentResult;
  isExpanded: boolean;
  onToggle: () => void;
  user: StudentUser | null;
  token: string | null; // Add token
}

function AssessmentCard({
  assessment,
  isExpanded,
  onToggle,
  user,
  token,
}: AssessmentCardProps) {
  const translate = useTranslate();
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsed Header - Always Visible */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--light-primary-color)] p-3 sm:p-4 md:p-5 cursor-pointer"
        onClick={onToggle}
      >
        {/* Left Section - Title and Subject Count */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base md:text-base font-medium text-gray-900 mb-1 truncate">
            {assessment.title}
          </h3>
          <p className="text-xs sm:text-sm md:text-sm text-gray-600">
            {assessment.subjectCount} {translate('subjects')}
          </p>
        </div>

        {/* Right Section - Date and Dropdown Icon */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-700 min-w-0">
            <BiCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm md:text-sm truncate">
              {assessment.date}
            </span>
          </div>

          {/* Dropdown Toggle Icon */}
          <button className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 border border-[var(--primary-color)] rounded-[4px] bg-(--primary-color) text-white transition-all duration-200 flex-shrink-0">
            <BiChevronDown
              className={`text-sm sm:text-lg text-white transition-transform duration-700 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <div
        className={`border-t border-gray-200 overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? 'h-full opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        {/* Subject List */}
        <div className="p-3 sm:p-4 md:p-5 space-y-3">
          {assessment.subjects.map((subject, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 md:gap-0 border-b border-gray-100 last:border-0"
            >
              {/* Subject Name */}
              <span className="text-sm sm:text-base font-normal text-gray-900 flex-1 min-w-0 mb-1 md:mb-0 break-words">
                {subject.name}{' '}
                <span className="text-gray-500 text-xs sm:text-sm ml-1">{`( ${subject.subjectType} )`}</span>
              </span>

              {/* Marks and Grade */}
              <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                <span className="text-xs sm:text-sm font-normal text-gray-700">
                  {translate('marksDash')}{' '}
                  <span className="text-sm sm:text-base font-medium">
                    {subject.marks}
                  </span>{' '}
                  /{' '}
                  <span className="text-sm sm:text-base font-normal">
                    {subject.totalMarks}
                  </span>
                </span>
                <div className="hidden md:block w-[1px] h-[20px] bg-gray-200"></div>
                <span className="text-xs sm:text-sm font-normal text-black bg-[#E6ECF0] px-3 py-1.5 rounded-[4px] text-center whitespace-nowrap min-w-[90px]">
                  {translate('gradeColon')}{' '}
                  <span className="text-sm sm:text-base font-bold">
                    {subject.grade}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        {/* Summary Statistics */}
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 sm:p-4 md:p-5">
          {/* Overall Grade */}
          <div className="bg-[#CFEEFF] rounded-lg p-2 sm:p-3 md:p-4 text-center">
            <p className="text-xs sm:text-sm md:text-base font-normal text-gray-600 mb-1 sm:mb-1 md:mb-2">
              {translate('grade')}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              {assessment.overallGrade}
            </p>
          </div>

          {/* Obtained Marks */}
          <div className="bg-[#FFF7D8] rounded-lg p-2 sm:p-3 md:p-4 text-center">
            <p className="text-xs sm:text-sm md:text-base font-normal text-gray-600 mb-1 sm:mb-1 md:mb-2">
              {translate('obtainedMarks')}
            </p>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              {assessment.totalObtained} / {assessment.totalMarks}
            </p>
          </div>

          {/* Percentage */}
          <div className="bg-[#F0E7FF] rounded-lg p-2 sm:p-3 md:p-4 text-center">
            <p className="text-xs sm:text-sm md:text-base font-normal text-gray-600 mb-1 sm:mb-1 md:mb-2">
              {translate('percentage')}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              {assessment.percentage.toFixed(2)} %
            </p>
          </div>

          {/* Pass/Fail Status */}
          <div
            className={`rounded-lg p-2 sm:p-3 md:p-4 text-center flex items-center justify-center ${assessment.status === 'Passed' ? 'bg-[#E0FFB3]' : 'bg-[#FFE0E0]'
              }`}
          >
            <div
              className={`flex items-center justify-center gap-1 sm:gap-2 text-white rounded-[4px] px-2 py-1 w-fit mx-auto ${assessment.status === 'Passed' ? 'bg-[#83B807]' : 'bg-[#DC2626]'
                }`}
            >
              <div className="bg-white rounded-full p-1">
                {assessment.status === 'Passed' ? (
                  <FiCheck className="w-2 h-2 sm:w-3 sm:h-3 text-[#83B807]" />
                ) : (
                  <FiX className="w-2 h-2 sm:w-3 sm:h-3 text-[#DC2626]" />
                )}
              </div>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-white truncate">
                {assessment.status === 'Passed'
                  ? translate('passed')
                  : translate('failed')}
              </p>
            </div>
          </div>
        </div>

        {/* Download PDF button */}
        <div className="flex p-3 sm:p-4 md:p-5">
          <Button
            className="bg-(--primary-color) text-white px-4 py-2 rounded-[4px] hover:bg-(--primary-color)/90 transition-colors"
            onClick={() =>
              downloadResultPDF(assessment, user, translate, token)
            }
          >
            <BiDownload className="w-4 h-4 mr-2" />
            {translate('downloadResultPDF')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if student passed all subjects
 * A student passes only if their obtained marks are >= passing marks in ALL subjects
 * @param subjectMarks - Array of subject marks with obtained and passing marks
 * @returns true if passed all subjects, false otherwise
 */
function isPassed(
  subjectMarks: { obtained_marks: number; passing_marks: number }[],
): boolean {
  try {
    // Check if any subject has obtained marks less than passing marks
    // If any subject failed, the student fails overall
    return !subjectMarks.some(
      (element) => element.obtained_marks < element.passing_marks,
    );
  } catch {
    // In case of any error, return true (safe default)
    return true;
  }
}

/**
 * Generate and download PDF for offline result
 * Fetches the pre-generated PDF from the backend and triggers download
 * @param assessment - The assessment result to generate PDF for
 * @param user - Student user data from Redux store
 * @param translate - Translation function
 * @param token - Auth token
 */
async function downloadResultPDF(
  assessment: AssessmentResult,
  user: StudentUser | null,
  translate: (key: string) => string,
  token: string | null,
) {
  try {
    if (!user?.id) {
      alert(translate('studentIdMissing'));
      return;
    }

    // Fetch complete PDF data from API with explicit token and JSON application
    // assessment.examId corresponds to the actual exam ID
    const response = await getStudentExamResultPdf(
      {
        exam_id: assessment.examId,
        student_id: user.id,
      },
      token || undefined,
    );

    if (!response.success || !response.data) {
      console.error('PDF Data Fetch Failed:', response);
      throw new Error(response.message || 'Failed to fetch PDF data');
    }

    const pdfData = response.data;

    // Check if we received the PDF string
    if (pdfData && pdfData.pdf) {
      // Base64 string from API
      const base64Pdf = pdfData.pdf;

      // Convert Base64 to Blob
      const pdfContent = base64Pdf.startsWith('data:application/pdf;base64,')
        ? base64Pdf.split(',')[1]
        : base64Pdf;

      const byteCharacters = atob(pdfContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const fileName = `${assessment.title.replace(/[^a-zA-Z0-9]/g, '_')}_Result.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke URL to free memory
      window.URL.revokeObjectURL(link.href);
    } else {
      throw new Error('PDF output not found in response');
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
}

// Offline exam: transform API exam result to AssessmentResult format
function transformOfflineExamToAssessment(exam: ExamResult): AssessmentResult {
  // Robust date parsing for formats like:
  // "2025/07/16", "2025-07-16", "16/07/2025", "16-07-2025", with optional time
  const raw = exam.result.exam_date || '';
  let formattedDate = '-';
  try {
    const datePart = raw.split(' ')[0];
    const sep = datePart.includes('/') ? '/' : '-';
    const parts = datePart.split(sep).map((v) => parseInt(v, 10));
    if (parts.length >= 3) {
      let year = parts[0];
      let month = parts[1];
      let day = parts[2];
      // If first token <= 31, treat as DMY
      if (year <= 31) {
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day) &&
        year >= 1900 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        const d = new Date(year, month - 1, day);
        formattedDate = d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    }
  } catch { }

  return {
    id: exam.result.result_id.toString(),
    examId: exam.result.exam_id,
    title: exam.result.exam_name,
    date: formattedDate,
    subjectCount: exam.exam_marks.length,
    subjects: exam.exam_marks.map((mark) => ({
      name: mark.subject_name,
      subjectType: mark.subject_type,
      marks: mark.obtained_marks,
      totalMarks: mark.total_marks,
      grade: mark.grade.toUpperCase(), // Convert to uppercase for consistency (c -> C)
    })),
    totalObtained: exam.result.obtained_marks,
    totalMarks: exam.result.total_marks,
    percentage: exam.result.percentage,
    overallGrade: exam.result.grade.toUpperCase(), // Convert to uppercase (c -> C)
    // Determine pass/fail based on individual subject passing marks
    // Student passes only if obtained marks >= passing marks in ALL subjects
    status: isPassed(
      exam.exam_marks.map((mark) => ({
        obtained_marks: mark.obtained_marks,
        passing_marks: mark.passing_marks,
      })),
    )
      ? ('Passed' as const)
      : ('Failed' as const),
    type: 'offline',
  };
}

/**
 * Result Page Component
 * Main page displaying student results with tabs and collapsible sections
 */
export default function ResultPage() {
  const translate = useTranslate();
  // Get sidebar state for container adjustment
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
          feature.toLowerCase() === featureName.toLowerCase(),
      );
    };

    if (!isFeatureEnabled('Exam Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // Get user data from Redux store
  const { user, token } = useSelector((state: RootState) => state.studentAuth);
  // State for active tab (online or offline)
  const [activeTab, setActiveTab] = useState<string>('online');

  // State for tracking which assessments are expanded
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(
    new Set(),
  );

  // State for session year selection
  const [selectedSessionYearId, setSelectedSessionYearId] = useState<number | null>(null);

  // Fetch session years from API
  const { data: sessionYearsData, isLoading: sessionYearsLoading } = useGetSessionYears();

  // Set default session year when data loads
  useEffect(() => {
    if (
      !selectedSessionYearId &&
      sessionYearsData?.data &&
      sessionYearsData.data.length > 0
    ) {
      // Find the year with default === 1
      const defaultYear = sessionYearsData.data.find(
        (year: SessionYear) => year.default === 1,
      );
      // If default year exists, use its ID, otherwise use the ID of the first year
      const idToUse = defaultYear
        ? defaultYear.id
        : sessionYearsData.data[0].id;

      setSelectedSessionYearId(idToUse);
    }
  }, [sessionYearsData, selectedSessionYearId]);

  // State for subject filter in online exams
  // Stores 'All' or class_subject_id as string for reliability
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // State for semester filter (null = all semesters)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);

  // Fetch exam marks from API (for offline results)
  const {
    data: examMarksData,
    isLoading: isLoadingExamMarks,
    error: examMarksError,
  } = useGetExamMarks(selectedSessionYearId, selectedSemesterId);

  // Fetch subjects from API (for subject filter)
  const {
    data: subjectsData,
    isLoading: isLoadingSubjects,
    error: subjectsError,
  } = useGetStudentSubjects();

  // Get selected subject ID for API calls
  const selectedSubjectId = useMemo(() => {
    const parsed = parseInt(selectedSubject, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedSubject]);

  // Fetch online exam list - pass null for "All" to get all exams
  const {
    data: onlineExamListData,
    isLoading: isLoadingOnlineExams,
    error: onlineExamListError,
  } = useOnlineExamResultList(selectedSubjectId, selectedSessionYearId, selectedSemesterId);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('result'),
    },
  ];

  /**
   * Get all subjects (core + elective) for the filter
   * Memoized to avoid unnecessary recalculations
   */
  const allSubjects = useMemo(() => {
    if (!subjectsData) return [];

    // Combine core and elective subjects
    const subjects = [
      ...(subjectsData.core_subjects || []),
      ...(subjectsData.elective_subjects || []),
    ];
    return subjects;
  }, [subjectsData]);

  // Fetch semesters from API for the selected session year
  const { data: semestersData } = useGetSemesters(selectedSessionYearId);
  const availableSemesters: Semester[] = useMemo(
    () => semestersData?.data ?? [],
    [semestersData],
  );

  useEffect(() => {
    if (!availableSemesters.length || selectedSemesterId !== null) return;
    const current = availableSemesters.find((s) => s.current);
    setSelectedSemesterId(current ? current.id : availableSemesters[0].id);
  }, [availableSemesters, selectedSemesterId]);

  /**
   * Transform API data to offline results
   * Memoized to avoid unnecessary recalculations
   */
  const offlineResults = useMemo(() => {
    if (!examMarksData?.data) return [];

    // Transform each exam result to our UI format
    const transformed = examMarksData.data.map(
      transformOfflineExamToAssessment,
    );

    return transformed;
  }, [examMarksData]);

  /**
   * Filter results based on active tab
   * Both online and offline results use API data only
   */
  const filteredResults = useMemo(() => {
    if (activeTab === 'online') {
      // Online results are handled by the assessments array from API
      return [];
    } else {
      return offlineResults;
    }
  }, [activeTab, offlineResults]);

  /**
   * Toggle assessment expansion
   */
  const toggleAssessment = (assessmentId: string) => {
    setExpandedAssessments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assessmentId)) {
        newSet.delete(assessmentId);
      } else {
        newSet.add(assessmentId);
      }
      return newSet;
    });
  };

  /**
   * Transform online exam data to UI format
   * Converts API data to match the existing UI structure
   */
  const transformOnlineExamToAssessment = (exam: OnlineExamResultListItem) => {
    // Simple questions array for basic display
    const questions: never[] = [];

    const resolvedId =
      (exam as unknown as { id?: number; online_exam_id?: number }).id ??
      (exam as unknown as { id?: number; online_exam_id?: number })
        .online_exam_id ??
      0;

    return {
      id: resolvedId,
      examId: exam.id,
      title: exam.title,
      // Use the date directly from backend as it's already formatted
      submittedOn: exam.exam_submitted_date || '-',
      totalMarks: exam.total_marks,
      obtainedMarks: exam.obtained_marks ?? 0,
      questions,
    };
  };

  // Transform online exam list to assessments format
  const assessments = useMemo(() => {
    if (!onlineExamListData?.data?.data) return [];

    return onlineExamListData.data.data.map((exam) => {
      return transformOnlineExamToAssessment(exam);
    });
  }, [onlineExamListData]);

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('result')} items={breadcrumbItems} />

      {/* Main Content with Tabs */}
      <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden">
        {/* Custom Tabs */}
        <CustomTabs
          items={[
            {
              id: 'online',
              label: translate('onlineResult'),
            },
            {
              id: 'offline',
              label: translate('offlineResult'),
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-3 sm:mb-4 bg-white border-b border-gray-200 px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4"
          buttonClassName="px-2 sm:px-3 md:px-0 pb-2 sm:pb-2 md:pb-3 pt-0 text-xs sm:text-sm md:text-base min-w-0 flex-1 sm:flex-none"
          isActiveClassName="bg-white pb-2 sm:pb-2 md:pb-3 pt-0"
        />

        {/* Online Result Tab Content */}
        <TabContent value="online" activeTab={activeTab}>
          <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 pt-4">
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              {/* Subject Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="block text-sm sm:text-base font-normal text-gray-700 flex-shrink-0">
                  {translate('subject')}
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                  disabled={isLoadingSubjects}
                >
                  <SelectTrigger className="w-full sm:max-w-xs h-9 sm:h-10 md:h-11 rounded-[4px] border-gray-300">
                    <SelectValue
                      placeholder={
                        isLoadingSubjects
                          ? translate('loadingSubjects')
                          : subjectsError
                            ? translate('errorLoadingSubjects')
                            : translate('selectSubject')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{translate('all')}</SelectItem>
                    {allSubjects.map((subject) => (
                      <SelectItem
                        key={subject.id}
                        value={subject.class_subject_id.toString()}
                      >
                        <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-start">
                          {subject.name_with_type}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                    {availableSemesters.length > 0 && (
                  <FilterSelect
                    label={translate('semester')}
                    value={selectedSemesterId?.toString() ?? ''}
                    onValueChange={(val) => setSelectedSemesterId(parseInt(val))}
                    placeholder={translate('selectSemester')}
                    minWidth="min-w-35"
                  >
                    {availableSemesters.map((sem) => (
                      <SelectItem key={sem.id} value={String(sem.id)}>
                        {sem.name}
                      </SelectItem>
                    ))}
                  </FilterSelect>
                )}
              </div>

              {/* Right filters: Semester + Session Year */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
            
                <FilterSelect
                  label={translate('sessionYear')}
                  value={selectedSessionYearId?.toString() || ''}
                  onValueChange={(val) => setSelectedSessionYearId(parseInt(val))}
                  disabled={sessionYearsLoading}
                  placeholder={sessionYearsLoading ? translate('loading') : translate('selectYear')}
                >
                  {sessionYearsData?.data?.map((item: SessionYear) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </FilterSelect>
              </div>
            </div>

            {/* Online Exam Results */}
            <div className="space-y-3 sm:space-y-4">
              {/* Loading State */}
              {isLoadingOnlineExams ? (
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 border-b-2 border-[var(--primary-color)] mx-auto mb-2 sm:mb-3"></div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 px-3 sm:px-4">
                    {translate('loadingOnlineExamResults')}
                  </p>
                </div>
              ) : onlineExamListError ? (
                /* Error State */
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12 bg-red-50 rounded-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-red-900 mb-2">
                    {translate('failedToLoadOnlineExams')}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-red-600 px-3 sm:px-4">
                    {translate('unableToFetchOnlineExamResults')}
                  </p>
                </div>
              ) : !assessments || assessments.length === 0 ? (
                /* Empty State */
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12 bg-gray-50 rounded-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2">
                    {translate('noOnlineExamResults')}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 px-3 sm:px-4">
                    {selectedSubject === 'All'
                      ? translate('noOnlineExamResultsAvailable')
                      : translate('noOnlineExamResultsForSubject')}
                  </p>
                </div>
              ) : (
                /* Results List */
                assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="bg-[var(--light-primary-color)] rounded-[12px] border border-gray-200 overflow-hidden"
                  >
                    {/* Header - Mobile responsive design */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 gap-3 sm:gap-0">
                      {/* Left Section - Title and Date */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-1 truncate">
                          {assessment.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {translate('submittedOn')} {assessment.submittedOn}
                        </p>
                      </div>

                      {/* Right Section - Marks and View Result Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        {/* Marks Button */}
                        <div className="bg-[var(--fifth-color)] border border-[var(--primary-color)] px-3 sm:px-4 py-2 rounded-[4px] text-center sm:text-left min-w-[120px] max-w-[200px]">
                          <span className="text-xs sm:text-sm font-medium text-black truncate block">
                            {translate('marks')}: {assessment.obtainedMarks} /{' '}
                            {assessment.totalMarks}
                          </span>
                        </div>

                        {/* View Result Button */}
                        <button
                          onClick={() => {
                            router.push(
                              `/student/result/online-exam/detail?id=${assessment.id}&session_year_id=${selectedSessionYearId}`,
                            );
                          }}
                          className="bg-(--primary-color) text-white px-3 sm:px-4 py-2 rounded-[4px] hover:bg-(--primary-color)/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="text-sm sm:text-base font-normal">
                            {translate('viewResult')}
                          </span>
                          <BiChevronRight size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabContent>

        {/* Offline Result Tab Content */}
        <TabContent value="offline" activeTab={activeTab}>
          <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 pt-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-4">
              {availableSemesters.length > 0 && (
                <FilterSelect
                  label={translate('semester')}
                  value={selectedSemesterId?.toString() ?? ''}
                  onValueChange={(val) => setSelectedSemesterId(parseInt(val))}
                  placeholder={translate('selectSemester')}
                  minWidth="min-w-35"
                >
                  {availableSemesters.map((sem) => (
                    <SelectItem key={sem.id} value={String(sem.id)}>
                      {sem.name}
                    </SelectItem>
                  ))}
                </FilterSelect>
              )}
              <FilterSelect
                label={translate('sessionYear')}
                value={selectedSessionYearId?.toString() || ''}
                onValueChange={(val) => setSelectedSessionYearId(parseInt(val))}
                disabled={sessionYearsLoading}
                placeholder={sessionYearsLoading ? translate('loading') : translate('selectYear')}
              >
                {sessionYearsData?.data?.map((item: SessionYear) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </FilterSelect>
            </div>
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {/* Loading State */}
              {isLoadingExamMarks ? (
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 border-b-2 border-[var(--primary-color)] mx-auto mb-2 sm:mb-3"></div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 px-3 sm:px-4">
                    {translate('loadingOfflineResults')}
                  </p>
                </div>
              ) : examMarksError ? (
                /* Error State */
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12 bg-red-50 rounded-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-red-900 mb-2">
                    {translate('failedToLoadResults')}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-red-600 px-3 sm:px-4">
                    {translate('unableToFetchOfflineResults')}
                  </p>
                </div>
              ) : !filteredResults || filteredResults.length === 0 ? (
                /* Empty State */
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12 bg-gray-50 rounded-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2">
                    {translate('noOfflineResults')}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 px-3 sm:px-4">
                    {translate('noOfflineResultsAvailable')}
                  </p>
                </div>
              ) : (
                /* Results List */
                filteredResults.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    isExpanded={expandedAssessments.has(assessment.id)}
                    onToggle={() => toggleAssessment(assessment.id)}
                    user={user}
                    token={token}
                  />
                ))
              )}
            </div>
          </div>
        </TabContent>
      </div>
    </Container>
  );
}
