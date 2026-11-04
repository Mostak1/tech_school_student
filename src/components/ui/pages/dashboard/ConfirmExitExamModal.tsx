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

interface ConfirmExitExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Confirmation modal for exiting the exam.
 * Warns the user that exiting will lose their progress.
 */
export default function ConfirmExitExamModal({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmExitExamModalProps) {
  const translate = useTranslate();

  // Handle exit confirmation
  const handleExit = () => {
    onConfirm();
    onOpenChange(false);
  };

  // Handle cancel action
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-[420px] p-6 bg-white rounded-[12px] shadow-xl"
        showCloseButton={false}
      >
        <DialogTitle className="text-center text-base md:text-2xl font-semibold text-gray-700">
          {translate('exitExam')}
        </DialogTitle>
        <DialogDescription className="text-center text-sm font-normal text-gray-600">
          {translate('areYouSureYouWantToExitExam')}
        </DialogDescription>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            onClick={handleExit}
            className="bg-(--primary-color) rounded-[4px] text-white text-base font-normal px-4 py-2"
          >
            {translate('exit')}
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
