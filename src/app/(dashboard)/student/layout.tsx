'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import NProgress from 'nprogress';
import StudentSidebar from '@/components/ui/pages/dashboard/StudentSidebar';
import StudentHeader from '@/components/ui/pages/dashboard/StudentHeader';
import ElectiveSubjectsModal from '@/components/ui/pages/dashboard/ElectiveSubjectsModal';
import {
  SidebarProvider,
  useSidebar,
} from '@/components/contexts/SidebarContext';
import { useLanguage } from '@/components/hooks/useLanguage';
import { RootState } from '@/components/store';
import { useElectiveSubjects } from '@/components/hooks/useElectiveSubjects';
import StudentFooter from '@/components/ui/pages/dashboard/StudentFooter';
import {
  useGetSchoolSettings,
  useGetStudentProfile,
} from '@/lib/api/student/queryHooks';
import PushNotificationLayout from '@/lib/firebase/PushNotification';
import { updateUserProfile } from '@/components/store/slices/studentAuthSlice';

interface StudentLayoutProps {
  children: ReactNode;
}

function StudentLayoutContent({ children }: StudentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Track if component has mounted on client to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Initialize language from Redux store
  // This hook will rehydrate language from localStorage and load translations
  const { languages, currentLanguage } = useLanguage();

  // Get current language object to check if it's RTL
  const currentLangObj = languages.find(
    (lang) => lang.code === currentLanguage,
  );

  // Get authentication state from Redux
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.studentAuth,
  );

  // Fetch school settings for dynamic colors and other settings
  const { data: schoolSettings } = useGetSchoolSettings();

  // Get school code from Redux state
  const { schoolCode } = useSelector((state: RootState) => state.studentAuth);

  // Fetch student profile to keep Redux state in sync with server
  const { data: profileData } = useGetStudentProfile(schoolCode);

  const dispatch = useDispatch();

  // Sync profile data to Redux when it changes
  useEffect(() => {
    if (profileData?.data && profileData.success) {
      dispatch(updateUserProfile(profileData.data));
    }
  }, [profileData, dispatch]);

  // Elective subjects modal logic
  const {
    showModal,
    setShowModal,
    electiveSubjectGroups,
    handleSaveElectiveSubjects,
  } = useElectiveSubjects();

  const {
    collapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    isMobile,
    setIsMobile,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
  } = useSidebar();

  // Set mounted state on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply RTL direction for Arabic language
  useEffect(() => {
    if (typeof document !== 'undefined' && currentLangObj) {
      // Set direction on HTML element
      document.documentElement.dir = currentLangObj.isRtl ? 'rtl' : 'ltr';

      // Also set lang attribute for accessibility
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLangObj, currentLanguage]);

  // Apply dynamic colors from school settings API
  // This updates CSS variables on the document root when API data is available
  useEffect(() => {
    if (typeof document !== 'undefined' && schoolSettings?.data?.settings) {
      const settings = schoolSettings.data.settings;

      // Update primary color CSS variable if available from API
      if (settings.primary_color) {
        document.documentElement.style.setProperty(
          '--primary-color',
          settings.primary_color,
        );
      }

      // Update secondary color CSS variable if available from API
      if (settings.secondary_color) {
        document.documentElement.style.setProperty(
          '--secondary-color',
          settings.secondary_color,
        );
      }
    }
  }, [schoolSettings]);

  // Show/hide NProgress based on loading state
  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }

    // Cleanup on unmount
    return () => {
      NProgress.done();
    };
  }, [loading]);

  // Check for account deactivation and redirect to inactive page
  // This runs before authentication check to ensure immediate redirect
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const isDeactivated = localStorage.getItem('account_deactivated');
      const deactivationMessage = localStorage.getItem('deactivation_message');

      if (isDeactivated === 'true') {
        // Redirect to inactive page with message
        const message =
          deactivationMessage ||
          'Your account is inactive. Contact school administrator for further information';
        const encodedMessage = encodeURIComponent(message);
        router.replace(`/student/auth/inactive?message=${encodedMessage}`);
      }
    }
  }, [mounted, router]);

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (mounted && !isAuthenticated && !loading) {
      router.replace('/student/auth/login');
    }
  }, [mounted, isAuthenticated, loading, router]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle menu click for both mobile and desktop
  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileDrawerOpen(!isMobileDrawerOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Close mobile drawer when clicking outside
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsMobileDrawerOpen(false);
    }
  };

  // Show loading state during initial mount to prevent hydration mismatch
  // This ensures server and client render the same HTML initially
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" suppressHydrationWarning />;
  }

  // Don't render dashboard if user is not authenticated
  // The redirect will happen via useEffect
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50" suppressHydrationWarning />;
  }

  // Minimal layout mode: hide sidebar/header/footer for full-screen pages
  // We use this for the online exam detail flow to match the provided UI
  const isMinimalLayout = pathname?.startsWith('/student/exams/online/');

  if (isMinimalLayout) {
    // Full-screen minimal layout for online exam pages:
    // Use light gray page background; individual page sections can override to white.
    return (
      <div className="min-h-screen" suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden!">
      {/* Mobile Overlay - only render on client after mount */}
      {isMobile && isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <StudentSidebar
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content - Responsive margins for tablet and desktop */}
      {/* Using explicit LTR/RTL variants for proper spacing */}
      <div
        className={`transition-all duration-300 flex-1 flex flex-col ${
          isMobile
            ? '' // Full width on mobile
            : sidebarCollapsed
              ? 'ltr:ml-14 ltr:md:ml-16 rtl:mr-14 rtl:md:mr-16' // Collapsed sidebar margin
              : 'ltr:ml-64 ltr:md:ml-76 rtl:mr-64 rtl:md:mr-76' // Expanded sidebar margin
        }`}
      >
        {/* Header - Responsive for all screen sizes */}
        <StudentHeader onMenuClick={handleMenuClick} isMobile={isMobile} />

        {/* Page Content - Responsive padding for tablets and desktop */}
        <div className="p-3 sm:p-4 lg:p-6 flex-1">{children}</div>
      </div>

      {/* Footer - mt-auto to stick to bottom */}
      <StudentFooter />

      {/* Elective Subjects Modal */}
      <ElectiveSubjectsModal
        open={showModal}
        onOpenChange={setShowModal}
        electiveSubjectGroups={electiveSubjectGroups}
        onSave={handleSaveElectiveSubjects}
      />
    </div>
  );
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <PushNotificationLayout>
      <SidebarProvider>
        <StudentLayoutContent>{children}</StudentLayoutContent>
      </SidebarProvider>
    </PushNotificationLayout>
  );
}
