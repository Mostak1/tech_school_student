'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/components/hooks/useTranslate';

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
}

export default function LogoutModal({
  open,
  onOpenChange,
  onConfirm,
}: LogoutModalProps) {
  const translate = useTranslate();
  // Handle logout confirmation
  const handleLogout = () => {
    // Call the onConfirm callback if provided
    if (onConfirm) {
      onConfirm();
    }

    // Close the modal
    onOpenChange(false);
  };

  // Handle cancel action
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal is responsive and vertically centered */}
      <DialogContent
        className="max-w-[calc(100vw-2rem)] sm:max-w-[450px] w-full p-0 flex flex-col items-center justify-center gap-0"
        showCloseButton={false}
      >
        {/* Content wrapper with responsive padding - more compact on mobile */}
        <div className="w-full px-5 py-6 sm:p-8 text-center">
          {/* Title - optimized for mobile readability */}
          <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">
            {translate('areYouSureYouWantToLogOut')}
          </DialogTitle>

          {/* Description - compact on mobile, spacious on desktop */}
          <DialogDescription className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-8 leading-relaxed px-2 sm:px-0">
            {translate('youWillBeSignedOut')}
          </DialogDescription>

          {/* Button group - stacked on mobile, horizontal on desktop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            {/* Yes button - primary action with proper touch target */}
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto sm:min-w-[140px] h-12 bg-(--primary-color) hover:bg-(--primary-color)/90 text-white text-base sm:text-lg font-medium rounded-[4px] px-6 sm:px-8 transition-colors active:scale-[0.98] touch-manipulation"
            >
              {translate('yes')}
            </button>

            {/* No button - secondary action with proper touch target */}
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto sm:min-w-[140px] h-12 bg-white hover:bg-gray-50 text-gray-900 text-base sm:text-lg font-medium rounded-[4px] border-2 border-gray-300 hover:border-gray-400 transition-colors px-6 sm:px-8 active:scale-[0.98] touch-manipulation"
            >
              {translate('no')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
