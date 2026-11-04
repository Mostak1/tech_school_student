'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BiX } from 'react-icons/bi';
import {
  OnlineExamQuestion,
  StudentAnswer,
} from '@/components/store/slices/examSlice';
import { useTranslate } from '@/components/hooks/useTranslate';

interface ViewExamSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examQuestions: OnlineExamQuestion[];
  studentAnswers: StudentAnswer[];
  totalMarks: number;
  onNavigateToQuestion: (questionIndex: number) => void;
}

/**
 * View Exam Summary Modal Component
 *
 * Displays a comprehensive review of the exam before submission.
 * Fully responsive for mobile and desktop devices.
 */
export default function ViewExamSummaryModal({
  open,
  onOpenChange,
  examQuestions,
  studentAnswers,
  totalMarks,
  onNavigateToQuestion,
}: ViewExamSummaryModalProps) {
  const translate = useTranslate();
  // Calculate answered and unanswered questions
  const answeredQuestions = studentAnswers.length;
  const unansweredQuestions = examQuestions.length - answeredQuestions;

  // Group questions by marks
  const questionsByMarks = examQuestions.reduce((acc, question) => {
    const marks = question.marks;
    if (!acc[marks]) {
      acc[marks] = [];
    }
    acc[marks].push(question);
    return acc;
  }, {} as Record<number, OnlineExamQuestion[]>);

  // Check if a question is answered
  const isQuestionAnswered = (questionId: number) => {
    return studentAnswers.some((answer) => answer.questionId === questionId);
  };

  // Handle close modal
  const handleClose = () => {
    onOpenChange(false);
  };

  // Handle question navigation
  const handleQuestionClick = (questionId: number) => {
    const questionIndex = examQuestions.findIndex((q) => q.id === questionId);
    if (questionIndex !== -1) {
      onNavigateToQuestion(questionIndex);
      onOpenChange(false); // Close modal after navigation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-[95vw] sm:w-[660px]! sm:max-w-[660px]! p-0 bg-white rounded-[12px] sm:rounded-[16px] shadow-xl"
        showCloseButton={false}
      >
        {/* Header Section */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 relative">
          <div className="pr-10 sm:pr-8">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
              {translate('viewExamSummary')}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {translate('reviewYourAnswersAndScores')}
            </DialogDescription>
          </div>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <BiX className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200"></div>

        {/* Exam Summary Section */}
        <div className="px-4 sm:px-6 py-3 sm:py-1 bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="text-base sm:text-xl font-medium text-gray-900">
              {translate('totalQuestions')} {examQuestions.length}
            </div>
            <div className="text-base sm:text-xl font-medium text-gray-900">
              {translate('totalMarks')} {totalMarks}
            </div>
          </div>
        </div>

        {/* Question Breakdown Section */}
        <div className="px-4 sm:px-6 pb-4 space-y-3 sm:space-y-5 overflow-y-auto max-h-[50vh] sm:max-h-[300px]">
          {/* Render questions grouped by marks */}
          {Object.entries(questionsByMarks)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([marks, questions]) => (
              <div
                key={marks}
                className="bg-[#F5F5F5] rounded-[12px] p-3 border border-gray-200"
              >
                {/* Question Type Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="text-base sm:text-xl font-normal text-gray-800">
                    {marks} {translate('marksQuestion')}
                  </div>
                  <div className="text-base sm:text-xl font-normal text-gray-800">
                    [{questions.length}]
                  </div>
                </div>

                {/* Individual Question Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {questions.map((question) => {
                    const questionNumber =
                      examQuestions.findIndex((q) => q.id === question.id) + 1;
                    const isAnswered = isQuestionAnswered(question.id);

                    return (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionClick(question.id)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] text-base sm:text-xl font-normal transition-all cursor-pointer bg-[#57CC99] text-white"
                        title={`${translate('question')} ${questionNumber} - ${
                          isAnswered
                            ? translate('answered')
                            : translate('unanswered')
                        } - ${translate('clickToNavigate')}`}
                      >
                        {questionNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Answer Status Section */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Answered Status */}
            <div className="flex-1 bg-[#57CC99] rounded-[8px] p-3 sm:p-4 flex items-center justify-between shadow-sm">
              <span className="text-base sm:text-xl font-medium text-white">
                {translate('answered')}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                {answeredQuestions}
              </span>
            </div>

            {/* Unanswered Status */}
            <div className="flex-1 bg-[#FF6B6B] rounded-[8px] p-3 sm:p-4 flex items-center justify-between shadow-sm">
              <span className="text-base sm:text-xl font-medium text-white">
                {translate('unanswered')}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                {unansweredQuestions}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
