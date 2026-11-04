'use client';
import React, { useState, useMemo } from 'react';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useGetHolidays, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Define holiday data type for component use
// Transforms API data (DD-MM-YYYY) to separate date/month/year
interface Holiday {
  date: number; // Day of month (1-31)
  month: number; // Month (0-11, 0-indexed for JavaScript Date)
  year: number; // Full year (e.g., 2025)
  title: string; // Holiday title
  description: string; // Holiday description
}

export default function HolidayPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
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

    if (!isFeatureEnabled('Holiday Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // Fetch holidays from API
  const { data: holidaysData, isLoading, error } = useGetHolidays();

  // Initialize with current date
  const [currentDate, setCurrentDate] = useState(new Date());

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
    },
    {
      label: translate('holiday'),
    },
  ];

  /**
   * Transform API holidays to component format
   * API returns dmyFormat as "DD-MM-YYYY" string (e.g., "16-07-2025")
   * Component needs separate date, month (0-indexed), year numbers
   * Using dmyFormat instead of date field since it's already in the correct format
   */
  const holidays: Holiday[] = useMemo(() => {
    if (!holidaysData?.data) return [];

    return holidaysData.data.map((apiHoliday) => {
      // Use dmyFormat field which is already in "DD-MM-YYYY" format
      // Fallback to default_date_format if dmyFormat is not available
      // The date field is in "YYYY/MM/DD" format, so we prefer dmyFormat
      let day: number, month: number, year: number;

      if (apiHoliday.dmyFormat) {
        // Parse "DD-MM-YYYY" format (e.g., "16-07-2025")
        [day, month, year] = apiHoliday.dmyFormat.split('-').map(Number);
      } else if (apiHoliday.default_date_format) {
        // Parse "DD-MM-YYYY" format from default_date_format
        [day, month, year] = apiHoliday.default_date_format
          .split('-')
          .map(Number);
      } else {
        // Fallback: parse "YYYY/MM/DD" format from date field
        const [yearStr, monthStr, dayStr] = apiHoliday.date.split('/');
        day = Number(dayStr);
        month = Number(monthStr);
        year = Number(yearStr);
      }

      return {
        date: day, // Day of month (1-31)
        month: month - 1, // Convert to 0-indexed (0-11) for JavaScript Date
        year: year, // Full year
        title: apiHoliday.title,
        description: apiHoliday.description,
      };
    });
  }, [holidaysData]);

  // Format the current month display
  const currentMonth = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Generate calendar data dynamically based on current date
  const generateCalendarData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of current month and calculate starting day of week
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    const calendarData = [];

    // Add previous month trailing days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      calendarData.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isHoliday: false,
      });
    }

    // Add current month days with holiday marking
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      // Check if this day is a holiday
      const isHoliday = holidays.some(
        (holiday) =>
          holiday.date === day &&
          holiday.month === month &&
          holiday.year === year
      );

      calendarData.push({
        day,
        isCurrentMonth: true,
        isHoliday,
      });
    }

    // Add next month leading days to fill the grid
    const remainingDays = 42 - calendarData.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      calendarData.push({
        day,
        isCurrentMonth: false,
        isHoliday: false,
      });
    }

    return calendarData;
  };

  const calendarData = generateCalendarData(currentDate);

  const dayNames = [
    translate('monday'),
    translate('tuesday'),
    translate('wednesday'),
    translate('thursday'),
    translate('friday'),
    translate('saturday'),
    translate('sunday'),
  ];

  // Style function for calendar days with responsive classes
  const getDayStyle = (dayData: {
    isCurrentMonth: boolean;
    isHoliday: boolean;
  }) => {
    if (!dayData.isCurrentMonth) {
      return 'text-gray-400 text-sm sm:text-base md:text-lg';
    }

    if (dayData.isHoliday) {
      return 'bg-(--primary-color) text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-sm sm:text-base md:text-lg font-semibold';
    }

    return 'text-gray-900 text-sm sm:text-base md:text-lg font-medium';
  };

  const formatDay = (day: number) => {
    return day.toString().padStart(2, '0');
  };

  // Get month name abbreviation
  const getMonthAbbr = (month: number) => {
    const monthNames = [
      translate('jan'),
      translate('feb'),
      translate('mar'),
      translate('apr'),
      translate('may'),
      translate('jun'),
      translate('jul'),
      translate('aug'),
      translate('sep'),
      translate('oct'),
      translate('nov'),
      translate('dec'),
    ];
    return monthNames[month];
  };

  // Filter holidays for current month
  const currentMonthHolidays = holidays
    .filter(
      (holiday) =>
        holiday.month === currentDate.getMonth() &&
        holiday.year === currentDate.getFullYear()
    )
    .sort((a, b) => a.date - b.date);

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('holiday')} items={breadcrumbItems} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px] bg-white rounded-[12px] border border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[var(--primary-color)] animate-spin" />
            <p className="text-gray-600 font-medium">
              {translate('loadingHolidays')}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white rounded-[12px] border border-gray-200 p-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {translate('failedToLoadHolidays')}
            </h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : translate('errorOccurredWhileFetchingHolidays')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-(--primary-color) text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              {translate('retry')}
            </button>
          </div>
        </div>
      )}

      {/* Main container with responsive padding */}
      {!isLoading && !error && (
        <div className="bg-white rounded-[12px] border border-gray-200 p-3 sm:p-4 md:p-6">
          {/* Main grid layout - calendar on left (5 cols), holidays on right (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6">
            {/* Calendar Section - responsive padding - takes 5 columns on large screens */}
            <div className="lg:col-span-5 bg-[var(--light-primary-color)] rounded-[12px] p-3 sm:p-4 md:p-6 border border-gray-200 ">
              {/* Month Navigation - responsive padding and spacing */}
              {/* RTL-aware: Icons automatically flip direction using CSS transform */}
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 bg-white p-2 sm:p-3 md:p-4 rounded-[12px] border border-gray-200">
                {/* Previous month button - responsive size */}
                {/* Icon rotates 180deg in RTL to point in correct direction */}
                <button
                  onClick={goToPreviousMonth}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center border border-[var(--primary-color)] rounded-[4px]"
                  aria-label={translate('previousMonth')}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary-color)] rtl:rotate-180" />
                </button>

                {/* Month display - responsive padding and text */}
                <div className="flex items-center justify-center bg-[var(--light-primary-color)] rounded-[4px] py-1 px-4 sm:py-2 sm:px-8 md:px-[50px]">
                  <h2 className="text-base sm:text-lg md:text-xl font-medium text-[var(--primary-color)]">
                    {currentMonth}
                  </h2>
                </div>

                {/* Next month button - responsive size */}
                {/* Icon rotates 180deg in RTL to point in correct direction */}
                <button
                  onClick={goToNextMonth}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center border border-[var(--primary-color)] rounded-[4px]"
                  aria-label={translate('nextMonth')}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary-color)] rtl:rotate-180" />
                </button>
              </div>

              {/* Calendar Grid - responsive padding */}
              <div className="bg-white rounded-[12px] px-2 py-3 sm:px-4 sm:py-4 md:px-4 md:py-6 border border-gray-200">
                {/* Day Headers - responsive spacing and text size */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-2 md:gap-4 pb-2 mb-2 sm:pb-3 sm:mb-3 md:pb-5 md:mb-5 border-b border-gray-200">
                  {dayNames.map((day: string) => (
                    <div
                      key={day}
                      className="text-center text-gray-700 text-xs sm:text-sm md:text-base font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days - responsive spacing */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2">
                  {calendarData.map((dayData, index) => (
                    <div
                      key={index}
                      className="flex justify-center items-center h-8 sm:h-10 md:h-12"
                    >
                      <div className={getDayStyle(dayData)}>
                        {formatDay(dayData.day)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Holidays List Section - responsive spacing and height - takes 7 columns on large screens */}
            <div className="lg:col-span-7 space-y-2 sm:space-y-3 md:space-y-4 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto p-2 sm:p-4 pr-1 sm:!pr-4  bg-white rounded-[12px] border border-gray-200">
              {currentMonthHolidays.length > 0 ? (
                currentMonthHolidays.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex gap-2 sm:gap-3 md:gap-4 bg-[var(--light-primary-color)] rounded-[12px] p-2.5 sm:p-3 md:p-4 border border-gray-200"
                  >
                    {/* Date Badge - responsive size */}
                    <div className="flex-shrink-0 bg-(--primary-color) text-white rounded-[4px] w-[40px] h-[42px] sm:w-[50px] sm:h-[52px] md:w-[55px] md:h-[57px] flex flex-col items-center justify-center">
                      <span className="text-base sm:text-xl md:text-2xl font-bold leading-none">
                        {formatDay(holiday.date)}
                      </span>
                      <span className="text-[10px] sm:text-xs md:text-sm font-normal pb-0.5 sm:pb-1">
                        {getMonthAbbr(holiday.month)}
                      </span>
                    </div>

                    {/* Holiday Details - responsive text */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-900 break-words">
                        {holiday.title}
                      </h3>
                      {/* divider line horizontal - responsive margin */}
                      <div className="w-full h-[1px] bg-[#EAEAEA] my-1 sm:my-1.5 md:my-2"></div>
                      <p className="text-[11px] sm:text-xs md:text-sm font-normal text-gray-600 leading-relaxed break-words">
                        {holiday.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-10 md:py-12 text-gray-500 h-full flex items-center justify-center font-medium text-sm sm:text-sm md:text-base">
                  <p>{translate('noHolidaysScheduledForThisMonth')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
