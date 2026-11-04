'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../card';
import { BiCalendarCheck, BiCalendarX } from 'react-icons/bi';
import { useAttendance } from '@/lib/api/student/queryHooks';
import { AttendanceRecord } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

export default function AttendanceCalendar() {
  const translate = useTranslate();
  // Initialize with current date
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month and year for API call
  const currentMonth = currentDate.getMonth() + 1; // API expects 1-12
  const currentYear = currentDate.getFullYear();

  // Fetch attendance data using the API
  const {
    data: attendanceData,
    isLoading,
    error,
  } = useAttendance(currentMonth, currentYear);

  // Format the current month display
  const currentMonthDisplay = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Get current date for comparison
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

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

  // Create a map of attendance data by date for quick lookup
  const attendanceMap = new Map<string, AttendanceRecord>();
  if (attendanceData?.data?.attendance) {
    attendanceData.data.attendance.forEach((record) => {
      // Parse the date and create a key in YYYY-MM-DD format
      const dateKey = record.get_date_original;
      attendanceMap.set(dateKey, record);
    });
  }

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
      });
    }

    // Add current month days with real attendance data
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date string in YYYY-MM-DD format for lookup
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      const attendanceRecord = attendanceMap.get(dateStr);

      let status = null;
      let isHoliday = false;

      if (attendanceRecord) {
        // type: 1 = present, 0 = absent, 3 = holiday (don't count)
        if (attendanceRecord.type === 1) {
          status = 'present';
        } else if (attendanceRecord.type === 0) {
          status = 'absent';
        } else if (attendanceRecord.type === 3) {
          isHoliday = true;
        }
        // type: 3 (holiday) is not counted in attendance, so status remains null
      }

      calendarData.push({
        day,
        isCurrentMonth: true,
        status,
        isHoliday,
      });
    }

    // Add next month leading days to fill the grid
    const remainingDays = 42 - calendarData.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      calendarData.push({
        day,
        isCurrentMonth: false,
      });
    }

    return calendarData;
  };

  const calendarData = generateCalendarData(currentDate);

  // Calculate attendance summary for current month
  // Note: Holidays (type: 3) are not counted in attendance statistics
  const currentMonthDays = calendarData.filter((day) => day.isCurrentMonth);
  const presentCount = currentMonthDays.filter(
    (day) => day.status === 'present'
  ).length;
  const absentCount = currentMonthDays.filter(
    (day) => day.status === 'absent'
  ).length;

  const dayNames = [
    translate('monday'),
    translate('tuesday'),
    translate('wednesday'),
    translate('thursday'),
    translate('friday'),
    translate('saturday'),
    translate('sunday'),
  ];

  const getDayStyle = (dayData: {
    isCurrentMonth: boolean;
    status?: string | null;
    isHoliday?: boolean;
  }) => {
    if (!dayData.isCurrentMonth) {
      return 'text-gray-400 text-sm sm:text-lg';
    }

    if (dayData.status === 'present') {
      return 'bg-[var(--secondary-color)] text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-medium';
    } else if (dayData.status === 'absent') {
      return 'bg-[var(--fourth-color)] text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-medium';
    } else {
      // Holidays and regular days both use default styling
      return 'text-gray-900 text-sm sm:text-lg font-medium';
    }
  };

  const formatDay = (day: number) => {
    return day.toString().padStart(2, '0');
  };

  return (
    <Card className="mx-auto bg-white rounded-[12px] border border-gray-200 shadow-none overflow-hidden">
      {/* Header - responsive padding */}
      <h1 className="text-xl font-medium text-gray-900 p-4 sm:p-6 border-b border-gray-200">
        {translate('attendance')}
      </h1>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 sm:p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
          <p className="mt-2 text-gray-600">
            {translate('loadingAttendanceData')}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 sm:p-6 text-center">
          <p className="text-red-600">
            {translate('failedToLoadAttendanceData')}
          </p>
        </div>
      )}

      {/* Calendar Container - responsive padding */}
      {!isLoading && !error && (
        <div className="bg-white p-4 sm:p-6">
          <div className="bg-[var(--light-primary-color)] rounded-[16px] p-3 sm:p-4 mb-4 sm:mb-6">
            {/* Month Navigation - responsive layout */}
            {/* RTL-aware: Icons automatically flip direction using CSS transform */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-[16px]">
              {/* Previous Month Button */}
              {/* Icon rotates 180deg in RTL to point in correct direction */}
              <button
                onClick={goToPreviousMonth}
                className="p-2 border border-[var(--primary-color)] rounded-[4px] hover:bg-gray-100 transition-colors"
                aria-label={translate('previousMonth')}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary-color)] rtl:rotate-180" />
              </button>

              {/* Current Month Display */}
              <h2 className="text-sm sm:text-lg font-medium text-gray-700 bg-[var(--light-primary-color)] p-2 sm:p-3 rounded-[16px] text-center">
                {currentMonthDisplay}
              </h2>

              {/* Next Month Button */}
              {/* Icon rotates 180deg in RTL to point in correct direction */}
              <button
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className={`p-2 border rounded-[4px] transition-colors ${
                  isCurrentMonth
                    ? 'border-gray-300 opacity-50 cursor-not-allowed'
                    : 'border-[var(--primary-color)] hover:bg-gray-100 cursor-pointer'
                }`}
                style={{ cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}
                aria-label={translate('nextMonth')}
              >
                <ChevronRight
                  className={`w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180 ${
                    isCurrentMonth
                      ? 'text-gray-400'
                      : 'text-[var(--primary-color)]'
                  }`}
                />
              </button>
            </div>

            {/* Day Headers - responsive grid and text */}
            <div className="grid grid-cols-7 gap-1 sm:gap-4 bg-white py-3 sm:py-6 rounded-[16px]">
              {dayNames.map((day: string) => (
                <div
                  key={day}
                  className="text-center text-gray-900 text-sm sm:text-xl font-normal"
                >
                  {day}
                </div>
              ))}

              {calendarData.map((dayData, index) => (
                <div
                  key={index}
                  className="flex justify-center text-sm sm:text-xl font-normal"
                >
                  <div className={getDayStyle(dayData)}>
                    {formatDay(dayData.day)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Cards - responsive layout */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {/* Total Present */}
            <div className="flex-1 bg-white rounded-[16px] p-3 sm:p-4 border border-[var(--secondary-color)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BiCalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--secondary-color)]" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm sm:text-base font-medium">
                    {translate('totalPresent')}
                  </p>
                </div>
                <div className="bg-[var(--secondary-color)] text-white rounded-xl p-2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-medium">
                    {presentCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Absent */}
            <div className="flex-1 bg-white rounded-[16px] p-3 sm:p-4 border border-[var(--fourth-color)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <BiCalendarX className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--fourth-color)]" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm sm:text-base font-medium">
                    {translate('totalAbsent')}
                  </p>
                </div>
                <div className="bg-[var(--fourth-color)] text-white rounded-xl p-2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-medium">
                    {absentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
