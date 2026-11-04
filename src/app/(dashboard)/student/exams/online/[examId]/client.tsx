'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/components/store';
import {
  selectCurrentQuestion,
  selectExamQuestions,
  selectCurrentQuestionIndex,
  selectTotalQuestions,
  selectTotalMarks,
  selectStudentAnswerForQuestion,
  selectStudentAnswers,
  setStudentAnswer,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  completeExam,
  selectSelectedExam,
  OnlineExamData,
  ExamData,
} from '@/components/store/slices/examSlice';
import { useTimer } from 'react-timer-hook';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  BiInfoCircle,
  BiLeftArrowAlt,
  BiRightArrowAlt,
  BiTime,
} from 'react-icons/bi';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import ViewExamSummaryModal from '@/components/ui/pages/dashboard/ViewExamSummaryModal';
import ConfirmSubmitExamModal from '@/components/ui/pages/dashboard/ConfirmSubmitExamModal';
import ConfirmExitExamModal from '@/components/ui/pages/dashboard/ConfirmExitExamModal';
import { useSubmitOnlineExamAnswers } from '@/lib/api/student/queryHooks';
import { toastUtils } from '@/components/lib/toast';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function OnlineExamPage() {
  const translate = useTranslate();

  // Get exam ID from URL params
  const params = useParams();
  const formatMathHtml = (raw: string): string => {
    return raw || '';
  };

  // Memoized component to handle MathJax rendering without being reset by parent re-renders
  const MathContent = React.memo(
    ({ content, className = '' }: { content: string; className?: string }) => {
      const ref = useRef<HTMLSpanElement>(null);

      useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mjax = (window as any).MathJax;
        if (!mjax) return;
        const doTypeset = () => {
          if (mjax.typesetPromise) {
            mjax.typesetPromise([el]).catch((err: unknown) =>
              console.error('MathJax typeset failed:', err),
            );
          } else if (mjax.typeset) {
            mjax.typeset([el]);
          }
        };
        if (mjax.startup?.promise) {
          (mjax.startup.promise as Promise<void>).then(doTypeset);
        } else {
          doTypeset();
        }
      }, [content]);

      return (
        <span
          ref={ref}
          className={className}
          dangerouslySetInnerHTML={{ __html: formatMathHtml(content) }}
        />
      );
    },
  );
  MathContent.displayName = 'MathContent';
  const examId = (params?.examId as string) || '';
  const { collapsed } = useSidebar();

  // Get router for navigation
  const router = useRouter();

  // Modal state management for View Exam Summary
  const [isViewExamSummaryOpen, setIsViewExamSummaryOpen] = useState(false);
  // Modal state for submit confirmation
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  // Modal state for exit confirmation
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);

  // Image preview modal state
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // MathJax loaded state
  // MathJax loaded state
  const [isMathJaxLoaded, setIsMathJaxLoaded] = useState(false);

  // Redux dispatch and selectors
  const dispatch = useAppDispatch();
  const currentQuestion = useAppSelector(selectCurrentQuestion);
  const examQuestions = useAppSelector(selectExamQuestions);
  const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex);
  const totalQuestions = useAppSelector(selectTotalQuestions);
  const totalMarks = useAppSelector(selectTotalMarks);
  const studentAnswers = useAppSelector(selectStudentAnswers);
  const selectedExam = useAppSelector(selectSelectedExam);

  // Type guard to check if selectedExam is OnlineExamData
  const isOnlineExam = (exam: ExamData | null): exam is OnlineExamData => {
    return exam !== null && 'subject_with_name' in exam && 'title' in exam;
  };

  // Get the online exam data with proper typing
  const onlineExam = isOnlineExam(selectedExam) ? selectedExam : null;

  // Get exam duration from Redux store (stored in minutes, convert to seconds)
  const examDurationInMinutes = onlineExam ? onlineExam.duration : 10; // Default to 10 minutes if no duration
  const examDurationInSeconds = examDurationInMinutes * 60;

  // Decide format once based on duration in minutes from API
  // Show HH:MM:SS if duration >= 60 minutes, otherwise show MM:SS
  const showHours = examDurationInMinutes >= 60;
  const [isMounted, setIsMounted] = useState(false);

  // Store expiry timestamp in state to avoid calling Date.now() during render
  // This prevents hydration mismatch between server and client
  const [expiryTimestamp, setExpiryTimestamp] = useState<Date | null>(null);

  // Initialize expiry timestamp after component mounts (client-side only)
  // This ensures Date.now() is only called on the client, preventing hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Set expiry timestamp after mount to ensure it's calculated on client side
    setExpiryTimestamp(new Date(Date.now() + examDurationInSeconds * 1000));
  }, [examDurationInSeconds]);

  // Timer hook - only initialize after mount to prevent hydration mismatch
  // Use a fixed default timestamp (far in the future) if not yet set
  // This ensures server and client render the same initial HTML
  const { hours, minutes, seconds, restart } = useTimer({
    expiryTimestamp: expiryTimestamp || new Date('2099-12-31'), // Fixed date for SSR, will be updated after mount
    onExpire: () => {
      handleSubmitExam();
    },
    autoStart: isMounted && expiryTimestamp !== null, // Only auto-start after mount
  });

  // Restart timer when expiry timestamp is set after mount
  // This ensures the timer starts with the correct client-side timestamp
  useEffect(() => {
    if (isMounted && expiryTimestamp) {
      restart(expiryTimestamp, true);
    }
  }, [isMounted, expiryTimestamp, restart]);

  // Get student's answer for current question
  const currentAnswer = useAppSelector(
    selectStudentAnswerForQuestion(currentQuestion?.id || 0),
  );

  // Submit answers mutation
  const submitAnswersMutation = useSubmitOnlineExamAnswers();

  // Redirect if no exam questions are loaded
  useEffect(() => {
    if (examQuestions.length === 0) {
      router.push('/student/exams');
    }
  }, [examQuestions.length, router]);

  /**
   * Handle option selection
   * Updates the student's answer in Redux store
   */
  const handleOptionSelect = (optionId: number, isCorrect: boolean) => {
    if (!currentQuestion) return;

    dispatch(
      setStudentAnswer({
        questionId: currentQuestion.id,
        optionId,
        isCorrect,
      }),
    );
  };

  /**
   * Handle next question navigation
   */
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      dispatch(nextQuestion());
    }
  };

  /**
   * Handle previous question navigation
   */
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      dispatch(previousQuestion());
    }
  };

  /**
   * Handle exam submission
   * Called when user clicks submit or timer expires
   */
  const handleSubmitExam = useCallback(async () => {
    try {
      const id = parseInt(examId, 10);
      if (!id || !onlineExam) {
        toastUtils.error(translate('invalidExam'));
        return;
      }

      const payload = {
        online_exam_id: id,
        answers_data: studentAnswers.map((a) => ({
          question_id: a.questionId,
          option_id: [a.optionId], // API expects array; UI stores single select
        })),
      };

      const res = await submitAnswersMutation.mutateAsync(payload);
      if (res.success) {
        // Show a consistent success message regardless of API text
        toastUtils.success(translate('examSubmittedSuccessfully'));
        dispatch(completeExam());
        if (examId) {
          router.push(`/student/result/online-exam/${examId}`);
        } else {
          router.push('/student/result');
        }
      } else {
        toastUtils.error(translate('failedToSubmitExam'));
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toastUtils.error(translate('failedToSubmitExam'));
    }
  }, [
    examId,
    onlineExam,
    translate,
    studentAnswers,
    submitAnswersMutation,
    dispatch,
    router,
  ]);

  /**
   * Handle view question dashboard modal
   * Opens the submit exam modal to review answers and submit
   */
  const handleViewQuestionDashboard = () => {
    setIsViewExamSummaryOpen(true);
  };

  /**
   * Handle navigation to specific question
   * Called when user clicks on a question number in the modal
   */
  const handleNavigateToQuestion = (questionIndex: number) => {
    dispatch(goToQuestion(questionIndex));
  };

  /**
   * Handle exit exam confirmation
   * Navigates to results page after user confirms exit
   */
  const handleExitExam = () => {
    handleSubmitExam();
  };

  // Ref for handleSubmitExam to be accessed inside event listeners
  const handleSubmitExamRef = useRef(handleSubmitExam);

  // Update ref when function changes
  useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam;
  }, [handleSubmitExam]);

  // Tab Switching Logic
  const tabSwitchCount = useRef(0);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // If document becomes hidden (user switches tab)
      if (document.hidden) {
        if (hasSubmittedRef.current) return;

        tabSwitchCount.current += 1;

        if (tabSwitchCount.current === 1) {
          toastUtils.error(
            'Warning: If you switch tabs again, your exam will be automatically submitted.',
          );
        } else if (tabSwitchCount.current >= 2) {
          hasSubmittedRef.current = true;
          toastUtils.error(
            'Exam submitted automatically due to tab switching.',
          );
          if (handleSubmitExamRef.current) {
            handleSubmitExamRef.current();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Anti-Cheat: Disable Right Click, Copy, Paste, Select
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, Cmd+C, Cmd+V
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' ||
          e.key === 'v' ||
          e.key === 'C' ||
          e.key === 'V' ||
          e.key === 'a' ||
          e.key === 'A')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Check for MathJax on mount (in case it's already loaded from another page)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
      setIsMathJaxLoaded(true);
    }
  }, []);

  useEffect(() => {
    // MathJax loading check
    if (isMathJaxLoaded && window.MathJax && window.MathJax.typesetPromise) {
      // Global typeset fallback
      // win.MathJax.typesetPromise();
    }
  }, [currentQuestion, isMathJaxLoaded]);

  // Show loading state if no questions
  if (!currentQuestion || examQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{translate('loadingExam')}</p>
        </div>
      </div>
    );
  }

  // Format timer display
  const formatTime = (
    hours: number,
    minutes: number,
    seconds: number,
    showHours: boolean,
  ) => {
    if (showHours) {
      // HH:MM:SS format for durations >= 60 minutes
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // MM:SS format for durations < 60 minutes
    // Calculate total minutes from hours and minutes
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <>
      <Script
        id="mathjax-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
              },
              svg: {
                fontCache: 'global'
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
              },
              startup: {
                typeset: false
              }
            };
          `,
        }}
      />
      <Script
        id="mathjax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        strategy="afterInteractive"
        onLoad={() => setIsMathJaxLoaded(true)}
      />

      <div className="select-none">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <Container collapsed={collapsed}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
              {/* Left side - Exam info */}
              <div className="flex items-center gap-2 w-full lg:flex-1 min-w-0">
                <div className="min-w-0 w-full">
                  <h1
                    className="text-sm sm:text-base font-medium text-gray-900 truncate "
                    title={onlineExam?.subject_with_name}
                  >
                    {onlineExam?.subject_with_name}
                  </h1>
                  <p className="text-xs sm:text-base font-normal text-gray-600">
                    {totalMarks} {translate('marks')}
                  </p>
                </div>
              </div>

              {/* Right side - Timer and actions */}
              <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto justify-between lg:justify-end shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 text-[#FF7072] bg-[#FFF5F5] px-3 py-1 rounded-[4px]">
                  <BiTime className="text-xl" />
                  {/* Only show timer after mount to prevent hydration mismatch */}
                  <span className="text-base sm:text-lg font-medium">
                    {isMounted && expiryTimestamp
                      ? formatTime(hours, minutes, seconds, showHours)
                      : '00:00'}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    onClick={() => setIsConfirmSubmitOpen(true)}
                    className="bg-[#00A63E] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-[4px] text-sm sm:text-base font-normal"
                  >
                    <span className="hidden sm:inline">
                      {translate('submitExam')}
                    </span>
                    <span className="sm:hidden">{translate('submit')}</span>
                  </Button>
                  <Button
                    onClick={() => setIsConfirmExitOpen(true)}
                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-[4px] text-sm sm:text-base font-normal flex items-center justify-center gap-1 w-auto shrink-0"
                  >
                    <span className="text-base sm:text-lg">×</span>
                    <span className="hidden sm:inline">
                      {translate('exitExam')}
                    </span>
                    <span className="sm:hidden">{translate('exit')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </div>
        <div className="px-4 py-4 sm:py-8 bg-(--light-primary-color) min-h-screen">
          <Container collapsed={collapsed}>
            {/* Main Exam Container - no outer background so header stays white and content area can be gray */}
            <div>
              {/* Main Content */}

              {/* Question Section */}
              <div className="mb-6 sm:mb-8 bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-4 gap-2 sm:gap-0">
                  <h2 className="flex items-center gap-2 text-sm sm:text-base font-medium text-gray-900 flex-1">
                    <span>{currentQuestionIndex + 1}. </span>
                    <MathContent content={currentQuestion.question} />
                  </h2>
                  <span className="text-sm sm:text-base font-normal text-gray-900 sm:ml-4 whitespace-nowrap">
                    [{currentQuestion.marks} {translate('marks')}]
                  </span>
                </div>

                {/* Question Image (if present) */}
                {currentQuestion.image && (
                  <div className="mb-4 sm:mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImageUrl(currentQuestion.image);
                        setIsImagePreviewOpen(true);
                      }}
                      className="w-full border border-[#5A6A8B] bg-gray-200 rounded-md flex items-center justify-center overflow-hidden focus:outline-none"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQuestion.image}
                        alt={translate('questionImage') || 'Question image'}
                        className="w-full max-h-80 object-contain"
                      />
                    </button>
                  </div>
                )}

                {/* Question Note (if present) */}
                {currentQuestion.note && (
                  <div className="mb-4 sm:mb-6 p-4 bg-gray-100 border-l-4 border-blue-500 rounded-r-md">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      {translate('note') || 'Note'}:
                    </h3>
                    <div className="text-sm sm:text-base text-gray-800 leading-relaxed">
                      <MathContent
                        className="wrap-break-word"
                        content={currentQuestion.note}
                      />
                    </div>
                  </div>
                )}

                {/* Options Grid */}
                <div className="space-y-2 sm:space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = currentAnswer?.optionId === option.id;
                    const isCorrect = option.is_answer === 1;
                    const optionLabel = String.fromCharCode(65 + index);

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id, isCorrect)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-left text-sm sm:text-base font-normal transition-all flex items-center gap-2 sm:gap-3 ${
                          isSelected
                            ? 'bg-[#57CC99] text-white'
                            : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-sm sm:text-base font-medium ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {optionLabel}
                        </span>
                        <span className="flex-1 min-w-0">
                          <MathContent
                            content={option.option}
                            className="wrap-break-words"
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Section */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                {/* Previous Button */}
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="bg-white hover:bg-gray-50 text-(--primary-color) px-3 py-2 rounded-[4px] text-sm sm:text-base font-normal border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 order-1 sm:order-1"
                >
                  <BiLeftArrowAlt className="text-lg sm:text-xl" />
                  <span className="hidden sm:inline">
                    {translate('previousQuestion')}
                  </span>
                  <span className="sm:hidden">{translate('previous')}</span>
                </Button>

                {/* View Exam Summary Button */}
                <Button
                  onClick={handleViewQuestionDashboard}
                  className="bg-white hover:bg-gray-50 text-(--primary-color) px-3 py-2 rounded-[4px] text-sm sm:text-base font-normal border border-gray-300 flex items-center justify-center gap-1 sm:gap-2 order-3 sm:order-2"
                >
                  <BiInfoCircle className="text-lg sm:text-xl" />
                  <span className="hidden sm:inline">
                    {translate('viewExamSummary')}
                  </span>
                  <span className="sm:hidden">{translate('summary')}</span>
                </Button>

                {/* Next Button */}
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-3 py-2 rounded-[4px] text-sm sm:text-base font-normal disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 order-2 sm:order-3"
                >
                  <span className="hidden sm:inline">
                    {translate('nextQuestion')}
                  </span>
                  <span className="sm:hidden">{translate('next')}</span>
                  <BiRightArrowAlt className="text-lg sm:text-xl" />
                </Button>
              </div>
            </div>

            {/* View Exam Summary Modal */}
            <ViewExamSummaryModal
              open={isViewExamSummaryOpen}
              onOpenChange={setIsViewExamSummaryOpen}
              examQuestions={examQuestions}
              studentAnswers={studentAnswers}
              totalMarks={totalMarks}
              onNavigateToQuestion={handleNavigateToQuestion}
            />

            {/* Confirm Submit Modal */}
            <ConfirmSubmitExamModal
              open={isConfirmSubmitOpen}
              onOpenChange={setIsConfirmSubmitOpen}
              onConfirm={handleSubmitExam}
            />

            {/* Confirm Exit Modal */}
            <ConfirmExitExamModal
              open={isConfirmExitOpen}
              onOpenChange={setIsConfirmExitOpen}
              onConfirm={handleExitExam}
            />
          </Container>
        </div>
        {/* Fullscreen Image Preview */}
        <Dialog
          open={isImagePreviewOpen}
          onOpenChange={(open) => {
            setIsImagePreviewOpen(open);
            if (!open) {
              setPreviewImageUrl(null);
            }
          }}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none">
            {previewImageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageUrl}
                  alt={translate('questionImage') || 'Question image'}
                  className="w-full h-full object-contain"
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
