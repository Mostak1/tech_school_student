'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BiX } from 'react-icons/bi';
import { useAppDispatch, useAppSelector } from '@/components/store';
import {
  clearSelectedExam,
  selectSelectedExam,
  OnlineExamData,
  setExamQuestions,
} from '@/components/store/slices/examSlice';
import {
  useOnlineExamQuestions,
  useGetSchoolSettings,
} from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';
import { isApiError } from '@/lib/api/student/responseHandler';
import { toastUtils } from '@/components/lib/toast';

/**
 * Exam Key Modal Props Interface
 * Defines the props for the exam key entry modal
 */
interface ExamKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartExam: (examKey: string) => void;
}

/**
 * Exam Key Modal Component
 *
 * Modal for entering exam key before starting an online exam.
 * Uses Redux store for exam data and validation.
 * Matches the design shown in the image with proper styling and layout.
 */
export default function ExamKeyModal({
  open,
  onOpenChange,
  onStartExam,
}: ExamKeyModalProps) {
  const translate = useTranslate();
  // Redux dispatch and selectors
  const dispatch = useAppDispatch();
  const selectedExam = useAppSelector(
    selectSelectedExam,
  ) as OnlineExamData | null;

  // State for exam key input
  const [examKey, setExamKey] = useState('');

  // State for rules agreement checkbox
  const [agreedToRules, setAgreedToRules] = useState(false);

  // State for form validation
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for questions API request
  const [questionsRequest, setQuestionsRequest] = useState<{
    exam_id: number;
    exam_key: string;
  } | null>(null);

  // Fetch exam questions using the hook
  const {
    data: questionsData,
    isLoading: questionsLoading,
    error: questionsError,
  } = useOnlineExamQuestions(questionsRequest);

  // Fetch school settings for exam rules
  const { data: settingsData } = useGetSchoolSettings();

  // Handle questions API response
  useEffect(() => {
    // Check if we have data and it's not an error response
    if (questionsData && !questionsData.error) {
      // Store questions in Redux
      dispatch(
        setExamQuestions({
          questions: questionsData.data,
          totalQuestions: questionsData.total_questions,
          totalMarks: questionsData.total_marks,
          examKey: examKey.trim(),
        }),
      );

      // Call the onStartExam callback to navigate to exam page
      onStartExam(examKey.trim());

      // Save key to session storage for persistence during reload
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`exam_key_${selectedExam?.id}`, examKey.trim());
      }

      // Reset form and close modal
      setExamKey('');
      setAgreedToRules(false);
      setQuestionsRequest(null);
      onOpenChange(false);
    } else if (questionsData && questionsData.error) {
      // Handle API error response (e.g., "Exam not started yet")
      // Use the API's error message if available, otherwise use generic message
      const errorMessage =
        questionsData.message || translate('failedToLoadExamQuestions');

      // Show error in toast notification
      toastUtils.error(errorMessage);
      setIsSubmitting(false);
      setQuestionsRequest(null);
    } else if (questionsError) {
      // Handle network/axios errors (connection issues, etc.)
      // Try to extract error message from the error object
      let errorMessage = translate('failedToLoadExamQuestions');

      // Check if it's an ApiError (from axios interceptor) - it will have the API's message
      if (isApiError(questionsError)) {
        // TypeScript now knows this is ApiError, so message is available
        errorMessage = questionsError.message;
      } else if (questionsError instanceof Error) {
        errorMessage = questionsError.message;
      } else if (
        questionsError &&
        typeof questionsError === 'object' &&
        'message' in questionsError
      ) {
        errorMessage = String((questionsError as { message: string }).message);
      }

      // Show error in toast notification
      toastUtils.error(errorMessage);
      setIsSubmitting(false);
      setQuestionsRequest(null);
    }
  }, [
    questionsData,
    questionsError,
    dispatch,
    examKey,
    onStartExam,
    onOpenChange,
    translate,
    selectedExam?.id,
  ]);

  /**
   * Handle form submission
   * Validates the exam key using Redux store and starts the exam
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examKey.trim()) {
      return;
    }

    if (!agreedToRules) {
      return;
    }

    if (!selectedExam) {
      console.error('No exam selected');
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, let's implement a simple validation
      // In a real app, this would validate against the stored exam key
      const providedKey = parseInt(examKey.trim());

      // Check if the exam has a predefined exam key
      if (selectedExam.exam_key && providedKey !== selectedExam.exam_key) {
        const errorMessage = translate('invalidExamKey');
        // Show error in toast notification
        toastUtils.error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Trigger questions API call
      setQuestionsRequest({
        exam_id: selectedExam.id,
        exam_key: examKey.trim(),
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      const errorMessage = translate('failedToStartExam');
      // Show error in toast notification
      toastUtils.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   * Reset form state and clear Redux state when closing
   */
  const handleClose = () => {
    setExamKey('');
    setAgreedToRules(false);
    dispatch(clearSelectedExam());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] w-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] p-0 overflow-hidden gap-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header Section */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <DialogTitle className="text-xl font-bold text-gray-900 text-left mb-3">
                {translate('enterExamKey')}
              </DialogTitle>
              <DialogDescription className="text-sm font-normal text-gray-600 leading-relaxed text-left">
                {translate('pleaseReadAndAgreeToExamRules')}
              </DialogDescription>
            </div>
            <DialogClose
              onClick={handleClose}
              className="shrink-0 p-1.5 rounded-[4px] bg-(--light-primary-color) border border-gray-200 hover:bg-gray-100 transition-colors -mt-1"
            >
              <BiX className="w-5 h-5 text-gray-500" />
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Divider */}
        <div className="border-t border-gray-200 shrink-0"></div>

        {/* Form Section - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-5 overflow-y-auto flex-1">
            {/* Exam Information Section */}
            <div className="mb-6">
              <div className="text-lg font-medium text-gray-900 mb-1">
                {selectedExam?.subject_with_name || 'Science'}
              </div>
              <div className="text-sm font-normal text-gray-800">
                {selectedExam?.title || 'Conceptual Understanding Test'}
              </div>
            </div>

            {/* Exam Key Input */}
            <div className="mb-6">
              <Input
                type="number"
                placeholder={translate('enterExamKeyPlaceholder')}
                value={examKey}
                onChange={(e) => setExamKey(e.target.value)}
                className="w-full h-12 px-4 shadow-none rounded-[4px] bg-(--light-primary-color) border-gray-200 text-[15px] placeholder:text-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                required
              />
            </div>

            {/* Exam Rules Section */}
            <div className="bg-(--light-primary-color) rounded-[4px] p-5 mb-5">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {translate('examRules')}
              </h3>
              <div className="text-sm font-normal text-gray-700 leading-relaxed max-h-[150px] overflow-y-auto pr-2">
                {settingsData?.data?.settings?.online_exam_terms_condition ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        settingsData.data.settings.online_exam_terms_condition.replace(
                          /(?:<p[^>]*>(?:&nbsp;|\s|<br\s*\/?>)*<\/p>|<br\s*\/?>|\s)+$/gi,
                          '',
                        ),
                    }}
                    className="prose prose-sm max-w-none text-gray-700 space-y-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&_p:empty]:hidden [&_p]:mb-0"
                  />
                ) : (
                  <p></p>
                )}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="agree-rules"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-0.5 h-[18px] w-[18px] text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                required
              />
              <label
                htmlFor="agree-rules"
                className="text-sm font-normal text-gray-700 leading-relaxed cursor-pointer select-none"
              >
                {translate('iConfirmThatIUnderstandAndAcceptAllExamRules')}
              </label>
            </div>
          </div>

          {/* Submit Button - Fixed at bottom */}
          <div className="px-6 pb-6 pt-4 shrink-0 border-t border-gray-100">
            <Button
              type="submit"
              disabled={
                !examKey.trim() ||
                !agreedToRules ||
                isSubmitting ||
                questionsLoading
              }
              className="w-full h-12 bg-(--primary-color) hover:bg-(--primary-color)/90 text-white text-xl font-normal rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || questionsLoading
                ? translate('loadingQuestions')
                : translate('submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
