'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BiX } from 'react-icons/bi';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useStudentChangePassword } from '@/lib/api/student';
import { toastUtils } from '@/components/lib/toast';
import { useTranslate } from '@/components/hooks/useTranslate';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const translate = useTranslate();
  // State for password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for form values
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Change password mutation hook
  const changePasswordMutation = useStudentChangePassword();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastUtils.error(translate('pleaseFillInAllFields'));
      return;
    }

    // Validation: Check if new passwords match
    if (newPassword !== confirmPassword) {
      toastUtils.error(translate('newPasswordsDoNotMatch'));
      return;
    }

    // Validation: Check if new password is different from current password
    if (currentPassword === newPassword) {
      toastUtils.error(translate('newPasswordMustBeDifferent'));
      return;
    }

    // Validation: Check password length (minimum 6 characters)
    if (newPassword.length < 6) {
      toastUtils.error(translate('passwordMustBeAtLeast6Characters'));
      return;
    }

    // Call the API to change password
    // API will return error code 109 (INVALID_PASSWORD) if current password is wrong
    // The mutation hook automatically handles all errors and shows toast messages
    changePasswordMutation.mutate(
      {
        current_password: currentPassword,
        new_password: newPassword,
        new_confirm_password: confirmPassword,
      },
      {
        onSuccess: () => {
          // Reset form fields on success
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          // Close the modal
          onOpenChange(false);
        },
        // Error handling is done in the mutation hook
        // Errors like "Current password is incorrect" will be shown as toast
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal is responsive: full width with margins on mobile, fixed width on larger screens */}
      <DialogContent
        className="max-w-[calc(100vw-2rem)] sm:max-w-[550px] p-0"
        showCloseButton={false}
      >
        {/* Header with close button - reduced padding on mobile */}
        <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between text-left rtl:text-right">
            <div className="flex-1">
              {/* Responsive title: smaller on mobile, larger on desktop */}
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                {translate('changeYourPassword')}
              </DialogTitle>
              {/* Responsive description: smaller text on mobile */}
              <DialogDescription className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed">
                {translate('toSecureYourAccountEnterCurrentPassword')}
              </DialogDescription>
            </div>
            {/* Close button: smaller on mobile, normal on desktop */}
            <DialogClose asChild>
              <button className="ml-2 sm:ml-4 rtl:ml-0 rtl:mr-2 sm:rtl:mr-4 p-1.5 sm:p-2 bg-(--light-primary-color) rounded-[4px] transition-colors border border-gray-200">
                <BiX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Form content - reduced padding on mobile */}
        <form onSubmit={handleSubmit} className="px-4 pb-4 sm:px-6 sm:pb-6">
          {/* Reduced spacing between fields on mobile */}
          <div className="space-y-3.5 sm:space-y-5">
            {/* Current Password Field */}
            <div>
              {/* Responsive label: smaller on mobile */}
              <label className="block text-sm sm:text-base font-normal text-gray-900 mb-1.5 sm:mb-2">
                {translate('currentPassword')}
              </label>
              <div className="relative">
                {/* Responsive input height: shorter on mobile */}
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder={translate('enterCurrentPassword')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 sm:h-12 pr-10 sm:pr-12 rtl:pr-3 rtl:pl-10 sm:rtl:pl-12 bg-(--light-primary-color) rounded-[4px] shadow-none border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
                />
                {/* Responsive eye icon position and size */}
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 rtl:left-2.5 rtl:right-auto sm:right-3 sm:rtl:left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showCurrentPassword ? (
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                      <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                
                  )}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              {/* Responsive label: smaller on mobile */}
              <label className="block text-sm sm:text-base font-normal text-gray-900 mb-1.5 sm:mb-2">
                {translate('newPassword')}
              </label>
              <div className="relative">
                {/* Responsive input height: shorter on mobile */}
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={translate('enterNewPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 sm:h-12 pr-10 sm:pr-12 rtl:pr-3 rtl:pl-10 sm:rtl:pl-12 bg-(--light-primary-color) rounded-[4px] shadow-none border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
                />
                {/* Responsive eye icon position and size */}
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 rtl:left-2.5 rtl:right-auto sm:right-3 sm:rtl:left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showNewPassword ? (
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                      <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
               
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div>
              {/* Responsive label: smaller on mobile */}
              <label className="block text-sm sm:text-base font-normal text-gray-900 mb-1.5 sm:mb-2">
                {translate('confirmNewPassword')}
              </label>
              <div className="relative">
                {/* Responsive input height: shorter on mobile */}
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={translate('reEnterNewPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 sm:h-12 pr-10 sm:pr-12 rtl:pr-3 rtl:pl-10 sm:rtl:pl-12 bg-(--light-primary-color) rounded-[4px] shadow-none border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
                />
                {/* Responsive eye icon position and size */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 rtl:left-2.5 rtl:right-auto sm:right-3 sm:rtl:left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                      <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
               
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button - responsive height and text size */}
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full h-11 sm:h-12 bg-(--primary-color) text-white text-base sm:text-xl font-normal rounded-[4px] mt-1.5 sm:mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {changePasswordMutation.isPending
                ? translate('changingPassword')
                : translate('changePassword')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
