'use client';

import { useLanguage } from '@/components/hooks/useLanguage';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { BiEditAlt, BiX } from 'react-icons/bi';

type CSSVarStyle = React.CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
};

// Define the form data structure
export interface AuthFormData {
  schoolCode: string;
  grNumber: string;
  password: string;
  dateOfBirth?: Date; // Optional field for reset password flow
}

// Define the props interface for the AuthForm component
interface AuthFormProps {
  // Form configuration
  formType: 'login' | 'reset-password';
  // When true, school code input stays locked (used for URL prefill)
  isSchoolCodeLocked?: boolean;
  // Branding inputs
  logoSrc?: string;
  primaryColor?: string;
  primaryHoverColor?: string;

  // Form data and handlers
  formData: AuthFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;

  // UI customization
  title: string;
  description: string;
  buttonText: string;
  buttonLoadingText: string;

  // Optional props for different layouts
  showImage?: boolean;
  imageSrc?: string;
  imageAlt?: string;

  // Links
  resetPasswordLink?: string;
  loginLink?: string;
  // Privacy policy and terms links from system settings
  privacyPolicyLink?: string;
  termsLink?: string;
  // Optional toggle handler lets the parent swap between login/reset without navigation
  onFormTypeToggle?: (nextForm: 'login' | 'reset-password') => void;

  // Password field customization
  passwordLabel?: string;
  passwordPlaceholder?: string;

  // Date change handler (for reset password flow)
  onDateChange?: (date: Date | undefined) => void;
}

export default function AuthForm({
  formType,
  isSchoolCodeLocked = false,
  formData,
  onInputChange,
  onSubmit,
  isLoading,
  title,
  description,
  buttonText,
  buttonLoadingText,
  showImage = true,
  imageSrc,
  imageAlt = 'Authentication Image',
  logoSrc,
  primaryColor,
  primaryHoverColor,
  resetPasswordLink,
  loginLink,
  privacyPolicyLink,
  termsLink,
  onFormTypeToggle,
  passwordLabel = 'Password',
  passwordPlaceholder = 'Enter Password',
  onDateChange,
}: AuthFormProps) {
  const { translations } = useLanguage();
  const hasToggleHandler = Boolean(onFormTypeToggle);
  const hasResetPasswordLink = Boolean(resetPasswordLink);
  const hasLoginLink = Boolean(loginLink);

  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // State for calendar modal and selected date (for reset password flow)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.dateOfBirth,
  );
  const [manualDateInput, setManualDateInput] = useState('');

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Update manual input field when date is selected from calendar
      setManualDateInput(format(date, 'dd/MM/yyyy'));
      // Notify parent component about date change
      onDateChange?.(date);
      // Close the modal after date selection
      setIsCalendarOpen(false);
    }
  };

  // Handle manual date input
  const handleManualDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualDateInput(value);

    // Try to parse the date in DD/MM/YYYY format
    if (value.length === 10) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);

        // Validate the date
        if (
          !isNaN(date.getTime()) &&
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
          setSelectedDate(date);
          // Notify parent component about date change
          onDateChange?.(date);
        }
      }
    }
  };

  const buttonBaseClass =
    'w-full text-white text-xl font-normal py-2 px-4 rounded-[4px] transition-colors duration-200';
  const buttonClassName = primaryColor
    ? `${buttonBaseClass} ${primaryHoverColor
      ? 'hover:bg-(--auth-btn-hover-color)'
      : 'hover:opacity-90'
    }`
    : `${buttonBaseClass} bg-(--primary-color) hover:bg-black`;
  const buttonStyle: CSSVarStyle | undefined = primaryColor
    ? {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
      ...(primaryHoverColor
        ? { '--auth-btn-hover-color': primaryHoverColor }
        : {}),
    }
    : undefined;
  const resolvedImageSrc =
    typeof imageSrc === 'string' && imageSrc.trim().length > 0
      ? imageSrc
      : undefined;

  return (
    <div className="flex overflow-hidden min-h-screen">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-xl">
          {/* Logo */}
          {logoSrc && (
            <div className="mb-8">
              <Image
                src={logoSrc}
                alt="Logo"
                width={0}
                height={0}
                className="w-[180px] h-[60px] object-contain"
                priority
              />
            </div>
          )}

          {/* Title and Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 text-base font-normal leading-relaxed">
              {description}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* School Code Field */}
            <div className="space-y-4">
              <Label
                htmlFor="schoolCode"
                className="text-base font-normal leading-relaxed block mb-2"
              >
                {translations.schoolCode || 'School Code'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              {/* Lock the field whenever the code comes from the URL so users understand it is pre-selected */}
              <Input
                id="schoolCode"
                name="schoolCode"
                type="text"
                placeholder={
                  translations.enterSchoolCode || 'Enter School Code'
                }
                value={formData.schoolCode}
                onChange={onInputChange}
                disabled={isSchoolCodeLocked}
                aria-disabled={isSchoolCodeLocked}
                required
                className="w-full px-3 py-2 bg-[var(--light-primary-color)] border border-[#EAEAEA] rounded-[4px] shadow-none"
              />
            </div>

            {/* GR Number Field */}
            <div className="space-y-4">
              <Label
                htmlFor="grNumber"
                className="text-base font-normal leading-relaxed block mb-2"
              >
                {translations.grNumber || 'GR Number'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="grNumber"
                name="grNumber"
                type="text"
                placeholder={
                  translations.enterGrNumber || 'Enter your General Roll Number'
                }
                value={formData.grNumber}
                onChange={onInputChange}
                required
                className="w-full px-3 py-2 bg-[var(--light-primary-color)] border border-[#EAEAEA] rounded-[4px] shadow-none"
              />
            </div>

            {/* Password Field (for login) OR Date of Birth Field (for reset password) */}
            {formType === 'login' ? (
              <div className="space-y-4">
                <Label
                  htmlFor="password"
                  className="text-base font-normal leading-relaxed block mb-2"
                >
                  {passwordLabel} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={passwordPlaceholder}
                    value={formData.password}
                    onChange={onInputChange}
                    required
                    className="w-full px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 bg-(--light-primary-color) border border-[#EAEAEA] rounded-[4px] shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 rtl:right-auto rtl:left-0 rtl:pl-3 rtl:pr-0 flex items-center"
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label
                  htmlFor="dateOfBirth"
                  className="text-base font-normal leading-relaxed block mb-2"
                >
                  {translations.dateOfBirth || 'Date Of Birth'}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={
                      selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''
                    }
                    readOnly
                    required
                    onClick={() => setIsCalendarOpen(true)}
                    className="w-full px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 bg-(--light-primary-color) border border-[#EAEAEA] rounded-[4px] shadow-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(true)}
                    className="absolute inset-y-0 right-0 pr-3 rtl:right-auto rtl:left-0 rtl:pl-3 rtl:pr-0 flex items-center"
                  >
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Reset Password Link (only for login form) */}
            {formType === 'login' &&
              (hasResetPasswordLink || hasToggleHandler) && (
                /**
                 * When the parent supplies a toggle handler we only swap the UI locally.
                 * Otherwise we fall back to navigating to whichever link we received.
                 */
                <div className="text-right">
                  {hasToggleHandler && onFormTypeToggle ? (
                    <button
                      type="button"
                      onClick={() => onFormTypeToggle('reset-password')}
                      className="text-base font-normal hover:underline"
                      style={primaryColor ? { color: primaryColor } : undefined}
                    >
                      {translations.resetPasswordQuestion || 'Reset Password?'}
                    </button>
                  ) : hasResetPasswordLink && resetPasswordLink ? (
                    <Link
                      href={resetPasswordLink}
                      className="text-base font-normal hover:underline"
                      style={primaryColor ? { color: primaryColor } : undefined}
                    >
                      {translations.resetPasswordQuestion || 'Reset Password?'}
                    </Link>
                  ) : null}
                </div>
              )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className={buttonClassName}
              style={buttonStyle}
            >
              {isLoading ? buttonLoadingText : buttonText}
            </Button>

            {/* Login Link (only for reset password form) */}
            {formType === 'reset-password' &&
              (hasLoginLink || hasToggleHandler) && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {translations.rememberPassword || 'Remember your password?'}{' '}
                    {hasToggleHandler && onFormTypeToggle ? (
                      <button
                        type="button"
                        onClick={() => onFormTypeToggle('login')}
                        className="hover:underline"
                        style={
                          primaryColor ? { color: primaryColor } : undefined
                        }
                      >
                        {translations.logIn || 'Log In'}
                      </button>
                    ) : hasLoginLink && loginLink ? (
                      <Link
                        href={loginLink}
                        className="hover:underline"
                        style={
                          primaryColor ? { color: primaryColor } : undefined
                        }
                      >
                        {translations.logIn || 'Log In'}
                      </Link>
                    ) : null}
                  </p>
                </div>
              )}

            {/* Terms and Privacy */}
            <div className="text-center text-base font-normal text-gray-500 md:max-w-[400px] mx-auto">
              {translations.byContinuingYouAccept ||
                'By continuing, you accept our'}{' '}
              <Link
                href={termsLink || '#'}
                className="underline underline-offset-2"
                style={primaryColor ? { color: primaryColor } : undefined}
                target={termsLink ? '_blank' : undefined}
                rel={termsLink ? 'noopener noreferrer' : undefined}
              >
                {translations.termsOfService || 'Terms of Service'}
              </Link>{' '}
              {translations.and || 'and'}{' '}
              <Link
                href={privacyPolicyLink || '#'}
                className="underline underline-offset-2"
                style={primaryColor ? { color: primaryColor } : undefined}
                target={privacyPolicyLink ? '_blank' : undefined}
                rel={privacyPolicyLink ? 'noopener noreferrer' : undefined}
              >
                {translations.privacyPolicy || 'Privacy Policy'}
              </Link>
              .
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image (only show if enabled) */}
      {showImage && resolvedImageSrc && (
        <div className="hidden lg:flex lg:flex-1 h-screen">
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={resolvedImageSrc}
              alt={imageAlt}
              width={0}
              height={0}
              className="w-full h-full object-fill"
              priority
            />
          </div>
        </div>
      )}

      {/* Calendar Modal (only for reset password) */}
      {formType === 'reset-password' && (
        <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <DialogContent
            className="max-w-[95vw] sm:max-w-[600px] p-0 max-h-[90vh] overflow- y-auto"
            showCloseButton={false}
          >
            <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-200 p-4 sm:p-6">
              <DialogTitle className="text-lg sm:text-xl font-bold">
                {translations.selectDate || 'Select Date'}
              </DialogTitle>
              <DialogClose>
                <BiX className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-gray-400 bg-[var(--light-primary-color)] border border-gray-200 rounded-[4px] p-1 flex-shrink-0" />
              </DialogClose>
            </DialogHeader>
            <div className="px-4 sm:px-6">
              <Label
                htmlFor="manualDateInput"
                className="text-sm sm:text-base font-normal text-gray-900 block mb-2"
              >
                {translations.dateOfBirth || 'Date Of Birth'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="manualDateInput"
                  name="manualDateInput"
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={manualDateInput}
                  onChange={handleManualDateInput}
                  maxLength={10}
                  className="w-full p-2.5 sm:p-3 pr-10 rtl:pr-3 rtl:pl-10 text-sm sm:text-base bg-[var(--light-primary-color)] border border-[#EAEAEA] rounded-[4px] shadow-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/10 transition-all"
                />
                {/* icon */}
                <BiEditAlt className="w-4 h-4 sm:w-5 sm:h-5 absolute right-3 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-3 text-gray-400" />
              </div>
            </div>
            <div className="flex justify-center px-3 sm:px-6 py-3 sm:py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                captionLayout="dropdown"
                fromYear={1950}
                toYear={new Date().getFullYear()}
                defaultMonth={selectedDate || new Date(2000, 0)}
                weekStartsOn={1}
                className="w-full max-w-full border rounded-[12px] bg-[var(--light-primary-color)] p-3 sm:p-4"
                classNames={{
                  // Month caption styling (container for dropdowns)
                  month_caption: 'flex justify-center items-center mb-4 w-full',
                  // Dropdowns container styling
                  dropdowns:
                    'flex items-center gap-2 text-base font-semibold justify-end',
                  // Individual dropdown root styling
                  dropdown_root:
                    'relative bg-[var(--fifth-color)] text-[var(--primary-color)] text-xl w-full font-medium rounded-[8px] px-3 sm:px-4 py-2.5 hover:border-gray-400 focus-within:border-[var(--primary-color)] focus-within:ring-2 focus-within:ring-[var(--primary-color)]/10 transition-all cursor-pointer',
                  // Caption label (the text inside dropdown with arrow on right)
                  caption_label:
                    'text-xl font-medium text-[var(--primary-color)] flex items-center justify-between w-full gap-4',
                  // Dropdown select element (native select, hidden but functional)
                  dropdown:
                    'absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10',
                  // Navigation buttons (previous/next month)
                  nav: 'flex items-center gap-2 absolute top-0 inset-x-0 justify-between z-10',
                  button_previous: 'h-10 w-10 flex items-center justify-center',
                  button_next: 'h-10 w-10 flex items-center justify-center',
                  // Table and days styling
                  table: 'w-full border-collapse mt-4',
                  // Weekday headers (Mon, Tue, Wed, etc) with bottom border
                  weekdays: 'flex w-full mb-3 pb-3 border-b border-gray-200',
                  weekday:
                    'text-gray-700 text-xl font-normal flex-1 text-center',
                  // Week row
                  week: 'flex w-full justify-around mb-1',
                  // Individual day cell (fixed size for perfect circles)
                  day: 'p-0 text-center relative flex items-center justify-center',
                  // Day button (the actual clickable element - perfect circle)
                  day_button:
                    'w-10 h-10 min-w-[40px] min-h-[40px] text-xl font-normal rounded-full flex items-center justify-center shrink-0',
                  // Selected day styling
                  selected:
                    'bg-(--primary-color) text-white font-semibold rounded-full w-10 h-10',
                  // Today's date styling
                  today:
                    'bg-(--primary-color) font-semibold rounded-full text-white w-10 h-10',
                  // Outside month dates (greyed out)
                  outside: 'text-gray-400 opacity-50',
                  // Disabled dates
                  disabled:
                    'text-gray-300 cursor-not-allowed hover:bg-transparent',
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
