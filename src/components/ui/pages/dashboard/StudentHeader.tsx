'use client';

import { useState, useRef, useEffect } from 'react';
import {
  BiMenu,
  BiChevronDown,
  BiGlobe,
  BiLogOut,
  BiUserCircle,
  BiLock,
  BiX,
} from 'react-icons/bi';
import { cn } from '@/components/lib/utils';
import NotificationDropdown from './NotificationDropdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';
import ChangePasswordModal from './ChangePasswordModal';
import LogoutModal from './LogoutModal';
import { useStudentLogout } from '@/lib/api/student';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import { useLanguage } from '@/components/hooks/useLanguage';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';

interface StudentHeaderProps {
  onMenuClick: () => void;
  isMobile?: boolean;
}

export default function StudentHeader({
  onMenuClick,
  isMobile = false,
}: StudentHeaderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Change password modal state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  // Logout modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // User profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Logout hook and router for handling logout
  const { logout } = useStudentLogout();
  const router = useRouter();

  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.studentAuth.user);

  // Get language state and translate function from Redux
  const { changeLanguage, currentLanguageName, languages } = useLanguage();
  const translate = useTranslate();
  // Load school settings once so we can swap the logo whenever backend updates it
  const { data: schoolSettings, isLoading: isLoadingLogo } =
    useGetSchoolSettings();
  const fallbackLogo = '/assets/images/common/logo.png';
  const dynamicLogo = schoolSettings?.data?.settings?.horizontal_logo;
  const resolvedLogo =
    typeof dynamicLogo === 'string' && dynamicLogo.trim().length > 0
      ? dynamicLogo.trim()
      : fallbackLogo;

  // Initialize selected language from Redux store
  useEffect(() => {
    setSelectedLanguage(currentLanguageName);
  }, [currentLanguageName]);

  // Handle language selection - update Redux store and close modal
  const handleLanguageSelect = (languageName: string) => {
    // Find the language code from the language name
    const selectedLang = languages.find((lang) => lang.name === languageName);
    if (selectedLang) {
      // Update language in Redux store
      changeLanguage(selectedLang.code);
      setSelectedLanguage(languageName);
    }
    setIsLanguageModalOpen(false); // Close modal after selection
  };

  // Handle logout - clears Redux state, query cache, and redirects to login
  const handleLogout = () => {
    // Call logout function to clear Redux state and query cache
    logout();

    // Close the logout modal
    setIsLogoutModalOpen(false);

    // Redirect to student login page
    router.push('/student/auth/login');
  };

  // Handle profile dropdown hover
  const handleProfileMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsProfileOpen(true);
    setTimeout(() => setIsProfileVisible(true), 10);
  };

  const handleProfileMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsProfileVisible(false);
      setTimeout(() => setIsProfileOpen(false), 150);
    }, 150);
  };

  // Handle click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        profileTriggerRef.current &&
        !profileTriggerRef.current.contains(event.target as Node)
      ) {
        setIsProfileVisible(false);
        setTimeout(() => setIsProfileOpen(false), 150);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isProfileOpen]);

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left Section - Menu and Logo */}
      {/* Using gap instead of space-x for RTL support */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 md:p-2 hover:bg-gray-100 rounded-[4px] transition-colors border-[1px] border-[#EAEAEA]"
        >
          <BiMenu className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
        </button>

        {/* Mobile Logo - Show on mobile and tablet */}
        {isMobile && (
          <div className="flex items-center">
            <div className="w-[90px] h-[32px] sm:w-[100px] sm:h-[35px]">
              {isLoadingLogo ? (
                // Loading skeleton for compact mobile logo
                <div className="w-full h-full bg-gray-200 rounded animate-pulse" />
              ) : (
                <Image
                  src={resolvedLogo}
                  alt="Logo"
                  width={0}
                  height={0}
                  className="w-full h-full object-contain"
                  priority
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Section - User Info and Controls */}
      {/* Using gap instead of space-x for RTL support */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
        {/* Language Selector Modal - Desktop and Tablet */}
        <div className="hidden md:block">
          <Dialog
            open={isLanguageModalOpen}
            onOpenChange={setIsLanguageModalOpen}
          >
            <DialogTrigger asChild>
              <div className="flex items-center gap-1.5 lg:gap-2 cursor-pointer hover:bg-gray-50 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors border border-gray-300 bg-white hover:border-gray-400">
                <BiGlobe className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-gray-900 ">
                  {selectedLanguage}
                </span>
                {/* Show only icon on tablets, full text on large screens */}
                <BiChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500 " />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" showCloseButton={false}>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-left text-xl font-bold text-gray-900">
                  {translate('chooseYourLanguage')}
                </DialogTitle>
                <DialogClose asChild>
                  <button className="p-2 bg-gray-100 rounded transition-colors border-[1px] border-[#EAEAEA]">
                    <BiX className="w-5 h-5 text-gray-400" />
                  </button>
                </DialogClose>
              </DialogHeader>
              <div className="space-y-2 mt-6">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      selectedLanguage === language.name
                        ? 'border-gray-300 bg-gray-100'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {language.image && (
                      <Image
                        src={language.image}
                        alt={language.name}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {language.name}
                    </span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* vertical divider - Hidden on mobile and tablet */}
        <div className="hidden lg:block h-10 w-[1px] bg-[#EAEAEA]"></div>

        {/* User Profile */}
        <div className="relative">
          {/* Trigger */}
          <div
            ref={profileTriggerRef}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
            className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 cursor-pointer hover:bg-gray-50 rounded-[4px] transition-colors p-1 md:p-1.5 lg:p-2"
          >
            <div className="border-[2px] border-[#EAEAEA] rounded-full p-0.5 md:p-1">
              <div className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src={user?.image || resolvedLogo}
                  alt="Profile"
                  width={0}
                  height={0}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>

            {/* User info - Show only on large screens (desktop) */}
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-medium text-gray-800 max-w-[150px] truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : 'Student'}
              </span>
              <span className="text-sm font-normal text-gray-800 flex items-center">
                {/* Class section with truncate - max width ~20 characters */}
                <span className="max-w-[100px] truncate">
                  {user?.class_section?.full_name || 'N/A'}
                </span>
                {/* vertical divider */}
                <span className="w-[1px] h-[15px] bg-gray-300 mx-2 flex items-center justify-center flex-shrink-0"></span>
                <span className="whitespace-nowrap">
                  {translate('rollNo')}: {user?.roll_number || 'N/A'}
                </span>
              </span>
            </div>
            <BiChevronDown className="text-base md:text-lg lg:text-xl text-white bg-(--primary-color) rounded-full p-0.5 md:p-1 flex-shrink-0" />
          </div>

          {/* Dropdown Content */}
          {isProfileOpen && (
            <div
              ref={profileDropdownRef}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
              }}
              onMouseLeave={handleProfileMouseLeave}
              className={cn(
                'absolute top-full ltr:right-0 rtl:left-0 z-50 mt-1 w-56 overflow-hidden rounded-md border bg-white shadow-md',
                'transition-all duration-200 ease-in-out',
                isProfileVisible
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-1',
              )}
            >
              <div className="text-sm font-normal py-3">
                {/* <Link
                  href="/student/dashboard"
                  className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                >
                  <BiHomeAlt2 className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                  <span>{translate('goBackToWebsite')}</span>
                </Link> */}
                <div className="h-px bg-gray-50"></div>
                <Link
                  href="/student/profile"
                  className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                >
                  <BiUserCircle className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                  <span>{translate('myProfile')}</span>
                </Link>
                <div className="h-px bg-gray-50"></div>
                <button
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="w-full p-3 hover:bg-gray-100 cursor-pointer flex items-center text-left"
                >
                  <BiLock className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                  <span>{translate('changePassword')}</span>
                </button>
                <div className="h-px bg-gray-50"></div>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full p-3 hover:bg-gray-100 cursor-pointer flex items-center text-left"
                >
                  <BiLogOut className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                  <span>{translate('logOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        onConfirm={handleLogout}
      />
    </div>
  );
}
