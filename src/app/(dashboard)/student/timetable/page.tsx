'use client';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BiHomeSmile } from 'react-icons/bi';
import { FiUser } from 'react-icons/fi';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useGetStudentTimetable, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { TimetableSlot } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function TimetablePage() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();
  const router = useRouter();

  // Fetch school settings to check for feature access
  const { data: schoolSettings, isLoading: isLoadingSettings } =
    useGetSchoolSettings();

  // Check feature permission and redirect if disabled
  useEffect(() => {
    // Skip check while loading
    if (isLoadingSettings || !schoolSettings?.data) return;

    const enabledFeatures = schoolSettings.data.features || {};

    const isFeatureEnabled = (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase()
      );
    };

    if (!isFeatureEnabled('Timetable Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // Fetch timetable data from API
  const {
    data: timetableResponse,
    isLoading,
    error,
  } = useGetStudentTimetable();


  // Organize timetable data by day
  const organizedDays = useMemo(() => {
    if (!timetableResponse?.data) {
      return [];
    }

    // Define day order for consistent display
    const dayOrder = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    // "Now" reference for date/time based online-class detection
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Local date -> "YYYY-MM-DD" (matches API start_date/end_date format)
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = toDateStr(now);

    // Date of each weekday column in the currently viewed (this) week.
    // dayOrder is Monday-first, so index 0 = Monday of this week.
    const mondayOffset = (now.getDay() + 6) % 7; // days since Monday
    const dateForDayIndex = (index: number): string => {
      const d = new Date(now);
      d.setDate(now.getDate() - mondayOffset + index);
      return toDateStr(d);
    };

    // Parse "HH:MM:SS" -> minutes since midnight
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    // Rule 1: is this slot an online class on the given viewed date?
    const isOnlineOnDate = (slot: TimetableSlot, viewedDate: string): boolean => {
      if (!slot.start_date) return false; // no start_date -> offline lecture
      if (!slot.end_date) return viewedDate === slot.start_date; // single day
      return slot.start_date <= viewedDate && viewedDate <= slot.end_date; // range
    };

    // Format "HH:MM:SS" -> "h:mm AM/PM"
    const formatTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    };

    // Group slots by day
    const slotsByDay: Record<string, TimetableSlot[]> = {};

    timetableResponse.data.forEach((slot) => {
      if (!slotsByDay[slot.day]) {
        slotsByDay[slot.day] = [];
      }
      slotsByDay[slot.day].push(slot);
    });

    // Create organized day structure
    return dayOrder.map((dayName, dayIndex) => {
      const daySlots = slotsByDay[dayName] || [];

      // Actual calendar date for this weekday column in the current week
      const viewedDate = dateForDayIndex(dayIndex);
      const isToday = viewedDate === todayStr;

      // Transform API slots to UI format with colors
      const slots = daySlots.map((slot) => {
        // Rule 5: subject null -> break slot, show note, skip all online logic
        const isBreak = !slot.subject;

        // Build teacher name
        const teacherName =
          slot.teacher_first_name || slot.teacher_last_name
            ? `${slot.teacher_first_name} ${slot.teacher_last_name}`.trim()
            : '';

        // Format subject display (break -> note as title)
        const subjectDisplay = slot.subject
          ? `(${slot.subject.name_with_type})`
          : slot.note || '';

        // Format time for display
        const timeDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;

        // Rule 1/2: online class pill is date-based (whole day)
        const isOnline = !isBreak && isOnlineOnDate(slot, viewedDate);

        const startMin = toMinutes(slot.start_time);
        const endMin = toMinutes(slot.end_time);

        // Rule 4: Live/Upcoming/Completed only for today's online slots
        const isLive =
          isOnline && isToday && nowMinutes >= startMin && nowMinutes < endMin;

        // Rule 3: Join link only today, online today, has link, and now is
        // between 30 min before start and end_time
        const showJoin =
          isOnline &&
          isToday &&
          !!slot.meeting_link &&
          nowMinutes >= startMin - 30 &&
          nowMinutes < endMin;

        return {
          time: timeDisplay,
          subject: subjectDisplay,
          teacher: teacherName,
          bgColor: slot.subject?.bg_color || '#9ca3af',
          meetingLink: slot.meeting_link || '',
          isOnline,
          isLive,
          showJoin,
        };
      });

      return {
        name: dayName,
        slots,
      };
    });
  }, [timetableResponse]);

  // Only show days that actually have lectures (skip empty columns)
  const days = organizedDays.filter((day) => day.slots.length > 0);

  // Helper function to translate day names
  const getDayTranslation = (dayName: string): string => {
    const dayMap: Record<string, string> = {
      Monday: translate('mondayFull'),
      Tuesday: translate('tuesdayFull'),
      Wednesday: translate('wednesdayFull'),
      Thursday: translate('thursdayFull'),
      Friday: translate('fridayFull'),
      Saturday: translate('saturdayFull'),
      Sunday: translate('sundayFull'),
    };
    return dayMap[dayName] || dayName;
  };

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('timetable'),
    },
  ];

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('timetable')} items={breadcrumbItems} />

      <div className="bg-white border border-gray-200 rounded-[16px] p-4 overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
              <p className="text-gray-600">{translate('loadingTimetable')}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-2">
                {translate('failedToLoadTimetable')}
              </p>
              <p className="text-gray-500 text-sm">
                {error instanceof Error
                  ? error.message
                  : translate('pleaseTryAgainLater')}
              </p>
            </div>
          </div>
        )}

        {/* Empty State - No timetable data */}
        {!isLoading && !error && days.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                {translate('noTimetableAvailable')}
              </p>
              <p className="text-gray-500 text-sm">
                {translate('timetableWillAppearHere')}
              </p>
            </div>
          </div>
        )}

        {/* Timetable Content */}
        {!isLoading && !error && days.length > 0 && (
          <>
            {/* Desktop Layout - 7 column grid */}
            <div className="hidden xl:flex overflow-x-auto border border-gray-200 rounded-[16px]">
              {days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="flex flex-col flex-shrink-0 w-[327px] border-r border-gray-200 last:border-r-0"
                >
                  <div className="bg-[var(--light-primary-color)] p-4 mb-3 border-b border-gray-200">
                    <h2 className="text-gray-500 font-medium text-center">
                      {getDayTranslation(day.name)}
                    </h2>
                  </div>

                  {day.slots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className={`rounded-lg p-4 mb-3 border-l mx-3${slot.time === '-' && !slot.subject ? ' min-h-25' : ''}`}
                      style={{ backgroundColor: slot.bgColor + '1a', borderLeftColor: slot.bgColor, borderLeftWidth: '1.83px' }}
                    >
                      {slot.isOnline && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slot.bgColor }}></span>
                            <span className="text-xs font-medium text-gray-700">
                              {translate('onlineClass')}
                            </span>
                          </span>
                          {slot.isLive && (
                            <span className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span className="text-xs font-medium text-red-500">
                                {translate('live')}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs font-medium" style={{ color: '#3E3E3E' }}>
                        {slot.time}
                      </div>
                      {slot.subject && (
                        <>
                          <div
                            className="my-2"
                            style={{
                              height: '1px',
                              opacity: 0.49,
                              backgroundImage: `repeating-linear-gradient(to right, ${slot.bgColor} 0 5px, transparent 5px 10px)`,
                            }}
                          ></div>
                          <div className="text-xs text-gray-600 mb-1">
                            {slot.subject}
                          </div>
                          {slot.teacher && (
                            <div className="flex items-center gap-1 text-xs text-gray-800 font-medium">
                              <FiUser className="w-3 h-3 text-gray-500" />
                              {slot.teacher}
                            </div>
                          )}
                        </>
                      )}
                      {slot.showJoin && (
                        <a
                          href={slot.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center text-xs font-medium text-white bg-[var(--primary-color)] rounded-md py-2 mt-3 hover:opacity-90 transition-opacity"
                        >
                          {translate('joinClass')}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile Layout - Horizontal scrollable cards */}
            <div className="xl:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="flex-shrink-0 w-80 snap-start bg-white border border-gray-200 rounded-[16px] overflow-hidden"
                  >
                    {/* Day Header */}
                    <div className="bg-[var(--light-primary-color)] p-4 border-b border-gray-200">
                      <h2 className="text-gray-500 font-medium text-center text-lg">
                        {getDayTranslation(day.name)}
                      </h2>
                    </div>

                    {/* Day Slots */}
                    <div className="p-4 space-y-3">
                      {day.slots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className={`rounded-lg p-4 border-l${slot.time === '-' && !slot.subject ? ' min-h-30' : ''}`}
                          style={{ backgroundColor: slot.bgColor + '1a', borderLeftColor: slot.bgColor, borderLeftWidth: '1.83px' }}
                        >
                          {slot.isOnline && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slot.bgColor }}></span>
                                <span className="text-sm font-medium text-gray-700">
                                  {translate('onlineClass')}
                                </span>
                              </span>
                              {slot.isLive && (
                                <span className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  <span className="text-sm font-medium text-red-500">
                                    {translate('live')}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-sm font-medium" style={{ color: '#3E3E3E' }}>
                            {slot.time}
                          </div>
                          {slot.subject && (
                            <>
                              <div
                                className="my-2"
                                style={{
                                  height: '1px',
                                  opacity: 0.49,
                                  backgroundImage: `repeating-linear-gradient(to right, ${slot.bgColor} 0 5px, transparent 5px 10px)`,
                                }}
                              ></div>
                              <div className="text-sm text-gray-600 mb-2 leading-relaxed">
                                {slot.subject}
                              </div>
                              {slot.teacher && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-800 font-medium">
                                  <FiUser className="w-4 h-4 text-gray-500" />
                                  {slot.teacher}
                                </div>
                              )}
                            </>
                          )}
                          {slot.showJoin && (
                            <a
                              href={slot.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full text-center text-sm font-medium text-white bg-[var(--primary-color)] rounded-md py-2.5 mt-3 hover:opacity-90 transition-opacity"
                            >
                              {translate('joinClass')}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
