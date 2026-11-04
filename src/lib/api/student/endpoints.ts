/**
 * Student API Endpoints Configuration
 *
 * Simple endpoints file focused only on student authentication.
 * This keeps the structure clean and beginner-friendly.
 */

// Base API URL - Direct external API for static export
// Note: For static export (output: 'export'), we must use the external API directly
// The external API must have CORS enabled to allow browser requests
export const API_BASE_URL = `${process.env.NEXT_PUBLIC_STUDENT_API_URL}/api`;

// Student Authentication Endpoints
// Note: These are relative paths since axios baseURL is already set
export const STUDENT_AUTH_ENDPOINTS = {
  LOGIN: '/student/login',
  RESET_PASSWORD: '/student/forgot-password',
  CHANGE_PASSWORD: '/change-password', // No /student prefix as per API docs
  GET_PROFILE: '/student/get-profile-data',
} as const;

export const CHAT_ENDPOINTS = {
  GET_CLASS_SECTION_TEACHERS: '/class-section/teachers',
  GET_USER_CHAT_HISTORY: '/users/chat/history',
  GET_MESSAGE: '/message', // GET request with receiver_id query param
  SEND_MESSAGE: '/message', // POST request to send message with text and files
  DELETE_MESSAGE: '/delete/message', // DELETE request to delete message by id
  GET_CHAT_USERS: '/users', // GET request with role, child_id, page params
} as const;

export const STUDENT_TIMETABLE_ENDPOINTS = {
  GET_STUDENT_TIMETABLE: '/student/timetable', // GET request to get student timetable
} as const;

export const EXAM_ENDPOINTS = {
  GET_EXAM_RESULT: '/student/exam-marks', // GET request to get student result
  GET_ONLINE_EXAM_LIST: '/student/get-online-exam-list', // GET request to get online exam list with class_subject_id param
  GET_ONLINE_EXAM_RESULT_LIST: '/student/get-online-exam-result-list', // GET request to get online exam result list
  GET_ONLINE_EXAM_RESULT: '/student/get-online-exam-result', // GET request to get online exam details
  GET_ONLINE_EXAM_QUESTIONS: '/student/get-online-exam-questions', // GET request to get exam questions with exam_id and exam_key params
  GET_EXAM_LIST: '/student/get-exam-list', // GET request to get offline exam list
  GET_EXAM_DETAILS: '/student/get-exam-details', // GET request to get exam details with exam_id param
  SUBMIT_ONLINE_EXAM_ANSWERS: '/student/submit-online-exam-answers', // POST request to submit online exam answers
  GET_STUDENT_EXAM_RESULT_PDF: '/student-exan-result-pdf', // GET request to get student exam result pdf data
} as const;

export const SUBJECT_ENDPOINTS = {
  GET_SUBJECTS: '/student/subjects', // GET request to get student subjects
  GET_CLASS_SUBJECTS: '/student/class-subjects', // GET request to get class subjects with elective groups
  SELECT_SUBJECTS: '/student/select-subjects', // POST request to save elective subject selections
} as const;

export const ASSIGNMENT_ENDPOINTS = {
  GET_ASSIGNMENTS: '/student/assignments', // GET request to get student assignments
  SUBMIT_ASSIGNMENT: '/student/submit-assignment', // POST request to upload student assignment
  DELETE_ASSIGNMENT_SUBMISSION: '/student/delete-assignment-submission', // DELETE request to delete student assignment submission
} as const;

export const NOTICE_BOARD_ENDPOINTS = {
  GET_NOTICE_BOARD: '/student/announcements', // GET request to get student notice board
} as const;

export const ANNOUNCEMENT_ENDPOINTS = {
  GET_ANNOUNCEMENTS: '/student/announcements', // GET request to get subject-specific announcements
} as const;

export const REPORT_ENDPOINTS = {
  GET_ASSIGNMENTS_REPORT: '/student/get-assignments-report',
  GET_ONLINE_EXAM_REPORT: '/student/get-online-exam-report',
  GET_STUDENT_REPORT: '/student/report',
} as const;

export const HOLIDAY_ENDPOINTS = {
  GET_HOLIDAYS: '/holidays', // GET request with class_subject_id param
} as const;

export const GALLERY_ENDPOINTS = {
  GET_GALLERY: '/gallery', // GET request with class_subject_id param
} as const;

export const SESSION_YEARS_ENDPOINTS = {
  GET_SESSION_YEARS: '/session-years', // GET request with class_subject_id param
} as const;

export const SEMESTER_ENDPOINTS = {
  GET_SEMESTERS: '/semester', // GET request with session_year_id param
} as const;

export const GUARDIAN_ENDPOINTS = {
  GET_GUARDIAN_DETAILS: '/student/guradian-details', // GET request to get guardian details
} as const;

export const SETTINGS_ENDPOINTS = {
  GET_SETTINGS: '/settings', // GET request to get settings
  GET_STUDENT_SCHOOL_SETTINGS: '/student/school-settings', // GET request to get student school settings (includes footer_text)
  GET_SYSTEM_BRANDING: '/system-settings', // GET request to get system branding
  GET_SCHOOL_SETTINGS: '/school-settings', // GET request to get school settings
} as const;

export const SLIDER_ENDPOINTS = {
  GET_SLIDERS: '/student/web-sliders', // GET request to get sliders
} as const;

export const ATTENDANCE_ENDPOINTS = {
  GET_ATTENDANCE: '/student/attendance', // GET request to get attendance
} as const;

export const LESSONS_ENDPOINTS = {
  GET_LESSONS: '/student/lessons', // GET request with class_subject_id param
  GET_LESSON_TOPICS: '/student/lesson-topics', // GET request with lesson_id param
} as const;

export const DIARY_ENDPOINTS = {
  GET_DIARIES: '/diaries', // GET request with sort, subject_id, student_id, diary_category_id params
  GET_DIARY_CATEGORIES: '/student/diary-categories', // GET request to get all diary categories
} as const;

export const TRANSPORTATION_ENDPOINTS = {
  GET_DASHBOARD: '/transport/dashboard', // POST request with user_id and pickup_drop params
  GET_LIVE_ROUTE: '/transportation/live-route', // POST request with user_id param
  GET_ATTENDANCE_LIST: '/transport/user/attendance-list', // POST request with user_id param
  STORE_TRIP_REPORT: '/transport/store-trip-reports', // POST request to store trip report
  GET_LIVE_TRACKING: '/student/transportation/live-tracking', // GET request, returns running trip + last GPS location
  GENERATE_TRACKING_LINK: '/transportation/live-tracking/link', // POST request with user_id, returns a shareable tokenized tracking URL
  GET_TRACKING_SESSION: '/transportation/live-tracking/session', // GET request, X-Tracking-Token only, self-contained live session (no auth/school-code)
} as const;

export const TEACHER_ENDPOINTS = {
  GET_TEACHERS: '/teachers', // GET request to get student's teachers list with student_id query param
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  GET_NOTIFICATIONS: '/notifications', // GET request to get student notifications
} as const;

export const CERTIFICATE_ENDPOINTS = {
  ASSIGN: '/certificate/assign',
  GENERATE: '/certificate/generate',
} as const;

export const LANGUAGE_ENDPOINTS = {
  GET_LANGUAGES: '/get-languages', // GET request to get all available languages
  SET_LANGUAGE: '/set-languages', // POST request with language_code and type params, returns translation file
} as const;

export const ID_CARD_ENDPOINTS = {
  GET_ID_CARD: '/student/id-card',
} as const;