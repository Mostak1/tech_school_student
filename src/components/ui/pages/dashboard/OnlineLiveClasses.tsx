'use client';

import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useGetStudentTimetable } from '@/lib/api/student/queryHooks';
import { TimetableSlot } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 1.5C4.8645 1.5 1.5 4.8645 1.5 9C1.5 13.1355 4.8645 16.5 9 16.5C13.1355 16.5 16.5 13.1355 16.5 9C16.5 4.8645 13.1355 1.5 9 1.5ZM9 15C5.69175 15 3 12.3082 3 9C3 5.69175 5.69175 3 9 3C12.3082 3 15 5.69175 15 9C15 12.3082 12.3082 15 9 15Z"
      fill="#3E3E3E"
    />
    <path d="M9.75 5.25H8.25V9.75H12.75V8.25H9.75V5.25Z" fill="#3E3E3E" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 1.5C8.25832 1.5 7.5333 1.71993 6.91661 2.13199C6.29993 2.54404 5.81928 3.12971 5.53545 3.81494C5.25162 4.50016 5.17736 5.25416 5.32206 5.98159C5.46675 6.70902 5.8239 7.3772 6.34835 7.90165C6.8728 8.4261 7.54098 8.78325 8.26841 8.92795C8.99584 9.07264 9.74984 8.99838 10.4351 8.71455C11.1203 8.43072 11.706 7.95007 12.118 7.33339C12.5301 6.7167 12.75 5.99168 12.75 5.25C12.75 4.25544 12.3549 3.30161 11.6517 2.59835C10.9484 1.89509 9.99456 1.5 9 1.5ZM9 7.5C8.55499 7.5 8.11998 7.36804 7.74997 7.12081C7.37996 6.87357 7.09157 6.52217 6.92127 6.11104C6.75097 5.6999 6.70642 5.2475 6.79323 4.81105C6.88005 4.37459 7.09434 3.97368 7.40901 3.65901C7.72368 3.34434 8.12459 3.13005 8.56105 3.04323C8.9975 2.95642 9.4499 3.00097 9.86104 3.17127C10.2722 3.34157 10.6236 3.62996 10.8708 3.99997C11.118 4.36998 11.25 4.80499 11.25 5.25C11.25 5.84674 11.0129 6.41903 10.591 6.84099C10.169 7.26295 9.59674 7.5 9 7.5ZM15.75 15.75V15C15.75 13.6076 15.1969 12.2723 14.2123 11.2877C13.2277 10.3031 11.8924 9.75 10.5 9.75H7.5C6.10761 9.75 4.77226 10.3031 3.78769 11.2877C2.80312 12.2723 2.25 13.6076 2.25 15V15.75H3.75V15C3.75 14.0054 4.14509 13.0516 4.84835 12.3483C5.55161 11.6451 6.50544 11.25 7.5 11.25H10.5C11.4946 11.25 12.4484 11.6451 13.1517 12.3483C13.8549 13.0516 14.25 14.0054 14.25 15V15.75H15.75Z"
      fill="#3E3E3E"
    />
  </svg>
);

interface LiveClassItem {
  subject: string;
  teacher: string;
  time: string;
  meetingLink: string;
  isLive: boolean;
  showJoin: boolean;
}

export default function OnlineLiveClasses() {
  const translate = useTranslate();

  const { data: timetableResponse, isLoading, error } =
    useGetStudentTimetable();

  const classes = useMemo<LiveClassItem[]>(() => {
    if (!timetableResponse?.data) return [];

    const dayOrder = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    // System (device) date + time drive live/upcoming detection
    const now = new Date();
    const todayName = dayOrder[(now.getDay() + 6) % 7]; // JS 0=Sun -> Monday-first
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Today as local "YYYY-MM-DD" for date-range comparison
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Rule 1: is this slot an online class today?
    // start_date null -> offline (no label); end_date null -> only on start_date;
    // both set -> inclusive range.
    const isOnlineToday = (slot: TimetableSlot) => {
      if (!slot.start_date) return false;
      if (!slot.end_date) return todayStr === slot.start_date;
      return slot.start_date <= todayStr && todayStr <= slot.end_date;
    };

    // Parse "HH:MM:SS" -> minutes since midnight
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    // Format "HH:MM:SS" -> "h:mm AM/PM"
    const formatTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    };

    return timetableResponse.data
      // Only today's online classes: real subject (rule 5: skip breaks),
      // online today (rule 1), matches today's weekday, and not yet ended
      .filter(
        (slot: TimetableSlot) =>
          !!slot.subject &&
          !!slot.meeting_link &&
          slot.day === todayName &&
          isOnlineToday(slot) &&
          nowMinutes < toMinutes(slot.end_time),
      )
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
      .map((slot) => {
        const teacher =
          slot.teacher_first_name || slot.teacher_last_name
            ? `${slot.teacher_first_name} ${slot.teacher_last_name}`.trim()
            : '';

        const startMin = toMinutes(slot.start_time);
        const endMin = toMinutes(slot.end_time);

        // Rule 4: live = start <= now < end (else upcoming, since completed filtered out)
        const isLive = nowMinutes >= startMin && nowMinutes < endMin;

        // Rule 3: Join visible from 30 min before start until end
        const showJoin = nowMinutes >= startMin - 30 && nowMinutes < endMin;

        return {
          subject: slot.subject?.name_with_type || slot.note || '',
          teacher,
          time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
          meetingLink: slot.meeting_link || '',
          isLive,
          showJoin,
        };
      });
  }, [timetableResponse]);

  return (
    <div className="bg-white rounded-[12px] border border-gray-200">
      <h2 className="text-lg sm:text-xl font-medium text-gray-800 border-b border-gray-200 p-3 sm:p-4 md:p-6 leading-relaxed">
        {translate('onlineLiveClasses')}
      </h2>

      <div className="p-3 sm:p-4 md:p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-color)]" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              {translate('failedToLoadTimetable')}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && classes.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500 text-sm text-center">
              {translate('noOnlineLiveClasses')}
            </p>
          </div>
        )}

        {/* Class List */}
        {!isLoading && !error && classes.length > 0 && (
          <div className="space-y-4">
            {classes.map((item, index) => (
              <div
                key={index}
                className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-[12px] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-gray-800">
                        {item.subject}
                      </span>
                      {item.isLive ? (
                        <span className="flex items-center gap-2 rounded-sm border border-[#FF6769] bg-white px-2 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6769]"></span>
                          <span className="text-xs font-medium text-[#FF6769]">
                            {translate('liveNow')}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 rounded-sm border border-[#0186D8] bg-white px-2 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0186D8]"></span>
                          <span className="text-xs font-medium text-[#0186D8]">
                            {translate('upcoming')}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {item.time}
                      </span>
                      {item.teacher && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            {item.teacher}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {item.showJoin && item.meetingLink && (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-center text-sm font-medium text-white bg-[#22577A] rounded-sm px-2 py-1 hover:opacity-90 transition-opacity"
                    >
                      {translate('joinNow')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
