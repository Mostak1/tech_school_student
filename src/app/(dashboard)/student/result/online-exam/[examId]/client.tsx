'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useOnlineExamResult } from '@/lib/api/student/queryHooks';
import { BiArrowBack } from 'react-icons/bi';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useTranslate } from '@/components/hooks/useTranslate';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function OnlineExamResultDetailsPage() {
  const translate = useTranslate();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.examId as string;
  const sessionYearId = searchParams.get('session_year_id') 
    ? parseInt(searchParams.get('session_year_id')!) 
    : null;

  // Get exam details
  const {
    data: examResultData,
    isLoading,
    error,
  } = useOnlineExamResult(parseInt(examId), sessionYearId);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: translate('home'), href: '/student/dashboard' },
    { label: translate('result'), href: '/student/result' },
    { label: translate('onlineExamDetails') },
  ];

  const handleBack = () => {
    // Navigate to Exams list explicitly to avoid returning to the question screen via history
    // The Exams page defaults to the 'offline' tab, which matches the expected behavior
    router.replace('/student/result');
  };

  if (isLoading) {
    return (
      <Container>
        <Breadcrumb
          title={translate('onlineExamDetails')}
          items={breadcrumbItems}
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
          <p className="text-gray-500">{translate('loadingExamDetails')}</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Breadcrumb
          title={translate('onlineExamDetails')}
          items={breadcrumbItems}
        />
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            {translate('failedToLoadExamDetails')}
          </h3>
          <p className="text-red-600 mb-4">
            {translate('unableToFetchExamDetails')}
          </p>
          <button
            onClick={handleBack}
            className="bg-(--primary-color) text-white px-4 py-2 rounded hover:bg-(--primary-color)/90"
          >
            {translate('goBack')}
          </button>
        </div>
      </Container>
    );
  }

  if (!examResultData?.data) {
    return (
      <Container>
        <Breadcrumb
          title={translate('onlineExamDetails')}
          items={breadcrumbItems}
        />
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {translate('noExamDataFound')}
          </h3>
          <p className="text-gray-500 mb-4">
            {translate('noExamDetailsAvailable')}
          </p>
          <button
            onClick={handleBack}
            className="bg-(--primary-color) text-white px-4 py-2 rounded hover:bg-(--primary-color)/90"
          >
            {translate('goBack')}
          </button>
        </div>
      </Container>
    );
  }

  const examData = examResultData.data;

  // Group correct answers by marks
  const correctByMarks = examData.correct_answers.question_data.reduce(
    (acc, q) => {
      acc[q.marks] = (acc[q.marks] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  // Group incorrect answers by marks
  const incorrectByMarks = examData.in_correct_answers.question_data.reduce(
    (acc, q) => {
      acc[q.marks] = (acc[q.marks] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  // Get all unique marks
  const allMarks = new Set([
    ...Object.keys(correctByMarks).map(Number),
    ...Object.keys(incorrectByMarks).map(Number),
  ]);

  // Calculate totals
  const totalCorrect = examData.correct_answers.total_questions;
  const totalIncorrect = examData.in_correct_answers.total_questions;
  const totalQuestions = totalCorrect + totalIncorrect;

  // Create question objects for each mark type
  const markTypeQuestions = Array.from(allMarks).map((marks) => {
    const correctCount = correctByMarks[marks] || 0;
    const incorrectCount = incorrectByMarks[marks] || 0;
    const totalCount = correctCount + incorrectCount;

    return {
      type: `${marks} ${translate('marksQuestion')}`,
      count: totalCount,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      highlightLevel: correctCount > incorrectCount ? 'high' : 'low',
    };
  });

  // Add total marks question section at the beginning
  const questions = [
    {
      type: translate('totalMarksQuestion'),
      count: totalQuestions,
      correctAnswers: totalCorrect,
      incorrectAnswers: totalIncorrect,
      highlightLevel: totalCorrect > totalIncorrect ? 'high' : 'low',
    },
    ...markTypeQuestions,
  ];

  return (
    <Container>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        title={translate('onlineExamDetails')}
        items={breadcrumbItems}
      />

      <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden p-3 sm:p-4">
        {/* Exam Header Card - Matching the image design */}
        <div className="bg-[var(--light-primary-color)] rounded-[12px] border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Section - Back Button, Title and Date */}
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="bg-(--primary-color) text-white p-2 rounded-[4px] hover:bg-(--primary-color)/90 transition-colors flex-shrink-0"
              >
                <BiArrowBack size={16} />
              </button>

              {/* Title and Date */}
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-1 break-words">
                  {examData?.online_exam_name || 'Mid-Term Assessment - 2025'}
                  {examData?.subject_name && (
                    <span className="text-xs sm:text-sm font-normal text-gray-600 ml-1 sm:ml-2 block sm:inline">
                      ({examData.subject_name})
                    </span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {translate('submittedOn')}{' '}
                  {examData?.exam_submitted_date}
                </p>
              </div>
            </div>

            {/* Right Section - Marks Badge */}
            <div className="bg-[var(--fifth-color)] border border-[var(--primary-color)] px-3 sm:px-4 py-2 rounded-[4px] flex-shrink-0 self-start lg:self-auto">
              <span className="text-xs sm:text-sm font-bold text-gray-800">
                {translate('marks')}: {examData?.total_obtained_marks || '30'} /{' '}
                {examData?.total_marks || '50'}
              </span>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-3 sm:space-y-4">
          {questions.map((question, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Question Header */}
              <div className="bg-[var(--light-primary-color)] p-3 sm:p-4 md:p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 break-words">
                    {question.type}
                  </h3>
                  <span className="text-sm sm:text-base font-medium text-gray-700 flex-shrink-0 ml-2">
                    [{question.count}]
                  </span>
                </div>
              </div>

              {/* Question Details */}
              <div className="p-3 sm:p-4 md:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Correct Answers Bar */}
                  <div
                    className={`rounded-[8px] p-3 sm:p-4 flex items-center justify-between h-[40px] sm:h-[60px] ${
                      question.highlightLevel === 'high'
                        ? 'bg-[var(--secondary-color)]'
                        : 'bg-[#F2FFD9] border border-green-300'
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-base font-medium ${
                        question.highlightLevel === 'high'
                          ? 'text-white'
                          : 'text-green-700'
                      }`}
                    >
                      {translate('correctAnswers')}
                    </span>
                    <span
                      className={`text-2xl sm:text-3xl font-bold ${
                        question.highlightLevel === 'high'
                          ? 'text-white'
                          : 'text-green-700'
                      }`}
                    >
                      {question.correctAnswers}
                    </span>
                  </div>

                  {/* Incorrect Answers Bar */}
                  <div
                    className={`rounded-[8px] p-3 sm:p-4 flex items-center justify-between h-[40px] sm:h-[60px] ${
                      question.highlightLevel === 'high'
                        ? 'bg-[var(--fourth-color)]'
                        : 'bg-[#FFF5F5] border border-red-300'
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-base font-medium ${
                        question.highlightLevel === 'high'
                          ? 'text-white'
                          : 'text-red-700'
                      }`}
                    >
                      {translate('incorrectAnswers')}
                    </span>
                    <span
                      className={`text-2xl sm:text-3xl font-bold ${
                        question.highlightLevel === 'high'
                          ? 'text-white'
                          : 'text-red-700'
                      }`}
                    >
                      {question.incorrectAnswers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
