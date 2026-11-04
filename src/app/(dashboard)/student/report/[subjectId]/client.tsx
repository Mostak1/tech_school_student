'use client';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import ReportTabContent from '@/components/ui/pages/dashboard/ReportTabContent';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { CustomTabs, TabContent } from '@/components/ui/custom-tabs';
import {
  useGetAssignmentsReport,
  useGetOnlineExamReport,
} from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Report Subject Page Component
 *
 * Shows detailed assignment and exam reports for a specific subject.
 * Fetches real data from the API using class_subject_id from route params.
 * Displays statistics, charts, and detailed lists for both assignments and exams.
 */
export default function ReportSubjectPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const params = useParams();
  const [activeTab, setActiveTab] = useState('assignment');

  // Get class_subject_id from route params
  // Convert to number since API expects a number
  const classSubjectId = params?.subjectId
    ? parseInt(params.subjectId as string, 10)
    : null;

  // Fetch assignments report data from API
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useGetAssignmentsReport(
    classSubjectId ? { class_subject_id: classSubjectId } : null
  );

  // Fetch online exam report data from API
  const {
    data: examsData,
    isLoading: examsLoading,
    error: examsError,
  } = useGetOnlineExamReport(
    classSubjectId ? { class_subject_id: classSubjectId } : null
  );

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
    },
    {
      label: translate('subjects'),
      href: '/student/report',
    },
    {
      label: translate('reportSubject'),
    },
  ];

  // Tab items for Assignment and Online Exam
  const tabItems = [
    { id: 'assignment', label: translate('assignment') },
    { id: 'online-exam', label: translate('onlineExam') },
  ];

  // Prepare assignment status data from API response
  const assignmentStatusData = assignmentsData?.data
    ? [
        {
          name: translate('pending'),
          value: assignmentsData.data.unsubmitted_assignments,
          color: '#EF4444',
        },
        {
          name: translate('submitted'),
          value: assignmentsData.data.submitted_assignments,
          color: '#84CC16',
        },
      ]
    : [];

  // Transform assignment items for display
  const assignmentItems =
    assignmentsData?.data?.submitted_assignment_with_points_data?.data?.map(
      (item) => ({
        id: item.assignment_id.toString(),
        title: item.assignment_name,
        feedback: '', // Feedback not provided in API response
        obtainedPoints: item.obtained_points,
        totalPoints: item.total_points,
      })
    ) || [];

  // Prepare exam status data from API response
  // Use "Missed" and "Attempted" labels as per the API
  const examStatusData = examsData?.data
    ? [
        {
          name: translate('missed'),
          value: examsData.data.missed_exams,
          color: '#EF4444', // Red color for missed exams
        },
        {
          name: translate('attempted'),
          value: examsData.data.attempted,
          color: '#84CC16', // Green color for attempted exams
        },
      ]
    : [];

  // Transform exam items for display
  // Convert string marks to numbers for proper display
  const examItems =
    examsData?.data?.exam_list?.data?.map((item) => ({
      id: item.online_exam_id.toString(),
      title: item.title,
      feedback: '', // Feedback not provided in API response
      obtainedPoints: parseFloat(item.obtained_marks || '0'),
      totalPoints: parseFloat(item.total_marks || '0'),
    })) || [];

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('report')} items={breadcrumbItems} />

      {/* Loading State */}
      {(assignmentsLoading || examsLoading) && (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{translate('loadingReportData')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!assignmentsLoading &&
        !examsLoading &&
        (assignmentsError || examsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-900 mb-2">
                {translate('errorLoadingReport')}
              </h3>
              <p className="text-red-600">
                {assignmentsError instanceof Error
                  ? assignmentsError.message
                  : examsError instanceof Error
                  ? examsError.message
                  : translate('failedToLoadReportData')}
              </p>
            </div>
          </div>
        )}

      {/* Main Content with White Background - Only show when data is loaded */}
      {!assignmentsLoading &&
        !examsLoading &&
        !assignmentsError &&
        !examsError && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Custom Tabs */}
            <CustomTabs
              items={tabItems}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="bg-white border-b border-gray-200 rounded-t-lg"
              buttonClassName="text-gray-600 hover:text-gray-900"
              isActiveClassName="!text-gray-900 !bg-white !border-b-2 !border-gray-900"
            />

            {/* Tab Content for Assignment */}
            <TabContent value="assignment" activeTab={activeTab}>
              {assignmentItems.length === 0 ? (
                // Empty state for assignments - Show only message
                <div className="p-8 sm:p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    {/* Empty icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {translate('noAssignmentReportAvailable')}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-500">
                      {translate('noAssignmentReportsForSubject')}
                    </p>
                  </div>
                </div>
              ) : (
                // Show full report when data is available
                <ReportTabContent
                  cardTitle={translate('totalAssignments')}
                  totalCount={(
                    assignmentsData?.data?.assignments ?? 0
                  ).toString()}
                  statusData={assignmentStatusData}
                  statusLabel={translate('submitted')}
                  noteText={translate('onlyPointedAssignmentsConsidered')}
                  totalPoints={assignmentsData?.data?.total_points ?? 0}
                  totalObtained={
                    assignmentsData?.data?.total_obtained_points ?? 0
                  }
                  percentage={parseFloat(
                    assignmentsData?.data?.percentage || '0'
                  )}
                  sectionTitle={translate('assignmentsPoints')}
                  items={assignmentItems}
                  attemptedText={translate('pending')}
                />
              )}
            </TabContent>

            {/* Tab Content for Online Exam */}
            <TabContent value="online-exam" activeTab={activeTab}>
              {examItems.length === 0 ? (
                // Empty state for exams - Show only message
                <div className="p-8 sm:p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    {/* Empty icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {translate('noExamReportAvailable')}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-500">
                      {translate('noExamReportsForSubject')}
                    </p>
                  </div>
                </div>
              ) : (
                // Show full report when data is available
                <ReportTabContent
                  cardTitle={translate('totalExams')}
                  totalCount={(examsData?.data?.total_exams ?? 0).toString()}
                  statusData={examStatusData}
                  statusLabel={translate('attempted')}
                  noteText={translate('onlyMarkedExamsConsidered')}
                  totalPoints={parseFloat(examsData?.data?.total_marks || '0')}
                  totalObtained={parseFloat(
                    examsData?.data?.total_obtained_marks || '0'
                  )}
                  percentage={parseFloat(examsData?.data?.percentage || '0')}
                  sectionTitle={translate('examsPoints')}
                  items={examItems}
                  attemptedText={translate('missed')}
                />
              )}
            </TabContent>
          </div>
        )}
    </Container>
  );
}
