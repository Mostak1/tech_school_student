// src/lib/firebase/notificationRedirect.ts
// ────────────────────────────────────────────────────────────────

import { Notification } from '@/lib/api/student/functions';

export interface NotificationWithPayload extends Notification {
  assignment_id?: number;
  class_subject_id?: number;
  receiver_id?: number;
  teacher_name?: string;
  teacher_image?: string;
  subject_name?: string;
  subject_id?: number;
  lesson_id?: number;
  result_id?: number;
  exam_id?: number;
  exam_name?: string;
  exam_type?: string;
  [key: string]: unknown;
}

export function getNotificationRedirectUrl(
  notification: NotificationWithPayload
): string | null {
  const type = (notification.type ?? '').toLowerCase().trim();
  const examType = (notification.exam_type ?? '').toLowerCase().trim();

  // ── Announcement family ───────────────────────────────────────
  if (
    type.includes('announcement') ||
    type === 'announcement created' ||
    type === 'announcement updated' ||
    type === 'announcements'
  ) {
    return '/student/dashboard';
  }

  // ── Lesson / Topic family ─────────────────────────────────────
  if (
    type === 'lesson topic created' ||
    type === 'lesson topic updated' ||
    type === 'lesson' ||
    type === 'topic'
  ) {
    const subjectId = Number(notification.subject_id);
    if (!isNaN(subjectId) && subjectId > 0) {
      return `/student/subjects/detail?id=${subjectId}`;
    }
    return '/student/subjects'; // fallback
  }

  // ── Assignment ────────────────────────────────────────────────
  if (type === 'assignment') {  
    const aid = notification.assignment_id;
    const csid = notification.class_subject_id;
    if (typeof aid === 'number' && typeof csid === 'number') {
      return `/student/assignments?assignment_id=${aid}&class_subject_id=${csid}`;
    }
    return '/student/assignments';
  }

  // ── Message / Chat ────────────────────────────────────────────
  if (type === 'message') {
    const rid = notification.receiver_id;
    if (typeof rid === 'number') {
      return `/student/chats?receiver_id=${rid}`;
    }
    return '/student/chats';
  }

  // ── Exam ──────────────────────────────────────────────────────
  if (type === 'exam') {
    const eid = notification.exam_id;
    if (typeof eid !== 'number') return '/student/exams';

    if (examType === 'online') {
      return `/student/exams?tab=online&exam_id=${eid}`;
    }
    if (examType === 'offline') {
      return `/student/exams/offline/detail?id=${eid}`;
    }
    return `/student/exams?exam_id=${eid}`;
  }

  // ── Exam result ───────────────────────────────────────────────
  if (type === 'exam result' || type === 'result') {
    const rid = notification.result_id ?? notification.exam_id;
    if (typeof rid === 'number') {
      return `/student/result?result_id=${rid}`;
    }
    return '/student/result';
  }

  // ── Payment / Fees ────────────────────────────────────────────
  if (['payment', 'fees_paid', 'fee-reminder'].includes(type)) {
    return '/student/transactions';
  }

  // ── Other known types (simple redirect) ───────────────────────
  const simpleRedirects: Record<string, string> = {
    attendance: '/student/attendance',
    diary: '/student/diary',
    leave: '/student/notifications',
    'exam_timetable_created': '/student/exams',
    'class section': '/student/subjects',
    transport: '/student/transportation',
    transportation: '/student/transportation',
    notification: '/student/notifications',
    general: '/student/notifications',
    custom: '/student/notifications',
  };

  if (type in simpleRedirects) {
    return simpleRedirects[type];
  }

  // ── Ultimate fallback ─────────────────────────────────────────
  return '/student/notifications';
}

export function handleNotificationClick(
  notification: NotificationWithPayload,
  router: { push: (url: string) => void }
): void {
  const url = getNotificationRedirectUrl(notification);
  if (url) {
    console.debug('[Notification Redirect] →', url);
    router.push(url);
  }
}