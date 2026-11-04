'use client';
import MyProfileBanner from '@/components/ui/pages/dashboard/MyProfileBanner';
import AttendanceCalendar from '@/components/ui/pages/dashboard/AttendanceCalendar';
import OnlineLiveClasses from '@/components/ui/pages/dashboard/OnlineLiveClasses';
import LatestNotices from '@/components/ui/pages/dashboard/LatestNotices';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile } from 'react-icons/bi';
import { useTranslate } from '@/components/hooks/useTranslate';
import {
  useGetSchoolSettings,
  useGetSliders,
} from '@/lib/api/student/queryHooks';
import UpgradePlan from '@/components/ui/pages/dashboard/UpgradePlan';

// Main Dashboard Component
export default function StudentDashboard() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();

  // Fetch school settings to check if Slider Management feature is enabled
  const { data: schoolSettings } = useGetSchoolSettings();

  // Fetch slider data
  const { data: sliderData, isLoading: slidersLoading } = useGetSliders();

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
  ];

  // Get enabled features from school settings
  // Features object from API: { "1": "Student Management", "2": "Slider Management", ... }
  const enabledFeatures = schoolSettings?.data?.features || {};

  // Helper function to check if a feature is enabled by its name
  const isFeatureEnabled = (featureName: string) => {
    // If features list is empty or undefined, show all components (default behavior)
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

  // Check if Slider Management feature is enabled
  // We also check if there is actual data (or if it's loading) to decide validity
  const featureSliderEnabled = isFeatureEnabled('Slider Management');
  const hasSliderData =
    slidersLoading ||
    (sliderData?.success && sliderData?.data && sliderData.data.length > 0);
  const showSliderBanner = featureSliderEnabled && hasSliderData;

  // Check if Attendance Management feature is enabled
  const showAttendanceCalendar = isFeatureEnabled('Attendance Management');

  // Check if Announcement Management feature is enabled
  const showLatestNotices = isFeatureEnabled('Announcement Management');

  // Check if Timetable Management feature is enabled (online live classes)
  const showOnlineLiveClasses = isFeatureEnabled('Timetable Management');

  // Check if any feature is enabled
  const hasAnyFeature =
    showSliderBanner ||
    showAttendanceCalendar ||
    showLatestNotices ||
    showOnlineLiveClasses;

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb */}
      <Breadcrumb title={translate('dashboard')} items={breadcrumbItems} />

      {!hasAnyFeature ? (
        <UpgradePlan />
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* My Profile Banner - Only show if Slider Management feature is enabled */}
          {showSliderBanner && <MyProfileBanner />}

          {/* Top Row - Attendance + Online Live Classes side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Attendance Calendar - Only show if Attendance Management feature is enabled */}
            {showAttendanceCalendar && (
              <div>
                <AttendanceCalendar />
              </div>
            )}

            {/* Online Live Classes - Only show if Timetable Management feature is enabled */}
            {showOnlineLiveClasses && (
              <div>
                <OnlineLiveClasses />
              </div>
            )}
          </div>

          {/* Latest Notices - Full width row, only show if Announcement Management feature is enabled */}
          {showLatestNotices && (
            <div>
              <LatestNotices />
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
