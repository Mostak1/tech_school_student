'use client';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import {
  BiHomeSmile,
  BiBus,
  BiInfoCircle,
  BiMessageSquareDetail,
  BiX,
  BiRevision,
  BiPhoneCall,
  BiMapPin,
} from 'react-icons/bi';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import {
  useGetTransportationDashboard,
  useGetLiveRoute,
  useGetTransportationAttendance,
  useGetSchoolSettings,
} from '@/lib/api/student/queryHooks';
import Link from 'next/link';
import { useTranslate } from '@/components/hooks/useTranslate';
import {
  storeTripReport,
  generateTrackingLink,
} from '@/lib/api/student/functions';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Flag } from 'lucide-react';
import Image from 'next/image';

/**
 * Helper function to compare time strings and determine if actual time is delayed
 * @param scheduledTime - Scheduled time in format "HH:MM AM/PM"
 * @param actualTime - Actual time in format "HH:MM AM/PM" or "Pending"
 * @returns 'delayed' | 'on-time' | 'pending'
 */
const getTimeStatus = (
  scheduledTime: string,
  actualTime: string | null,
): 'delayed' | 'on-time' | 'pending' => {
  // Handle pending status
  if (!actualTime || actualTime === 'Pending') {
    return 'pending';
  }

  // Convert time strings to comparable format
  const parseTime = (timeStr: string): Date => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();

    // Convert to 24-hour format
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    date.setHours(hour24, minutes, 0, 0);
    return date;
  };

  try {
    const scheduledDateTime = parseTime(scheduledTime);
    const actualDateTime = parseTime(actualTime);

    // Compare times - if actual time is later than scheduled, it's delayed
    return actualDateTime > scheduledDateTime ? 'delayed' : 'on-time';
  } catch (error) {
    // If parsing fails, default to on-time
    console.warn('Error parsing time strings:', error);
    return 'on-time';
  }
};

/**
 * Transportation Page Component
 *
 * Displays student transportation details.
 */
export default function TransportationPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const router = useRouter();

  // Fetch school settings to check for feature access
  const { data: schoolSettings, isLoading: isLoadingSettings } =
    useGetSchoolSettings();

  const enabledFeatures = useMemo(
    () => schoolSettings?.data?.features || {},
    [schoolSettings],
  );

  const isFeatureEnabled = useCallback(
    (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase(),
      );
    },
    [enabledFeatures],
  );

  // Check feature permission and redirect if disabled
  useEffect(() => {
    // Skip check while loading
    if (isLoadingSettings) return;

    if (!isFeatureEnabled('Transportation Module')) {
      router.push('/student/dashboard');
    }
  }, [isFeatureEnabled, isLoadingSettings, router]);

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState('pickup');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Report Issue States
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const issueTypes = [
    'Unsafe Driving',
    'Unauthorized Person',
    'Missed Pickup',
    'Unclean Bus Interior',
    'Bus Breakdown',
  ];

  const handleReportSubmit = async () => {
    if (!liveRouteData?.data?.trip_id) {
      toast.error(
        translate('routeDataNotAvailable') || 'Route data not available',
      );
      return;
    }

    if (!selectedIssueType && !issueDescription) {
      toast.error(
        translate('pleaseSelectIssue') || 'Please select or describe an issue',
      );
      return;
    }

    // Combine selection and description if both exist, or use whichever is present
    const finalDescription =
      selectedIssueType && issueDescription
        ? `${selectedIssueType}: ${issueDescription}`
        : selectedIssueType || issueDescription;

    setIsSubmittingIssue(true);
    try {
      const response = await storeTripReport({
        route_vehicle_history_id: liveRouteData.data.trip_id.toString(),
        description: finalDescription,
      });

      if (response.success) {
        toast.success(
          translate('reportSubmittedSuccessfully') ||
            'Report submitted successfully',
        );
        setIsReportIssueModalOpen(false);
        setSelectedIssueType('');
        setIssueDescription('');
      } else {
        toast.error(
          response.message ||
            translate('failedToSubmitReport') ||
            'Failed to submit report',
        );
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(translate('somethingWentWrong') || 'Something went wrong');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Get user data from Redux store
  const { user } = useSelector((state: RootState) => state.studentAuth);
  const userId = user?.id;

  // Handler to navigate to driver-attendant chat page
  const handleChatRedirect = (contactType: '1' | '2') => {
    router.push(`/student/chats/driver-attendant-chat?contact=${contactType}`);
  };

  // Generating a signed tracking link (prevents double clicks / opens)
  const [isTrackingLinkLoading, setIsTrackingLinkLoading] = useState(false);

  // Ask the backend for a signed tracking URL, then open the shared
  // /live-tracking#tk=<token> page in a new tab (same page the apps open).
  const handleTrackBusLive = async () => {
    if (!userId || isTrackingLinkLoading) return;
    setIsTrackingLinkLoading(true);
    try {
      const res = await generateTrackingLink(userId);
      const token = res.data?.token;
      if (res.error || !token) {
        toast.error(
          res.message || translate('somethingWentWrong') || 'Something went wrong'
        );
        return;
      }
      // Build a same-origin URL from the token (do not log the token)
      window.open(
        `/live-tracking#tk=${encodeURIComponent(token)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      // The axios interceptor rejects with ApiError for {error:true} bodies
      // (e.g. demo-version restrictions) — surface its real message, not a generic one.
      toast.error(
        error instanceof Error
          ? error.message
          : translate('somethingWentWrong') || 'Something went wrong'
      );
    } finally {
      setIsTrackingLinkLoading(false);
    }
  };

  // API calls for transportation data
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useGetTransportationDashboard(
      userId ? { user_id: userId, pickup_drop: 0 } : null,
    );

  const { data: liveRouteData, isLoading: isLiveRouteLoading } =
    useGetLiveRoute(userId ? { user_id: userId } : null);

  const { data: attendanceData, isLoading: isAttendanceLoading } =
    useGetTransportationAttendance(userId ? { user_id: userId } : null);

  // Determine attendance status based on API response
  // Only show status if there's a plan, otherwise return null
  const attendanceStatus = useMemo(() => {
    // If there's no plan data, don't show any status
    if (!dashboardData?.data?.plan) {
      return null;
    }

    if (!dashboardData?.data?.today_attendance) {
      return 'waiting'; // No attendance found for today
    }

    const todayAttendance = dashboardData.data.today_attendance;
    if (
      !todayAttendance ||
      todayAttendance.length === 0 ||
      typeof todayAttendance[0] === 'string'
    ) {
      return 'waiting'; // No attendance records for today
    }

    // Check if there's a Present status
    const hasPresent = todayAttendance.some((record) => record.status === 'P');
    return hasPresent ? 'present' : 'absent';
  }, [dashboardData?.data?.today_attendance, dashboardData?.data?.plan]);

  // Get status button configuration
  const getStatusButton = () => {
    switch (attendanceStatus) {
      case 'present':
        return {
          text: translate('present'),
          className:
            'px-3 py-1 text-sm font-medium bg-[#F2FFD9] border border-[#83B807] text-[#83B807] rounded hover:bg-[#F2FFD9]/90',
        };
      case 'absent':
        return {
          text: translate('absent'),
          className:
            'px-3 py-1 text-sm font-medium bg-red-50 border border-red-500 text-red-500 rounded hover:bg-red-50/90',
        };
      default:
        return {
          text: translate('waiting'),
          className:
            'px-3 py-1 text-sm font-medium bg-(--light-primary-color) border border-(--primary-color) text-(--primary-color) rounded hover:bg-(--light-primary-color)/90',
        };
    }
  };

  const statusButton = getStatusButton();

  // Check if we can navigate to next month (disable if current month or future)
  const canNavigateNext = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();

    // Allow navigation if selected date is before current month
    return (
      selectedYear < currentYear ||
      (selectedYear === currentYear && selectedMonth < currentMonth)
    );
  }, [currentDate]);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/transportation',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('transportation'),
      href: '/student/transportation',
    },
  ];

  // Process route stops from API data
  const routeStops = useMemo(() => {
    // Check if data is available
    if (!liveRouteData?.data) {
      return [];
    }

    const liveRoute = liveRouteData.data;
    const lastReachedStopId = liveRoute.last_reached_stop?.id;

    if (!liveRoute.stops || !Array.isArray(liveRoute.stops)) {
      return [];
    }

    return liveRoute.stops.map((stop) => {
      // Determine status based on actual_time and last reached stop
      let status = 'upcoming';
      let isCurrent = false;

      if (stop.actual_time && stop.actual_time !== 'Pending') {
        status = 'completed';
      } else if (stop.id === lastReachedStopId) {
        status = 'current';
        isCurrent = true;
      }

      // Determine time status for UI coloring
      const timeStatus = getTimeStatus(stop.scheduled_time, stop.actual_time);

      return {
        id: stop.id,
        name: stop.name,
        scheduledTime: stop.scheduled_time,
        actualTime: stop.actual_time === 'Pending' ? null : stop.actual_time,
        estimatedTime: stop.estimated_time,
        passengers: stop.passengers ? stop.passengers.length : 0,
        passengerList: stop.passengers || [],
        status,
        isCurrent,
        timeStatus, // Add time status for UI coloring
      };
    });
  }, [liveRouteData]);

  const isPlanExpired = useMemo(() => {
    if (!dashboardData?.data) return false;
    if (
      typeof dashboardData.data === 'string' &&
      dashboardData.data === 'Plan expired'
    ) {
      return true;
    }
    const data = dashboardData.data as { plan?: { expires_in_days?: number } };
    if (
      data.plan?.expires_in_days !== undefined &&
      data.plan?.expires_in_days !== null
    ) {
      return data.plan.expires_in_days < 0;
    }
    return false;
  }, [dashboardData]);

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb */}
      <Breadcrumb title={translate('transportation')} items={breadcrumbItems} />

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        {/* Header Section */}
        <div className="mb-4">
          {/* Title and Active badge in one row with border bottom */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4 flex-wrap gap-2">
            <h1 className="text-xl font-medium text-gray-900">
              {translate('transportationPlan')}
            </h1>
            {/* Show Active or Expired badge based on plan status */}
            {(dashboardData?.data?.plan || isPlanExpired) && (
              <>
                {isPlanExpired ? (
                  <span className="px-3 py-1 bg-red-50 text-red-500 text-sm font-medium rounded border border-red-500">
                    {translate('expired') || 'Expired'}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#F2FFD9] text-[#83B807] text-sm font-medium rounded border border-[#83B807]">
                    {translate('active')}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Plan details below the border */}
          <div className="space-y-1 text-base font-normal text-gray-900">
            {isDashboardLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : dashboardData?.data?.plan ? (
              <>
                <p>
                  {translate('plan')}{' '}
                  <span className="font-medium">
                    {dashboardData.data.plan.duration || 'N/A'}
                  </span>
                </p>
                <p>
                  {translate('validity')}{' '}
                  <span className="font-medium">
                    {dashboardData.data.plan.valid_from || 'N/A'} -{' '}
                    {dashboardData.data.plan.valid_to || 'N/A'}
                  </span>
                </p>
                <p>
                  {translate('routeName')}{' '}
                  <span className="font-medium">
                    {dashboardData.data.plan.route?.name || 'N/A'}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-gray-500">{translate('noDataFound')}</p>
            )}
          </div>
        </div>

        {/* Expired Warning */}
        {isPlanExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <div className="bg-[#FF6769] rounded-[4px] p-2">
              <BiInfoCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            </div>
            <div>
              <h3 className="text-red-500 text-sm font-medium mb-1">
                {translate('yourPlanHasExpired') || 'Your Plan Has Expired'}
              </h3>
              <p className="text-gray-700 text-sm">
                {translate('planExpiredDescription') ||
                  'Your subscription plan has expired. Please renew now to continue enjoying uninterrupted access to all features and services.'}
              </p>
            </div>
          </div>
        )}

        {/* Expiring Warning - Show only if plan is expiring soon (0-7 days) */}
        {dashboardData?.data?.plan?.expires_in_days !== undefined &&
          dashboardData?.data?.plan?.expires_in_days !== null &&
          dashboardData.data.plan.expires_in_days >= 0 &&
          dashboardData.data.plan.expires_in_days <= 7 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <div className="bg-[#FF6769] rounded-[4px] p-2">
                <BiInfoCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              </div>
              <div>
                <h3 className="text-red-500 text-sm font-medium mb-1">
                  {translate('yourPlanIsExpiringSoon')}
                </h3>
                <p className="text-gray-700 text-sm">
                  {translate('planExpiresInDays')}{' '}
                  {dashboardData?.data?.plan?.expires_in_days}{' '}
                  {translate('days')}. {translate('renewNowToContinue')}
                </p>
              </div>
            </div>
          )}
      </div>

      {/* Main Content Grid */}
      {!isPlanExpired && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Bus Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-base font-medium text-gray-900">
                {translate('busInfo')}
              </h2>
            </div>
            {/* divider */}
            <div className="h-px bg-gray-200 my-4"></div>

            {isDashboardLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData?.data?.bus_info ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-normal text-gray-900">
                    {translate('busName')}
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {dashboardData.data.bus_info.vehicle_name || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-normal text-gray-900">
                    {translate('busVehicleNo')}
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {dashboardData.data.bus_info.registration || 'N/A'}
                  </p>
                </div>

                {/* Driver Info */}
                <div className="pt-2">
                  <div className="mb-3">
                    {/* Mobile: Stacked Layout, Desktop: Horizontal Layout */}
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                        <Image
                          src={dashboardData.data.bus_info.driver?.avtar || ''}
                          alt="driver"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-normal text-gray-500">
                          {translate('driver')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {dashboardData.data.bus_info.driver?.name || 'N/A'}
                        </p>
                      </div>
                      {/* Desktop: Phone and Chat on same row */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Link
                          href={`tel:${
                            dashboardData.data.bus_info.driver?.phone || ''
                          }`}
                          target="_blank"
                          className="text-sm font-normal text-gray-800 flex items-center gap-1 hover:text-(--primary-color) transition-colors"
                        >
                          <BiPhoneCall className="w-4 h-4 shrink-0" />
                          <span>
                            {dashboardData.data.bus_info.driver?.phone || 'N/A'}
                          </span>
                        </Link>
                        {isFeatureEnabled('Chat Module') && (
                          <>
                            <div className="h-8 w-px bg-gray-300 mx-1"></div>
                            <button
                              onClick={() => handleChatRedirect('1')}
                              className="w-8 h-8 bg-(--primary-color) rounded flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors shrink-0"
                              title={translate('chatWithDriver')}
                            >
                              <BiMessageSquareDetail className="w-4 h-4 text-white" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile: Phone and Chat on separate row */}
                    <div className="flex sm:hidden items-center gap-2 ps-[52px]">
                      <Link
                        href={`tel:${
                          dashboardData.data.bus_info.driver?.phone || ''
                        }`}
                        target="_blank"
                        className="text-xs font-normal text-gray-800 flex items-center gap-1 hover:text-(--primary-color) transition-colors"
                      >
                        <BiPhoneCall className="w-4 h-4 shrink-0" />
                        <span className="break-all">
                          {dashboardData.data.bus_info.driver?.phone || 'N/A'}
                        </span>
                      </Link>
                      {isFeatureEnabled('Chat Module') && (
                        <button
                          onClick={() => handleChatRedirect('1')}
                          className="w-8 h-8 bg-(--primary-color) rounded flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors shrink-0 ms-auto"
                          title="Chat with Driver"
                        >
                          <BiMessageSquareDetail className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Attender Info */}
                  <div>
                    {/* Mobile: Stacked Layout, Desktop: Horizontal Layout */}
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                        <Image
                          src={
                            dashboardData.data.bus_info.attender?.avtar || ''
                          }
                          alt="attender"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-normal text-gray-500">
                          {translate('attender')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {dashboardData.data.bus_info.attender?.name || 'N/A'}
                        </p>
                      </div>
                      {/* Desktop: Phone and Chat on same row */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Link
                          href={`tel:${
                            dashboardData.data.bus_info.attender?.phone || ''
                          }`}
                          target="_blank"
                          className="text-sm font-normal text-gray-800 flex items-center gap-1 hover:text-(--primary-color) transition-colors"
                        >
                          <BiPhoneCall className="w-4 h-4 shrink-0" />
                          <span>
                            {dashboardData.data.bus_info.attender?.phone ||
                              'N/A'}
                          </span>
                        </Link>
                        {isFeatureEnabled('Chat Module') && (
                          <>
                            <div className="h-8 w-px bg-gray-300 mx-1"></div>
                            <button
                              onClick={() => handleChatRedirect('2')}
                              className="w-8 h-8 bg-(--primary-color) rounded flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors shrink-0"
                              title={translate('chatWithAttender')}
                            >
                              <BiMessageSquareDetail className="w-4 h-4 text-white" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile: Phone and Chat on separate row */}
                    <div className="flex sm:hidden items-center gap-2 ps-[52px]">
                      <Link
                        href={`tel:${
                          dashboardData.data.bus_info.attender?.phone || ''
                        }`}
                        target="_blank"
                        className="text-xs font-normal text-gray-800 flex items-center gap-1 hover:text-(--primary-color) transition-colors"
                      >
                        <BiPhoneCall className="w-4 h-4 shrink-0" />
                        <span className="break-all">
                          {dashboardData.data.bus_info.attender?.phone || 'N/A'}
                        </span>
                      </Link>
                      {isFeatureEnabled('Chat Module') && (
                        <button
                          onClick={() => handleChatRedirect('2')}
                          className="w-8 h-8 bg-(--primary-color) rounded flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors shrink-0 ms-auto"
                          title="Chat with Attender"
                        >
                          <BiMessageSquareDetail className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">{translate('noDataFound')}</p>
            )}
          </div>

          {/* Live Tracking Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium text-gray-900 border-b-2 border-transparent hover:text-(--primary-color)">
                    {translate('liveTracking')}
                  </h2>
                  {liveRouteData?.data?.status && (
                    <span className="px-2 py-0.5 text-xs font-semibold text-white bg-(--primary-color) rounded-full capitalize">
                      {translate(liveRouteData.data.status) ||
                        liveRouteData.data.status}
                    </span>
                  )}
                </div>
              </div>
              {/* Route Tracking — Secondary #57CC99, tiny-curve, m-mini/m-xsmall */}
              <button
                onClick={() => setIsRouteModalOpen(true)}
                className="inline-flex items-center justify-center gap-1 h-8 px-2 py-0.5 text-sm font-medium text-white bg-[#57CC99] rounded hover:opacity-90 transition-opacity"
              >
                {translate('routeTracking')}
              </button>
            </div>

            {/* divider */}
            <div className="h-px bg-gray-200 my-4"></div>

            <div className="space-y-0">
              {isDashboardLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.data?.live_summary ? (
                <>
                  {/* Current Location */}
                  <div className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      {/* Dot - vertically centered */}
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          dashboardData.data.live_summary
                            .eta_to_user_stop_min === 'Reached'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                      ></div>

                      {/* Dotted Line - extended to connect */}
                      <div
                        className="w-[2px]"
                        style={{
                          height: '80px',
                          backgroundImage: `linear-gradient(to bottom, ${
                            dashboardData.data.live_summary
                              .eta_to_user_stop_min === 'Reached'
                              ? '#22c55e'
                              : '#d1d5db'
                          } 40%, transparent 40%)`,
                          backgroundSize: '2px 12px',
                          backgroundRepeat: 'repeat-y',
                        }}
                      ></div>
                    </div>

                    <div className="flex-1 pt-0">
                      <p className="text-sm font-normal text-gray-500 mb-1">
                        {translate('currentLocation')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.data.live_summary.current_location}
                      </p>
                    </div>
                  </div>

                  {/* Next Location */}
                  <div className="flex items-start gap-3 -mt-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        dashboardData.data.live_summary.estimated_time ===
                        'Reached'
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-normal text-gray-500 mb-1">
                        {translate('nextLocation')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.data.live_summary.next_location}
                      </p>
                    </div>
                  </div>

                  {/* Pickup Time — #F7F7F7, border #EAEAEA, soft-curve, p-xsmall, gap 12 */}
                  <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg p-2 mt-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-normal text-gray-500 mb-1">
                        {translate('pickupTime') || 'Pickup Time'}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.data.live_summary.estimated_time ===
                        'Reached'
                          ? translate('alreadyReached')
                          : dashboardData.data.live_summary.estimated_time}
                      </p>
                    </div>
                    {/* Track Bus Live — Primary #22577A, icon left bx-map-pin */}
                    <button
                      onClick={handleTrackBusLive}
                      disabled={isTrackingLinkLoading}
                      className="inline-flex items-center gap-1 h-8 px-2 py-0.5 text-sm font-medium text-white bg-[#22577A] rounded hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
                    >
                      <BiMapPin className="w-4 h-4" />
                      {translate('trackBusLive') || 'Track Bus Live'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    {translate('noLiveTrackingDataAvailable')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {translate('attendance')}
                  </h2>
                </div>
                {/* Only show status button when there's plan data and attendance status */}
                {attendanceStatus !== null && (
                  <div>
                    <button className={statusButton.className}>
                      {statusButton.text}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="px-2 py-1 text-base font-normal text-white bg-(--primary-color) rounded hover:bg-(--primary-color)/90"
                >
                  {translate('viewAttendance')}
                </button>
              </div>
            </div>

            {/* divider */}
            <div className="h-px bg-gray-200 my-4"></div>

            <div className="space-y-3">
              {isDashboardLoading ? (
                <div className="space-y-3">
                  <div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : dashboardData?.data?.plan ? (
                <>
                  <div>
                    <p className="text-sm font-normal text-gray-600 mb-1">
                      {translate('pickupPoint')}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData.data.plan.pickup_stop?.name || 'N/A'}
                    </p>
                  </div>

                  {dashboardData.data.today_attendance?.some(
                    (t) => t.trip_type === 'pickup',
                  ) && (
                    <div>
                      <p className="text-sm font-normal text-gray-600 mb-1">
                        {translate('pickupTime')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.data.today_attendance?.find(
                          (t) => t.trip_type === 'pickup',
                        )?.time || 'N/A'}{' '}
                        ({translate('scheduled')})
                      </p>
                    </div>
                  )}

                  {dashboardData.data.today_attendance?.some(
                    (t) => t.trip_type === 'drop',
                  ) && (
                    <div>
                      <p className="text-sm font-normal text-gray-600 mb-1">
                        {translate('dropTime')}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.data.today_attendance?.find(
                          (t) => t.trip_type === 'drop',
                        )?.time || 'N/A'}{' '}
                        ({translate('scheduled')})
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">{translate('noDataFound')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Route Tracking Modal */}
      <Dialog open={isRouteModalOpen} onOpenChange={setIsRouteModalOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0"
          showCloseButton={false}
        >
          {/* Header with close button - responsive padding */}
          <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between text-start">
              <div className="flex-1">
                {/* Responsive title: smaller on mobile, larger on desktop */}
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                  {translate('trackRouteDetails')}
                </DialogTitle>
                {/* Responsive description: smaller text on mobile */}
                <DialogDescription className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed">
                  {translate('viewCompleteRouteDescription')}
                </DialogDescription>
              </div>
              {/* Close button: smaller on mobile, normal on desktop */}
              <DialogClose asChild>
                <button className="ms-2 sm:ms-4 p-1.5 sm:p-2 bg-(--light-primary-color) rounded-[4px] transition-colors border border-gray-200 shrink-0">
                  <BiX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {isLiveRouteLoading ? (
              <div className="space-y-4">
                <div className="bg-gray-200 rounded-[4px] p-4 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : liveRouteData?.data ? (
              <>
                {/* Status Banner */}
                <div className="bg-[#F2F5F7] rounded-[4px] p-3 sm:p-4 flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="bg-(--primary-color) rounded-[4px] p-2 shrink-0">
                    <BiBus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-(--primary-color) font-semibold text-sm sm:text-base">
                        {liveRouteData.data.eta?.user_stop_min === 'Reached'
                          ? translate('busHasReachedYourStop')
                          : `${
                              liveRouteData.data.eta?.user_stop_min || '--'
                            } ${translate('awayFromYourStop')}`}
                      </h3>
                      {liveRouteData.data.status && (
                        <span className="text-xs font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 capitalize">
                          {translate(liveRouteData.data.status) ||
                            liveRouteData.data.status}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm break-words">
                      {translate('currentlyAt')}{' '}
                      {liveRouteData.data.last_reached_stop?.name ||
                        liveRouteData.data.stops?.[0]?.name ||
                        translate('start')}
                    </p>
                  </div>
                </div>

                {/* Bus Details */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {translate('busName')}{' '}
                        {liveRouteData.data.vehicle?.number || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {liveRouteData.data.route?.name || 'N/A'}
                      </p>
                    </div>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-(--primary-color) rounded-full flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors">
                      <BiRevision className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {translate('noLiveTrackingDataAvailable')}
                </p>
              </div>
            )}

            {/* Route Timeline */}
            {liveRouteData?.data && routeStops.length > 0 && (
              <div className="relative border border-gray-200 rounded-[4px] p-3 sm:p-4">
                {routeStops.map((stop, index) => (
                  <div key={index} className="relative flex gap-3 sm:gap-4">
                    {/* Timeline Line and Dot */}
                    <div className="relative flex flex-col items-center w-4">
                      {/* Dot */}
                      <div
                        className={`relative w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 z-10 shrink-0 ${
                          stop.status === 'completed'
                            ? 'bg-(--secondary-color) border-(--secondary-color)'
                            : stop.status === 'delayed'
                              ? 'bg-gray-300 border-gray-300'
                              : 'bg-gray-300 border-gray-300'
                        }`}
                      >
                        {stop.isCurrent && (
                          <div className="absolute -start-[6px] sm:-start-[7px] -top-[5px] sm:-top-[6px] w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-(--secondary-color) border-2 border-(--secondary-color) flex items-center justify-center">
                            <BiBus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Vertical Line with larger dots */}
                      {index < routeStops.length - 1 && (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 w-[2px] h-[calc(100%+1.5rem)] sm:h-[calc(100%+2rem)]`}
                          style={{
                            backgroundImage: `linear-gradient(to bottom, ${
                              stop.status === 'completed' || index < 2
                                ? 'var(--secondary-color)'
                                : '#d1d5db'
                            } 40%, transparent 40%)`,
                            backgroundSize: '2px 12px', // Adjust second value (12px) to increase/decrease dot spacing
                            backgroundRepeat: 'repeat-y',
                          }}
                        />
                      )}
                    </div>

                    {/* Stop Details */}
                    <div className="flex-1 pt-0 mb-6 sm:mb-8">
                      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                        <div className="flex-1 min-w-0 pe-2">
                          <h4
                            className={`font-medium text-sm sm:text-base break-all ${
                              stop.isCurrent
                                ? 'text-(--primary-color)'
                                : 'text-gray-900'
                            }`}
                          >
                            {stop.name}
                          </h4>
                        </div>
                        {stop.passengers > 0 && (
                          <span className="text-xs sm:text-sm font-normal text-gray-600 ms-2">
                            {stop.passengers}{' '}
                            {stop.passengers !== 1
                              ? translate('passengers')
                              : translate('passenger')}
                          </span>
                        )}
                      </div>

                      {/* Times */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F2F5F7] rounded-[4px] px-2 py-1.5 sm:p-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-xs sm:text-base font-normal text-gray-900">
                            {stop.scheduledTime}
                          </span>
                        </div>
                        {stop.actualTime && stop.timeStatus !== 'pending' && (
                          <div
                            className={`flex items-center gap-1.5 sm:gap-2 ${
                              stop.timeStatus === 'delayed'
                                ? 'bg-red-50'
                                : 'bg-green-50'
                            } rounded-[4px] px-2 py-1.5 sm:p-2`}
                          >
                            <div
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                stop.timeStatus === 'delayed'
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                              }`}
                            ></div>
                            <span
                              className={`text-xs sm:text-base font-normal ${
                                stop.timeStatus === 'delayed'
                                  ? 'text-gray-900'
                                  : 'text-gray-900'
                              }`}
                            >
                              {stop.actualTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Report Issue Banner */}
                <div className="mt-4 bg-gray-50 rounded-[8px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {translate('facingAProblem') || 'Facing a Problem?'}
                    </h3>
                    <p className="text-sm text-gray-600 break-words">
                      {translate('raiseSupportIssueDescription') ||
                        'Raise any school transport delays, safety, or route issues here'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReportIssueModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-(--primary-color) text-white rounded-[4px] font-medium hover:bg-(--primary-color)/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    {translate('reportIssue') || 'Report Issue'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Issue Modal */}
      <Dialog
        open={isReportIssueModalOpen}
        onOpenChange={(open) => {
          setIsReportIssueModalOpen(open);
          if (!open) {
            setSelectedIssueType('');
            setIssueDescription('');
          }
        }}
      >
        <DialogContent
          className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden"
          showCloseButton={false}
        >
          <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b border-gray-200 flex flex-row items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-gray-900 m-0">
                {translate('reportIssues') || 'Report Issues'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 text-start">
                {translate('raiseSupportIssueDescription') ||
                  'Raise any school transport delays, safety, or route issues here'}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button className="ms-4 p-1.5 rounded-[4px] hover:bg-gray-100 transition-colors shrink-0">
                <BiX className="w-5 h-5 text-gray-500" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Issue Types */}
            <div className="grid grid-cols-2 gap-3">
              {issueTypes.map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedIssueType(type === selectedIssueType ? '' : type)
                  }
                  className={`p-3 text-sm font-medium rounded-[4px] border transition-all text-center h-auto min-h-[48px] flex items-center justify-center ${
                    selectedIssueType === type
                      ? 'bg-(--primary-color) text-white border-(--primary-color)'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {translate(
                    type
                      .toLowerCase()
                      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                        index === 0 ? word.toLowerCase() : word.toUpperCase(),
                      )
                      .replace(/\s+/g, ''),
                  ) || type}
                </button>
              ))}
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <Textarea
                placeholder={translate('enterIssue') || 'Enter Issue'}
                value={issueDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setIssueDescription(e.target.value)
                }
                className="min-h-[100px] resize-none bg-gray-50 border-gray-200 focus:border-(--primary-color) focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleReportSubmit}
              disabled={isSubmittingIssue}
              className="w-full py-3 bg-(--primary-color) text-white rounded-[4px] font-medium text-base hover:bg-(--primary-color)/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmittingIssue ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                translate('submit') || 'Submit'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Transport Attendance Modal - Rest of the code remains the same */}
      <Dialog
        open={isAttendanceModalOpen}
        onOpenChange={setIsAttendanceModalOpen}
      >
        <DialogContent
          className="max-w-[95vw]! sm:max-w-2xl! max-h-[90vh] overflow-hidden p-0"
          showCloseButton={false}
        >
          <div className="overflow-y-auto max-h-[92vh] scrollbar-thin">
          {/* Header with close button */}
          <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between text-start">
              <div className="flex-1">
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                  {translate('dailyTransportAttendance')}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed">
                  {translate('checkTripAttendanceDescription')}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button className="ms-2 sm:ms-4 p-1.5 sm:p-2 bg-(--light-primary-color) rounded-[4px] transition-colors border border-gray-200 shrink-0">
                  <BiX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="px-4 sm:px-6 pb-6 pt-6">
            {/* Pickup Trip Dropdown */}
            <div className="mb-6">
              <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                <SelectTrigger className="w-full border border-gray-200 rounded-[4px] p-2 shadow-none bg-gray-100 h-[40px] md:h-[44px]">
                  <SelectValue placeholder={translate('selectTripType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">
                    {translate('pickupTrip')}
                  </SelectItem>
                  <SelectItem value="drop">
                    {translate('dropoffTrip')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Section */}
            <div className="bg-gray-100 rounded-lg border border-gray-200 p-3 sm:p-4 mb-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white rounded-[4px] p-2">
                <button
                  onClick={() => {
                    setCurrentDate((prev) => {
                      const newDate = new Date(prev);
                      newDate.setMonth(newDate.getMonth() - 1);
                      return newDate;
                    });
                  }}
                  className="p-1.5 sm:p-2 border border-(--primary-color) rounded hover:bg-gray-50 transition-colors"
                  aria-label={translate('previousMonth')}
                >
                  {/* Icon rotates 180deg in RTL to point in correct direction */}
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary-color) rtl:rotate-180" />
                </button>

                <div className="bg-(--light-primary-color) px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                  <h3 className="text-sm sm:text-base md:text-xl font-medium text-(--primary-color)">
                    {currentDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    if (canNavigateNext) {
                      setCurrentDate((prev) => {
                        const newDate = new Date(prev);
                        newDate.setMonth(newDate.getMonth() + 1);
                        return newDate;
                      });
                    }
                  }}
                  disabled={!canNavigateNext}
                  className={`p-1.5 sm:p-2 border rounded transition-colors ${
                    canNavigateNext
                      ? 'border-(--primary-color) hover:bg-gray-50 cursor-pointer'
                      : 'border-gray-300 cursor-not-allowed opacity-50'
                  }`}
                  aria-label={translate('nextMonth')}
                >
                  {/* Icon rotates 180deg in RTL to point in correct direction */}
                  <ChevronRight
                    className={`w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180 ${
                      canNavigateNext
                        ? 'text-(--primary-color)'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              {/* Calendar Grid - Rest of calendar code remains the same */}
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDayOfWeek = (firstDay.getDay() + 6) % 7;

                const calendarDays = [];
                const prevMonth = new Date(year, month - 1, 0);
                const prevMonthDays = prevMonth.getDate();
                for (let i = startDayOfWeek - 1; i >= 0; i--) {
                  calendarDays.push({
                    day: prevMonthDays - i,
                    isCurrentMonth: false,
                    status: null,
                  });
                }

                const daysInMonth = lastDay.getDate();
                const currentMonthRecords =
                  attendanceData?.data?.records?.filter((record) => {
                    const recordDate = new Date(record.date);
                    return (
                      recordDate.getFullYear() === year &&
                      recordDate.getMonth() === month &&
                      record.trip_type === selectedTrip
                    );
                  }) || [];

                const attendanceMap = new Map();
                currentMonthRecords.forEach((record) => {
                  const recordDate = new Date(record.date);
                  const day = recordDate.getDate();

                  let newStatus = null;
                  if (record.status === 'P') {
                    newStatus = 'present';
                  } else if (record.status === 'A') {
                    newStatus = 'absent';
                  }

                  if (newStatus) {
                    const existingStatus = attendanceMap.get(day);
                    if (existingStatus) {
                      if (
                        existingStatus === 'absent' ||
                        newStatus === 'absent'
                      ) {
                        attendanceMap.set(day, 'absent');
                      } else {
                        attendanceMap.set(day, 'present');
                      }
                    } else {
                      attendanceMap.set(day, newStatus);
                    }
                  }
                });

                for (let day = 1; day <= daysInMonth; day++) {
                  const status = attendanceMap.get(day) || null;
                  calendarDays.push({
                    day,
                    isCurrentMonth: true,
                    status,
                  });
                }

                const remainingDays = 42 - calendarDays.length;
                for (let day = 1; day <= remainingDays; day++) {
                  calendarDays.push({
                    day,
                    isCurrentMonth: false,
                    status: null,
                  });
                }

                return (
                  <>
                    <div className="mb-4 sm:mb-6 bg-white rounded-[4px] p-2 sm:p-4">
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                          (day) => (
                            <div
                              key={day}
                              className="text-center text-xs sm:text-sm md:text-base font-medium text-gray-900 py-1 sm:py-2"
                            >
                              {day}
                            </div>
                          ),
                        )}
                      </div>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {calendarDays.map((dayData, index) => (
                          <div
                            key={index}
                            className="flex justify-center items-center min-h-[36px] sm:min-h-[40px] md:min-h-[48px]"
                          >
                            <div
                              className={`flex justify-center items-center ${
                                !dayData.isCurrentMonth
                                  ? 'text-gray-400 text-xs sm:text-sm'
                                  : dayData.status === 'present'
                                    ? 'bg-[#57CC99] text-white rounded-full w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-xs sm:text-sm md:text-base font-medium'
                                    : dayData.status === 'absent'
                                      ? 'bg-[#FF6769] text-white rounded-full w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-xs sm:text-sm md:text-base font-medium'
                                      : 'text-gray-900 text-xs sm:text-sm md:text-base font-medium'
                              }`}
                            >
                              {String(dayData.day).padStart(2, '0')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {isAttendanceLoading ? (
                <>
                  <div className="bg-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-12 bg-gray-300 rounded"></div>
                  </div>
                  <div className="bg-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-12 bg-gray-300 rounded"></div>
                  </div>
                </>
              ) : attendanceData?.data ? (
                (() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();

                  const currentMonthRecords =
                    attendanceData.data.records?.filter((record) => {
                      const recordDate = new Date(record.date);
                      return (
                        recordDate.getFullYear() === year &&
                        recordDate.getMonth() === month &&
                        record.trip_type === selectedTrip
                      );
                    }) || [];

                  const dayStatusMap = new Map();
                  currentMonthRecords.forEach((record) => {
                    const recordDate = new Date(record.date);
                    const day = recordDate.getDate();

                    let newStatus = null;
                    if (record.status === 'P') {
                      newStatus = 'present';
                    } else if (record.status === 'A') {
                      newStatus = 'absent';
                    }

                    if (newStatus) {
                      const existingStatus = dayStatusMap.get(day);
                      if (existingStatus) {
                        if (
                          existingStatus === 'absent' ||
                          newStatus === 'absent'
                        ) {
                          dayStatusMap.set(day, 'absent');
                        } else {
                          dayStatusMap.set(day, 'present');
                        }
                      } else {
                        dayStatusMap.set(day, newStatus);
                      }
                    }
                  });

                  const dayStatuses = Array.from(dayStatusMap.values());
                  const presentCount = dayStatuses.filter(
                    (status) => status === 'present',
                  ).length;
                  const absentCount = dayStatuses.filter(
                    (status) => status === 'absent',
                  ).length;

                  return (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {translate('totalPresent')}
                        </span>
                        <div className="bg-[#57CC99] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                          <span className="text-base sm:text-lg md:text-xl font-medium">
                            {presentCount}
                          </span>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {translate('totalAbsent')}
                        </span>
                        <div className="bg-[#FF6769] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                          <span className="text-base sm:text-lg md:text-xl font-medium">
                            {absentCount}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="col-span-2 text-center text-gray-500">
                  {translate('noDataFound')}
                </div>
              )}
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
