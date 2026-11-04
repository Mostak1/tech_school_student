'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/components/hooks/useTranslate';

interface ConfirmSubmitExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Simple confirmation modal to submit or cancel the exam submission.
 */
export default function ConfirmSubmitExamModal({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmSubmitExamModalProps) {
  const translate = useTranslate();
  const handleSubmit = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-[420px] p-6 bg-white rounded-[12px] shadow-xl"
        showCloseButton={false}
      >
        <DialogTitle className="text-center text-base sm:text-base font-bold text-gray-900">
          {translate('submitYourExam')}
        </DialogTitle>
        <DialogDescription className="text-center text-sm font-normal text-gray-600">
          {translate('reviewYourAnswersBeforeFinalSubmission')}
        </DialogDescription>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            onClick={handleSubmit}
            className="bg-(--primary-color) rounded-[4px] text-white text-base font-normal px-4 py-2"
          >
            {translate('submitExam')}
          </Button>
          <Button
            onClick={handleCancel}
            className="bg-white hover:bg-gray-50 text-(--primary-color) border border-(--primary-color) rounded-[4px] text-base font-normal px-4 py-2"
          >
            {translate('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
