'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useLanguage } from '@/components/hooks/useLanguage';
import {
  BiHomeSmile,
  BiBookOpen,
  BiBookContent,
  BiChat,
  BiListOl,
  BiNotepad,
  BiClipboard,
  BiDetail,
  BiTask,
  BiShield,
  BiCalendar,
  BiImages,
  // BiBell,
  BiSpreadsheet,
  BiX,
  BiGlobe,
  BiChevronDown,
  BiBus,
  BiGroup,
  BiBell,
  BiInfoCircle,
  BiSupport,
  BiAward,
  BiUserPlus,
  BiUserCheck,
  BiCreditCard,
} from 'react-icons/bi';
import { LuNotebook } from 'react-icons/lu';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { useInstituteType } from '@/hooks/useInstituteType';

interface StudentSidebarProps {
  collapsed: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function StudentSidebar({
  collapsed,
  isMobile = false,
  isOpen = false,
  onClose,
}: StudentSidebarProps) {
  // Get current pathname for route-based active item detection
  const pathname = usePathname();
  const translate = useTranslate();

  // Get language state and functions from Redux
  const { changeLanguage, currentLanguageName, languages } = useLanguage();
  // Fetch institute type to dynamically adjust modules for Tuition Media vs School mode
  const { isTuitionMedia } = useInstituteType();
  // Fetch the dynamic school logo once; reuse everywhere so desktop and mobile match backend branding
  const { data: schoolSettings, isLoading: isLoadingLogo } =
    useGetSchoolSettings();
  const fallbackLogo = '/assets/images/common/logo.png';
  const dynamicLogo = schoolSettings?.data?.settings?.horizontal_logo;
  const resolvedLogo =
    typeof dynamicLogo === 'string' && dynamicLogo.trim().length > 0
      ? dynamicLogo.trim()
      : fallbackLogo;

  // Language selector state for mobile
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguageName);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Initialize selected language from Redux store
  useEffect(() => {
    setSelectedLanguage(currentLanguageName);
  }, [currentLanguageName]);

  // Get enabled features from school settings
  // Features object from API: { "1": "Student Management", "2": "Academics Management", ... }
  const enabledFeatures = schoolSettings?.data?.features || {};

  // Helper function to check if a feature is enabled by its name
  const isFeatureEnabled = (featureName: string) => {
    // If features list is empty or undefined, assume no features are enabled
    if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
      return false;
    }
    // Check if the feature name exists in the values of enabledFeatures object
    return Object.values(enabledFeatures).some(
      (feature) =>
        typeof feature === 'string' &&
        feature.toLowerCase() === featureName.toLowerCase(),
    );
  };

  // All navigation items with their associated feature requirements
  // featureRequired: name of the feature from API that must be enabled to show this item
  // If featureRequired is null, the item is always shown
  const allNavigationItems = [
    {
      id: 'home',
      label: translate('home'),
      icon: BiHomeSmile,
      route: '/student/dashboard',
      featureRequired: null, // Always show home/dashboard
    },
    {
      id: 'request-tutor',
      label: translate('requestTutor') || 'Request a Tutor (গৃহশিক্ষক রিকোয়েস্ট)',
      icon: BiUserPlus,
      route: '/student/request-tutor',
      featureRequired: null,
      tuitionMediaOnly: true,
    },
    {
      id: 'my-tuition-posts',
      label: translate('myTuitions') || 'My Tuition Posts (আমার পোস্টসমূহ)',
      icon: BiClipboard,
      route: '/student/my-tuitions',
      featureRequired: null,
      tuitionMediaOnly: true,
    },
    {
      id: 'subjects',
      label: translate('mySubjects'),
      icon: BiBookOpen,
      route: '/student/subjects',
      featureRequired: 'Academics Management', // Feature ID: 2
    },
    {
      id: 'assignments',
      label: translate('assignments'),
      icon: BiBookContent,
      route: '/student/assignments',
      featureRequired: 'Assignment Management', // Feature ID: 11
    },
    {
      id: 'teachers',
      label: isTuitionMedia
        ? (translate('myTutors') || 'My Tutors (আমার গৃহশিক্ষকগণ)')
        : translate('teachers'),
      icon: isTuitionMedia ? BiUserCheck : BiGroup,
      route: '/student/teachers',
      featureRequired: isTuitionMedia ? null : 'Teacher Management', // Feature ID: 4
    },
    {
      id: 'chats',
      label: isTuitionMedia
        ? (translate('tutorMessaging') || 'Tutor Messaging (শিক্ষকের সাথে বার্তালাপ)')
        : translate('chats'),
      icon: BiChat,
      route: '/student/chats',
      featureRequired: isTuitionMedia ? null : 'Chat Module', // Feature ID: 20
    },
    {
      id: 'tuition-fees',
      label: translate('tuitionFees') || 'Tuition Bills (টিউশন সম্মানী ও ফি)',
      icon: BiCreditCard,
      route: '/student/tuition-fees',
      featureRequired: null,
      tuitionMediaOnly: true,
    },
    {
      id: 'timetable',
      label: translate('timetable'),
      icon: BiListOl,
      route: '/student/timetable',
      featureRequired: 'Timetable Management', // Feature ID: 7
    },
    {
      id: 'noticeboard',
      label: translate('noticeboard'),
      icon: BiNotepad,
      route: '/student/noticeboard',
      featureRequired: 'Announcement Management', // Feature ID: 12
    },
    {
      id: 'exams',
      label: translate('exams'),
      icon: BiClipboard,
      route: '/student/exams',
      featureRequired: 'Exam Management', // Feature ID: 9
    },
    {
      id: 'result',
      label: translate('result'),
      icon: BiDetail,
      route: '/student/result',
      featureRequired: 'Exam Management', // Feature ID: 9 (results are part of exam management)
    },

    {
      id: 'report',
      label: translate('report'),
      icon: BiTask,
      route: '/student/report',
      featureRequired: ['Exam Management', 'Assignment Management'], // Show if either is enabled
    },
    {
      id: 'diary',
      label: translate('myDiary'),
      icon: LuNotebook,
      route: '/student/diary',
      featureRequired: 'Student Management', // Feature ID: 1 (diary is related to student management)
    },
    {
      id: 'transportation',
      label: translate('transportation'),
      icon: BiBus,
      route: '/student/transportation',
      featureRequired: 'Transportation Module', // Feature ID: 21
    },
    {
      id: 'holiday',
      label: translate('holiday'),
      icon: BiCalendar,
      route: '/student/holiday',
      featureRequired: 'Holiday Management', // Feature ID: 6
    },
    {
      id: 'gallery',
      label: translate('gallery'),
      icon: BiImages,
      route: '/student/gallery',
      featureRequired: 'School Gallery Management', // Feature ID: 17
    },
    {
      id: 'certificate',
      label: translate('certificate'),
      icon: BiAward,
      route: '/student/certificate',
      featureRequired: 'ID Card - Certificate Generation', // Feature ID: 18
    },
    {
      id: 'guardian',
      label: translate('guardianDetails'),
      icon: BiBookContent,
      route: '/student/guardian',
      featureRequired: null, // Always show guardian details
    },
    {
      id: 'notifications',
      label: translate('notifications'),
      icon: BiBell,
      route: '/student/notifications',
      featureRequired: 'Announcement Management', // Feature ID: 12
    },
    {
      id: 'privacy',
      label: translate('privacyPolicy'),
      icon: BiShield,
      route: '/student/privacy',
      featureRequired: null, // Always show privacy policy
    },
    {
      id: 'terms',
      label: translate('termsAndCondition'),
      icon: BiSpreadsheet,
      route: '/student/terms',
      featureRequired: null, // Always show terms and conditions
    },
    {
      id: 'about-us',
      label: translate('aboutUs'),
      icon: BiInfoCircle,
      route: '/student/about-us',
      featureRequired: null, // Always show about us
    },
    {
      id: 'contact-us',
      label: translate('contactUs'),
      icon: BiSupport,
      route: '/student/contact-us',
      featureRequired: null, // Always show contact us
    },
  ];

  // Modules that must be hidden when isTuitionMedia is true
  const hiddenInTuitionMedia = new Set([
    'transportation',
    'timetable',
    'exams',
    'result',
    'certificate',
    'diary',
    'holiday',
  ]);

  // Filter navigation items based on mode and enabled features
  const navigationItems = allNavigationItems.filter((item) => {
    // Hide school-specific modules when in Tuition Media mode
    if (isTuitionMedia && hiddenInTuitionMedia.has(item.id)) {
      return false;
    }

    // Hide tuition-media-specific items when not in tuition media mode
    if (!isTuitionMedia && (item as { tuitionMediaOnly?: boolean }).tuitionMediaOnly) {
      return false;
    }

    // If no feature is required, always show the item
    if (!item.featureRequired) {
      return true;
    }

    // Check if the required feature is enabled
    // Support validation for multiple features (OR condition)
    if (Array.isArray(item.featureRequired)) {
      return item.featureRequired.some((feature) => isFeatureEnabled(feature));
    }

    // Single feature check
    return isFeatureEnabled(item.featureRequired);
  });

  // Function to determine active item based on current route
  const getActiveItem = () => {
    // Check for exact route matches first
    const exactMatch = navigationItems.find((item) => item.route === pathname);
    if (exactMatch) {
      return exactMatch.id;
    }

    // Check for partial matches (e.g., /student/dashboard/profile should match dashboard)
    const partialMatch = navigationItems.find(
      (item) => pathname.startsWith(item.route) && item.route !== '/student',
    );
    if (partialMatch) {
      return partialMatch.id;
    }

    // Default to home if no match found
    return 'home';
  };

  // Get the current active item based on route
  const activeItem = getActiveItem();

  // Handle mobile drawer close on item click
  const handleItemClick = (itemId: string) => {
    // Find the route for the clicked item and navigate
    const item = navigationItems.find((navItem) => navItem.id === itemId);
    if (item) {
      // Navigation will be handled by Next.js Link components
      // Just close the mobile drawer if needed
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  // Handle language selection - update Redux store and close dropdown
  const handleLanguageSelect = (languageName: string) => {
    // Find the language code from the language name
    const selectedLang = languages.find((lang) => lang.name === languageName);
    if (selectedLang) {
      // Update language in Redux store
      changeLanguage(selectedLang.code);
      setSelectedLanguage(selectedLang.name);
    }
    setIsLanguageDropdownOpen(false);
    // Close mobile sidebar after language selection (like other navigation items)
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isOpen && onClose) {
        onClose();
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen, onClose]);

  // Mobile drawer overlay
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-(--light-primary-color) bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Drawer - Responsive width for different mobile sizes */}
        {/* Using explicit LTR/RTL variants for proper positioning */}
        <div
          className={`mobile-drawer fixed top-0 ltr:left-0 rtl:right-0 h-screen w-72 sm:w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen
            ? 'translate-x-0'
            : 'ltr:-translate-x-full rtl:translate-x-full'
            }`}
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside drawer from bubbling to overlay
        >
          <div className="flex flex-col h-full p-4 sm:p-6 ltr:border-r rtl:border-l border-gray-200">
            {/* Mobile Header with Close Button - Responsive sizing */}
            <div className="shrink-0 flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-2 w-[120px] h-[42px] sm:w-[140px] sm:h-[50px]">
                <Image
                  src={resolvedLogo}
                  alt="Logo"
                  width={0}
                  height={0}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            {/* Navigation Menu - Responsive sizing */}
            <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 mb-20">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.route}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center text-base font-normal cursor-pointer gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-left ${activeItem === item.id
                      ? 'bg-(--primary-color) text-white'
                      : 'text-black hover:bg-(--primary-color) hover:text-white'
                      }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {/* Language Selector - Mobile Only - Responsive sizing */}
              <div className="relative">
                {/* Language Dropdown Container */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling to avoid closing sidebar
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                    }}
                    className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <BiGlobe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        {selectedLanguage}
                      </span>
                    </div>
                    <BiChevronDown
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {/* Language Dropdown Options - Responsive sizing */}
                  {isLanguageDropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to avoid closing sidebar
                            handleLanguageSelect(language.name);
                          }}
                          className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${selectedLanguage === language.name
                            ? 'bg-gray-100'
                            : ''
                            }`}
                        >
                          {language.image && (
                            <Image
                              src={language.image}
                              alt={language.name}
                              width={20}
                              height={20}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                            />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {language.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar - Responsive width for tablets and desktop
  // Using explicit LTR/RTL variants for proper positioning
  return (
    <div
      className={`${collapsed ? 'w-14 md:w-16' : 'w-64 md:w-76'
        } bg-white text-black h-screen fixed ltr:left-0 rtl:right-0 top-0 z-50 transition-all duration-300 ltr:border-r rtl:border-l border-[#EAEAEA] hidden md:block`}
    >
      <div className="">
        {/* Logo Section - Responsive sizing for tablet and desktop */}
        {/* Using gap instead of space-x for RTL support */}
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-4 md:px-6 pt-4 md:pt-6'
            } mb-[10px]`}
        >
          {!collapsed && (
            <span className="h-[50px] w-[150px] md:h-[60px] md:w-[180px] flex items-center justify-center overflow-hidden">
              {isLoadingLogo ? (
                // Loading skeleton for logo - matches logo dimensions with pulse animation
                <div className="w-full h-full bg-gray-200 rounded animate-pulse" />
              ) : (
                <Link href="/student/dashboard">
                  <Image
                    src={resolvedLogo}
                    alt="Logo"
                    width={0}
                    height={0}
                    className="w-full h-full object-contain aspect-auto"
                    priority
                  />
                </Link>
              )}
            </span>
          )}
        </div>

        {!collapsed && <div className="h-px w-full bg-gray-200 mb-3"></div>}
        {/* Navigation Menu - Responsive sizing for tablet and desktop */}
        <nav
          className={`space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 ${collapsed
            ? 'pb-0 h-[calc(100vh-100px)] px-1.5 md:px-2'
            : 'pb-4 md:pb-6 h-[calc(100vh-150px)] px-4 md:px-6'
            }`}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.route}
                className={`w-full flex items-center text-base font-normal cursor-pointer ${collapsed
                  ? 'justify-center px-1.5 md:px-2'
                  : 'gap-2 md:gap-3 px-3 md:px-4'
                  } py-2.5 md:py-3 rounded-lg transition-colors text-left ${activeItem === item.id
                    ? 'bg-(--primary-color) text-white'
                    : 'text-black hover:bg-(--primary-color) hover:text-white'
                  }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                {!collapsed && (
                  <span className="text-xs md:text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
