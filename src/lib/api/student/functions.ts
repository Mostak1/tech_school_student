/**
 * Student API Functions
 *
 * Simple API functions file focused only on student authentication.
 * Uses axios with interceptors for better error handling and token management.
 */

import { studentApi } from './axiosConfig';
import {
  STUDENT_AUTH_ENDPOINTS,
  CHAT_ENDPOINTS,
  STUDENT_TIMETABLE_ENDPOINTS,
  EXAM_ENDPOINTS,
  SUBJECT_ENDPOINTS,
  ASSIGNMENT_ENDPOINTS,
  NOTICE_BOARD_ENDPOINTS,
  ANNOUNCEMENT_ENDPOINTS,
  REPORT_ENDPOINTS,
  HOLIDAY_ENDPOINTS,
  GALLERY_ENDPOINTS,
  SESSION_YEARS_ENDPOINTS,
  SEMESTER_ENDPOINTS,
  GUARDIAN_ENDPOINTS,
  SETTINGS_ENDPOINTS,
  SLIDER_ENDPOINTS,
  ATTENDANCE_ENDPOINTS,
  LESSONS_ENDPOINTS,
  DIARY_ENDPOINTS,
  TRANSPORTATION_ENDPOINTS,
  TEACHER_ENDPOINTS,
  NOTIFICATIONS_ENDPOINTS,
  API_BASE_URL,
  CERTIFICATE_ENDPOINTS,
  ID_CARD_ENDPOINTS,
  LANGUAGE_ENDPOINTS
} from './endpoints';

// Types for student login
export interface StudentLoginRequest {
  gr_number: string;
  password: string;
  school_code: string;
  web_fcm?: string; // Optional FCM token for push notifications
}

// Complete user data structure from API response
export interface StudentUser {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  roll_number: number;
  admission_no: string;
  admission_date: string;
  gender: string;
  image: string;
  dob: string;
  current_address: string;
  permanent_address: string;
  occupation: string | null;
  status: number;
  fcm_id: string | null;
  school_id: number;
  session_year_id: number;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  class_section: {
    id: number;
    class_id: number;
    section_id: number;
    medium_id: number;
    school_id: number;
    deleted_at: string | null;
    name: string;
    full_name: string;
    section: {
      id: number;
      name: string;
      school_id: number;
      deleted_at: string | null;
    };
    class: {
      id: number;
      name: string;
      include_semesters: number;
      medium_id: number;
      shift_id: number;
      stream_id: number | null;
      school_id: number;
      deleted_at: string | null;
      full_name: string;
      semester_name: string;
    };
    medium: {
      id: number;
      name: string;
      school_id: number;
      deleted_at: string | null;
    };
  };
  guardian: {
    id: number;
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    gender: string;
    image: string;
    dob: string | null;
    current_address: string | null;
    permanent_address: string | null;
    occupation: string | null;
    status: number;
    reset_request: number;
    fcm_id: string;
    school_id: number;
    language: string;
    email_verified_at: string | null;
    two_factor_enabled: number;
    two_factor_secret: string | null;
    two_factor_expires_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    full_name: string;
    school_names: string;
    role: string;
  };
  school: {
    id: number;
    name: string;
    address: string;
    support_phone: string;
    support_email: string;
    tagline: string;
    logo: string;
    admin_id: number;
    status: number;
    installed: number;
    domain: string;
    code: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export interface StudentLoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: StudentUser; // Store complete user object from API response
  };
}

/**
 * Student Login Function
 *
 * This function handles student login using the provided credentials.
 * Uses axios with automatic error handling and token management.
 */
export async function studentLogin(
  credentials: StudentLoginRequest
): Promise<StudentLoginResponse> {
  // Create FormData object to match the curl command format
  const formData = new FormData();
  formData.append('gr_number', credentials.gr_number);
  formData.append('password', credentials.password);
  formData.append('school_code', credentials.school_code);

  // Add FCM token if provided
  // This token is used for push notifications
  if (credentials.web_fcm) {
    formData.append('web_fcm', credentials.web_fcm);
  }

  // Make the API request using axios
  // The axios interceptor will handle errors and convert them to ApiError
  // Don't set Content-Type manually - let axios handle it with FormData
  const response = await studentApi.post(
    STUDENT_AUTH_ENDPOINTS.LOGIN,
    formData
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, data: {user data}, token: "..." }
  // We need: { success: true, data: { user: {...}, token: "..." } }
  const apiResponse = response.data;

  return {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: {
      token: apiResponse.token,
      user: apiResponse.data, // Store complete user data from API response
    },
  };
}

// Types for student forgot password
export interface StudentForgotPasswordRequest {
  gr_no: string;
  dob: string; // Date of birth in YYYY-MM-DD format
  school_code: string;
}

export interface StudentForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    new_password: string; // The API returns a new password
  };
}

/**
 * Student Forgot Password Function
 *
 * This function handles student forgot password using the provided credentials.
 * The API generates a new password and returns it to the user.
 * Uses axios with automatic error handling.
 */
export async function studentForgotPassword(
  credentials: StudentForgotPasswordRequest
): Promise<StudentForgotPasswordResponse> {
  // Create FormData object to match the curl command format
  const formData = new FormData();
  formData.append('gr_no', credentials.gr_no);
  formData.append('dob', credentials.dob);
  formData.append('school_code', credentials.school_code);

  // Make the API request using axios
  // The axios interceptor will handle errors and convert them to ApiError
  // Don't set Content-Type manually - let axios handle it with FormData
  const response = await studentApi.post(
    STUDENT_AUTH_ENDPOINTS.RESET_PASSWORD,
    formData
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: null or "new_password" }
  // We need: { success: true, message: "...", data: { new_password: "..." } or undefined }
  const apiResponse = response.data;

  return {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    // Only include data if new_password is provided, otherwise data is undefined
    data: apiResponse.data
      ? {
        new_password: apiResponse.data,
      }
      : undefined,
  };
}

// Types for student change password
export interface StudentChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_confirm_password: string;
}

export interface StudentChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Student Change Password Function
 *
 * This function handles changing the student's password.
 * Requires the user to be authenticated (token is automatically added by axios).
 * Uses axios with automatic error handling and token management.
 */
export async function studentChangePassword(
  credentials: StudentChangePasswordRequest
): Promise<StudentChangePasswordResponse> {
  // Create FormData object to match the curl command format
  const formData = new FormData();
  formData.append('current_password', credentials.current_password);
  formData.append('new_password', credentials.new_password);
  formData.append('new_confirm_password', credentials.new_confirm_password);

  // Make the API request using axios
  // The axios interceptor will automatically add the Authorization Bearer token
  // The axios interceptor will handle errors and convert them to ApiError
  // Don't set Content-Type manually - let axios handle it with FormData
  const response = await studentApi.post(
    STUDENT_AUTH_ENDPOINTS.CHANGE_PASSWORD,
    formData
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "Password changed successfully" }
  // We need: { success: true, message: "Password changed successfully" }
  const apiResponse = response.data;

  return {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
  };
}

// Types for student profile data response
export interface StudentProfileData {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  country_code: string | null;
  roll_number: number;
  admission_no: string;
  admission_date: string;
  gender: string;
  image: string;
  dob: string;
  current_address: string;
  permanent_address: string;
  occupation: string | null;
  status: number;
  fcm_id: string | null;
  school_id: number;
  session_year_id: number;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Nested data
  class_section: {
    id: number;
    class_id: number;
    section_id: number;
    medium_id: number;
    school_id: number;
    deleted_at: string | null;
    name: string;
    full_name: string;
    section: {
      id: number;
      name: string;
      school_id: number;
      deleted_at: string | null;
    };
    class: {
      id: number;
      name: string;
      include_semesters: number;
      medium_id: number;
      shift_id: number;
      stream_id: number | null;
      school_id: number;
      deleted_at: string | null;
      full_name: string;
      semester_name: string;
    };
    medium: {
      id: number;
      name: string;
      school_id: number;
      deleted_at: string | null;
    };
  };
  guardian: {
    id: number;
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    gender: string;
    image: string;
    dob: string | null;
    current_address: string | null;
    permanent_address: string | null;
    occupation: string | null;
    status: number;
    reset_request: number;
    fcm_id: string;
    school_id: number;
    language: string;
    email_verified_at: string | null;
    two_factor_enabled: number;
    two_factor_secret: string | null;
    two_factor_expires_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    full_name: string;
    school_names: string;
    role: string;
  };
  school: {
    id: number;
    name: string;
    address: string;
    support_phone: string;
    support_email: string;
    tagline: string;
    logo: string;
    admin_id: number;
    status: number;
    installed: number;
    domain: string;
    code: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  // Extra/custom fields defined by the school
  extra_details?: Array<{
    id: number;
    user_id: number;
    form_field_id: number;
    data: string;
    school_id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    file_url: string | null;
    form_field: {
      id: number;
      name: string;
      type: 'text' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'textarea';
      is_required: number;
      default_values: string[] | null;
      school_id: number;
      user_type: number;
      rank: number;
      display_on_id: number;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
  }>;
}

export interface StudentProfileResponse {
  success: boolean;
  message: string;
  data?: StudentProfileData;
}

/**
 * Get Student Profile Data Function
 *
 * This function fetches the student's complete profile data from the API.
 * Requires the user to be authenticated (token is automatically added by axios).
 * Uses axios with automatic error handling and token management.
 */
export async function getStudentProfile(
  schoolCode: string
): Promise<StudentProfileResponse> {
  // Make GET request with school_code as query parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(STUDENT_AUTH_ENDPOINTS.GET_PROFILE, {
    params: {
      school_code: schoolCode,
    },
  });

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: {...} }
  // We need: { success: true, message: "...", data: {...} }
  const apiResponse = response.data;

  return {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // The profile data from API response
  };
}

// Types for teacher data from class section
export interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string; // Full name of the teacher
  role: string; // Subject/role of the teacher
  image: string | null;
  email: string;
  mobile: string;
  subject_teachers?: SubjectTeacher[];
}

export interface SubjectTeacher {
  id: number;
  class_section_id: number;
  subject_id: number;
  subject_with_name: string;
  subject: {
    id: number;
    name: string;
    code: string;
    type: string;
    bg_color: string;
    image: string;
  };
}

export interface GetClassSectionTeachersRequest {
  class_section_id: string;
}

export interface GetClassSectionTeachersResponse {
  success: boolean;
  message: string;
  data?: Teacher[]; // Array of teachers
}

/**
 * Get Class Section Teachers Function
 *
 * This function fetches all teachers for a specific class section.
 * Requires the user to be authenticated (token is automatically added by axios).
 * Uses FormData to match the API's expected format.
 */
export async function getClassSectionTeachers(
  request: GetClassSectionTeachersRequest
): Promise<GetClassSectionTeachersResponse> {
  // Create FormData object to match the curl command format
  const formData = new FormData();
  formData.append('class_section_id', request.class_section_id);

  // Make the API request using axios
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    CHAT_ENDPOINTS.GET_CLASS_SECTION_TEACHERS,
    formData
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: [...] }
  // We need: { success: true, message: "...", data: [...] }
  const apiResponse = response.data;

  return {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data || [], // Array of teachers from API response
  };
}

// Types for chat history data
export interface ChatHistoryUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string; // Full name of the user
  image: string | null; // User profile image
  role: string; // Role of the user (e.g., Teacher, Student)
  subject_teachers?: SubjectTeacher[];
}

export interface ChatHistoryItem {
  id: number;
  sender_id: number; // ID of the message sender
  receiver_id: number; // ID of the message receiver
  user: ChatHistoryUser; // User object with details
  last_message: string; // Last message text from the API
  unread_count: number; // Number of unread messages
  created_at: string; // Date-time format: "26/09/2025 11:52"
  updated_at: string; // Date-time format: "26/09/2025 11:52"
}

export interface GetChatHistoryRequest {
  role: string; // Role to filter chat history (e.g., "Teacher")
  search?: string; // Optional search term to filter chat history by contact name or message content
  page?: number; // Optional page number for pagination
}

export interface GetChatHistoryResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: ChatHistoryItem[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  }; // Full paginated response object
}

// Types for chat users (teachers/staff)
export interface GetChatUsersRequest {
  role: string; // 'Staff' or 'Teacher'
  child_id: number; // ID of the logged-in student (or child)
  page?: number; // Pagination page number
  search?: string; // Optional search term
}

export interface ChatUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  image: string | null;
  role: string;
  email: string;
  subject_teachers?: SubjectTeacher[];
}

export interface GetChatUsersResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: ChatUser[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

/**
 * Get Chat Users Function
 *
 * This function fetches users (Teachers/Staff) for chat with pagination.
 * Uses the new /users endpoint which supports role filtering and pagination.
 * Requires child_id and role parameters.
 */
export async function getChatUsers(
  request: GetChatUsersRequest
): Promise<GetChatUsersResponse> {
  // Make GET request with query parameters
  const response = await studentApi.get(CHAT_ENDPOINTS.GET_CHAT_USERS, {
    params: {
      role: request.role,
      child_id: request.child_id,
      page: request.page || 1,
      ...(request.search &&
        request.search.trim() && { search: request.search.trim() }),
    },
  });

  const apiResponse = response.data;

  // The API returns paginated data structure directly in data
  const data = apiResponse.data || null;

  return {
    success: !apiResponse.error,
    message: apiResponse.message,
    data: data,
  };
}

/**
 * Get Chat History Function
 *
 * This function fetches chat history with all contacts.
 * Requires the user to be authenticated (token is automatically added by axios).
 * Returns chat data with user info, last message, unread count, and timestamps.
 */
export async function getChatHistory(
  request: GetChatHistoryRequest
): Promise<GetChatHistoryResponse> {
  // Make GET request with role and optional search as query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(CHAT_ENDPOINTS.GET_USER_CHAT_HISTORY, {
    params: {
      role: request.role,
      // Only include search parameter if it's provided and not empty
      ...(request.search &&
        request.search.trim() && { search: request.search.trim() }),
      page: request.page || 1,
    },
  });

  // Transform API response to match our expected structure
  // API returns paginated data: { error: false, message: "...", data: { data: [...], pagination info } }
  const apiResponse = response.data;

  // Verify structure and return the full paginated data object
  // The API response.data should be the pagination object
  const data = apiResponse.data || null;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: data, // Return the full paginated object
  };

  return result;
}

// Types for message file attachments
// Based on actual API response
export interface MessageAttachment {
  id: number;
  message_id: number;
  file: string; // Full URL to the file
  file_type: string; // File extension (e.g., "jpg", "pdf", "mp4")
  created_at: string; // Date-time format: "10/10/2025 11:54"
  updated_at: string; // Date-time format: "10/10/2025 11:54"
}

// Types for individual chat message
// Based on actual API response structure
export interface ChatMessage {
  id: number;
  chat_id: number; // Chat conversation ID
  sender_id: number; // ID of the sender
  message: string | null; // Message text content (can be null if only attachments)
  read_at: string | null; // When the message was read
  created_at: string; // Date-time format: "26/09/2025 11:52"
  updated_at: string; // Date-time format: "26/09/2025 11:52"
  attachment: MessageAttachment[]; // Array of file attachments
}

export interface GetMessagesRequest {
  receiver_id: number; // ID of the receiver to fetch messages with
  search?: string; // Search term to filter messages by content
  page?: number; // Page number for pagination
}

export interface GetMessagesResponse {
  success: boolean;
  message: string;
  data?: ChatMessage[]; // Array of chat messages
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

/**
 * Get Messages Function
 *
 * This function fetches all messages between the logged-in user and a specific contact.
 * Requires the user to be authenticated (token is automatically added by axios).
 * Returns messages with sender, receiver, text content, files, and timestamps.
 */
export async function getMessages(
  request: GetMessagesRequest
): Promise<GetMessagesResponse> {
  // Make GET request with receiver_id, optional search, and page as query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(CHAT_ENDPOINTS.GET_MESSAGE, {
    params: {
      receiver_id: request.receiver_id,
      ...(request.search &&
        request.search.trim() && { search: request.search.trim() }),
      ...(request.page && { page: request.page }),
    },
  });

  // Transform API response to match our expected structure
  // The API may return paginated data or a flat array
  // Handle both cases:
  // Paginated: { error: false, message: "...", data: { data: [...], pagination info } }
  // Flat: { error: false, message: "...", data: [...] }
  const apiResponse = response.data;

  // Extract the actual array - handle both paginated and flat structures
  let messagesArray: ChatMessage[] = [];
  let pagination = undefined;

  if (apiResponse.data) {
    // Check if data is paginated (has nested data property)
    if (
      typeof apiResponse.data === 'object' &&
      'data' in apiResponse.data &&
      Array.isArray(apiResponse.data.data)
    ) {
      // Paginated response: extract from nested data.data
      messagesArray = apiResponse.data.data;
      // Extract pagination metadata
      pagination = {
        current_page: apiResponse.data.current_page,
        last_page: apiResponse.data.last_page,
        per_page: apiResponse.data.per_page,
        total: apiResponse.data.total,
        next_page_url: apiResponse.data.next_page_url,
        prev_page_url: apiResponse.data.prev_page_url,
      };
    } else if (Array.isArray(apiResponse.data)) {
      // Flat array response
      messagesArray = apiResponse.data;
    } else {
      // Unknown structure, log it and return empty array
      console.warn('Unexpected API response structure:', apiResponse.data);
      messagesArray = [];
    }
  }

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: messagesArray, // Array of messages extracted from response
    pagination, // Include pagination metadata if available
  };

  return result;
}

// =========================================================================
// SUBMIT ONLINE EXAM ANSWERS API FUNCTION
// =========================================================================

export interface SubmitOnlineExamAnswersRequest {
  online_exam_id: number;
  answers_data: Array<{
    question_id: number;
    option_id: number[];
  }>;
}

export interface SubmitOnlineExamAnswersResponse {
  success: boolean;
  message: string;
}

/**
 * Submit Online Exam Answers
 *
 * Sends student's answers for an online exam. The axios interceptor
 * automatically adds Authorization and school-code headers.
 */
export async function submitOnlineExamAnswers(
  request: SubmitOnlineExamAnswersRequest
): Promise<SubmitOnlineExamAnswersResponse> {
  const response = await studentApi.post(
    EXAM_ENDPOINTS.SUBMIT_ONLINE_EXAM_ANSWERS,
    request
  );

  const apiResponse = response.data;

  return {
    success: !apiResponse.error,
    message: apiResponse.message,
  };
}

// Types for send message request
export interface SendMessageRequest {
  to: string; // Receiver ID as string (API expects string format)
  message: string; // Text message content
  files?: File[]; // Array of files (images, documents, videos)
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data?: ChatMessage; // The newly created message
}

/**
 * Send Message Function
 *
 * This function sends a new message to a specific user with optional file attachments.
 * Supports images, documents, and MP4 videos (up to 10MB for videos).
 * Uses FormData to handle file uploads.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  // Create FormData for file upload support
  const formData = new FormData();

  // Add text message and receiver ID
  formData.append('to', request.to);
  formData.append('message', request.message);

  // Add files if any (images, documents, videos)
  // API expects files[] array format
  if (request.files && request.files.length > 0) {
    request.files.forEach((file) => {
      formData.append('files[]', file);
    });
  }

  // Make POST request with FormData
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  // Note: Don't set Content-Type header manually - axios will automatically set it
  // with the correct boundary for multipart/form-data
  const response = await studentApi.post(CHAT_ENDPOINTS.SEND_MESSAGE, formData);

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // The newly created message
  };

  return result;
}

// Types for delete message request
export interface DeleteMessageRequest {
  id: number[]; // Array of message IDs to delete
}

export interface DeleteMessageResponse {
  success: boolean;
  message: string;
}

/**
 * Delete Message Function
 *
 * This function deletes one or more messages by their IDs.
 * The API expects an array of message IDs to delete.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function deleteMessage(
  request: DeleteMessageRequest
): Promise<DeleteMessageResponse> {
  // Make POST request with JSON data
  // The API expects Content-Type: application/json and data format: { "id": [88] }
  const response = await studentApi.post(CHAT_ENDPOINTS.DELETE_MESSAGE, {
    id: request.id,
  });

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
  };

  return result;
}

// Types for timetable data
// Based on actual API response structure
export interface TimetableSubject {
  id: number;
  name: string;
  code: string;
  bg_color: string;
  image: string;
  mobile_image: string;
  medium_id: number;
  type: string;
  school_id: number;
  deleted_at: string | null;
  name_with_type: string;
}

export interface TimetableSlot {
  start_time: string; // Time format: "HH:MM" (e.g., "11:02")
  end_time: string; // Time format: "HH:MM" (e.g., "11:59")
  day: string; // Day of the week (e.g., "Monday", "Tuesday")
  subject: TimetableSubject | null; // Subject object or name
  teacher_first_name: string; // Teacher's first name
  teacher_last_name: string; // Teacher's last name
  note: string | null; // Additional notes (e.g., "Break")
  start_date?: string | null; // Class start date (e.g., "2026-06-30")
  end_date?: string | null; // Class end date
  repeat?: string | null; // Repeat pattern (e.g., "No Repeat")
  meeting_link?: string | null; // Online class meeting link
}

export interface GetTimetableResponse {
  success: boolean;
  message: string;
  data?: TimetableSlot[]; // Array of timetable slots
}

/**
 * Get Student Timetable Function
 *
 * This function fetches the student's weekly timetable from the API.
 * Returns all class schedules organized by day with timing, subject, and teacher info.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getStudentTimetable(): Promise<GetTimetableResponse> {
  // Make GET request to fetch timetable
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    STUDENT_TIMETABLE_ENDPOINTS.GET_STUDENT_TIMETABLE
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: [...], code: 200 }
  // We need: { success: true, message: "...", data: [...] }
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data || [], // Array of timetable slots from API response
  };

  return result;
}

/**
 * Exam Mark Interface
 * Defines structure for individual subject marks in an exam
 * Based on actual API response structure
 */
export interface ExamMark {
  marks_id: number;
  subject_name: string;
  subject_type: string; // e.g., "Practical", "Theory"
  total_marks: number;
  passing_marks: number;
  obtained_marks: number;
  teacher_review: string | null;
  grade: string;
}

/**
 * Exam Result Detail Interface
 * Defines structure for overall exam result information
 * Based on actual API response structure
 */
export interface ExamResultDetail {
  result_id: number;
  exam_id: number;
  exam_name: string;
  class_name: string;
  student_name: string;
  exam_date: string; // Format: "2025/07/16"
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  session_year: string;
}

/**
 * Exam Result Interface
 * Combines exam result with subject marks
 * Based on actual API response structure
 */
export interface ExamResult {
  result: ExamResultDetail;
  exam_marks: ExamMark[];
}

/**
 * Get Exam Marks Response Interface
 * Defines structure for API response
 * Based on actual API response structure
 */
export interface GetExamMarksRequest {
  session_year_id?: number | null;
  semester_id?: number | null;
}

export interface GetExamMarksResponse {
  success: boolean;
  message: string;
  data?: ExamResult[]; // Array of exam results
}

/**
 * Get Exam Marks Function
 *
 * This function fetches the student's exam marks from the API.
 * Returns all exam results with subject-wise marks, grades, and overall percentage.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getExamMarks(
  request: GetExamMarksRequest = {}
): Promise<GetExamMarksResponse> {
  const params: Record<string, number | null> = {};
  if (request.session_year_id) {
    params.session_year_id = request.session_year_id;
  }
  if (request.semester_id) {
    params.semester_id = request.semester_id;
  }

  const response = await studentApi.get(EXAM_ENDPOINTS.GET_EXAM_RESULT, {
    params,
  });

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: [...], code: 200 }
  // We need: { success: true, message: "...", data: [...] }
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data || [], // Array of exam results from API response
  };

  return result;
}

// ============================================================================
// PDF RESULT API FUNCTIONS
// ============================================================================

export interface GetStudentExamResultPdfRequest {
  exam_id: number;
  student_id: number;
}

// Define a flexible interface for the PDF data since exact structure is complex
// but we know it contains school, student, and result info
export interface StudentExamResultPdfData {
  pdf: string;
  [key: string]: unknown;
}

export interface GetStudentExamResultPdfResponse {
  success: boolean;
  message: string;
  data?: StudentExamResultPdfData;
}

/**
 * Get Student Exam Result PDF Data Function
 * 
 * Fetches the complete data needed for generating the result PDF.
 * This ensures the PDF matches the backend data exactly.
 */

export async function getStudentExamResultPdf(
  request: GetStudentExamResultPdfRequest,
  token?: string
): Promise<GetStudentExamResultPdfResponse> {
  const config: { params: Record<string, number>; headers: Record<string, string> } = {
    params: {
      exam_id: request.exam_id,
      student_id: request.student_id
    },
    headers: {
      'Accept': 'application/json' // Explicitly request JSON to avoid HTML redirects
    }
  };

  // If token is explicitly provided, override the Authorization header
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await studentApi.get(EXAM_ENDPOINTS.GET_STUDENT_EXAM_RESULT_PDF, config);

  const apiResponse = response.data;

  // Handle case where apiResponse might be the actual data if strictly JSON
  // but typically it's wrapped in { success, data, ... } or { error, message, ... }
  // We normalize it here
  return {
    success: !apiResponse.error && (apiResponse.success !== false),
    message: apiResponse.message || 'Success',
    data: apiResponse.data || apiResponse // Fallback if the root object IS the data
  };
}

// ============================================================================
// ONLINE EXAM API FUNCTIONS
// ============================================================================

/**
 * Online Exam List Item Interface
 * Represents a single online exam in the list based on API response
 */
export interface OnlineExamListItem {
  id: number;
  class_section_id: number;
  class_subject_id: number;
  title: string;
  exam_key: number;
  duration: number;
  start_date: string; // Format: "28-10-2025 10:52"
  end_date: string; // Format: "29-10-2025 10:52"
  session_year_id: number;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  class_section_with_medium: string | null;
  subject_with_name: string; // Format: "AI - Theory"
  total_marks: number;
  exam_status_name: string; // Format: "On Going"
  start_date_iso: string; // Format: "2025-10-28 10:52:00"
  end_date_iso: string; // Format: "2025-10-29 10:52:00"
  class_subject: {
    id: number;
    class_id: number;
    subject_id: number;
    type: string; // Format: "Compulsory"
    elective_subject_group_id: number | null;
    semester_id: number | null;
    virtual_semester_id: number;
    school_id: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    subject_with_name: string;
    subject: {
      id: number;
      name: string;
      code: string;
      bg_color: string;
      image: string;
      medium_id: number;
      type: string;
      school_id: number;
      deleted_at: string | null;
      name_with_type: string;
    };
  };
  question_choice: Array<{
    id: number;
    online_exam_id: number;
    marks: number;
  }>;
}

/**
 * Online Exam Result List Item Interface
 * Represents a single submitted online exam result in the list
 */
export interface OnlineExamResultListItem {
  id: number; // online_exam_id
  title: string;
  total_marks: number;
  obtained_marks: number;
  exam_submitted_date: string; // ISO date string
  class_subject_id: number;
  subject_with_name: string;
}

/**
 * Online Exam Result List Response Interface
 */
export interface GetOnlineExamResultListResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: OnlineExamResultListItem[];
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Get Online Exam Result List Request Interface
 */
export interface GetOnlineExamResultListRequest {
  class_subject_id: number | null;
  session_year_id?: number | null;
  semester_id?: number | null;
}

/**
 * Get Online Exam Result List Function
 * Fetches submitted online exam results for a specific subject or all subjects
 */
export async function getOnlineExamResultList(
  request: GetOnlineExamResultListRequest
): Promise<GetOnlineExamResultListResponse> {
  const params: Record<string, number | null> = {};
  if (request.class_subject_id !== null) {
    params.class_subject_id = request.class_subject_id;
  }
  if (request.session_year_id) {
    params.session_year_id = request.session_year_id;
  }
  if (request.semester_id) {
    params.semester_id = request.semester_id;
  }

  const response = await studentApi.get(
    EXAM_ENDPOINTS.GET_ONLINE_EXAM_RESULT_LIST,
    { params }
  );

  const apiResponse = response.data;
  return {
    success: !apiResponse.error,
    message: apiResponse.message,
    data: apiResponse.data,
  };
}

/**
 * Online Exam List Response Interface
 * Contains paginated list of online exams
 */
export interface GetOnlineExamListResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: OnlineExamListItem[];
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Get Online Exam List Request Interface
 * Parameters for fetching online exam list
 */
export interface GetOnlineExamListRequest {
  class_subject_id: number | null; // The class subject ID (null for all subjects)
}

/**
 * Offline Exam List Item Interface
 * Represents a single offline exam from the API response
 */
export interface OfflineExamListItem {
  id: number;
  name: string;
  description: string;
  publish: number; // 0 or 1
  session_year: string;
  exam_starting_date: string; // Format: "DD-MM-YYYY"
  exam_ending_date: string; // Format: "DD-MM-YYYY"
  exam_status: string; // "1", "2", etc.
}

/**
 * Offline Exam List Response Interface
 * Contains the list of offline exams from API
 */
export interface GetOfflineExamListResponse {
  error: boolean;
  message: string;
  data: OfflineExamListItem[];
  code: number;
}

/**
 * Offline Exam List Request Interface
 * Request parameters for getting offline exam list
 */
export interface GetOfflineExamListRequest {
  status: number; // Status filter (3 for all offline exams)
}

/**
 * Get Online Exam List Function
 *
 * Fetches the list of online exams for a specific subject or all subjects.
 * Returns paginated exam data with marks and submission dates.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getOnlineExamList(
  request: GetOnlineExamListRequest
): Promise<GetOnlineExamListResponse> {
  // Build query parameters - include class_subject_id if it's not null
  // If null, pass 0 to get all subjects (based on API behavior)
  const params: Record<string, number> = {};
  if (request.class_subject_id !== null) {
    // Pass the specific subject ID
    params.class_subject_id = request.class_subject_id;
  } else {
    // Pass 0 for all subjects (as shown in the API curl example)
    params.class_subject_id = 0;
  }

  // Make GET request with class_subject_id parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(EXAM_ENDPOINTS.GET_ONLINE_EXAM_LIST, {
    params,
  });

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains paginated exam list
  };

  return result;
}

/**
 * Get Offline Exam List Function
 *
 * Fetches the list of offline exams with status filter.
 * Returns exam data with dates and status information.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getOfflineExamList(
  request: GetOfflineExamListRequest
): Promise<GetOfflineExamListResponse> {
  // Build query parameters with status filter
  const params: Record<string, number> = {
    status: request.status,
  };

  // Make GET request with status parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(EXAM_ENDPOINTS.GET_EXAM_LIST, {
    params,
  });

  const apiResponse = response.data;

  return apiResponse;
}

/**
 * Online Exam Question Data Interface
 * Represents question data in exam results
 */
export interface OnlineExamQuestionData {
  question_id: number;
  marks: number;
}

/**
 * Online Exam Result Interface
 * Represents detailed exam result data
 */
export interface OnlineExamResult {
  online_exam_name: string;
  subject_name: string;
  exam_submitted_date: string; // Format: "2025-10-15T09:54:00.000000Z"
  total_questions: number;
  correct_answers: {
    total_questions: number;
    question_data: OnlineExamQuestionData[];
  };
  in_correct_answers: {
    total_questions: number;
    question_data: OnlineExamQuestionData[];
  };
  total_obtained_marks: number;
  total_marks: number;
}

/**
 * Get Online Exam Result Request Interface
 * Parameters for fetching online exam details
 */
export interface GetOnlineExamResultRequest {
  online_exam_id: number; // Required - The online exam ID
  session_year_id?: number | null;
}

/**
 * Get Online Exam Result Response Interface
 * Contains detailed exam result data
 */
export interface GetOnlineExamResultResponse {
  success: boolean;
  message: string;
  data?: OnlineExamResult;
}

/**
 * Get Online Exam Result Function
 *
 * Fetches detailed results for a specific online exam.
 * Returns question-wise marks, correct/incorrect answers, and totals.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getOnlineExamResult(
  request: GetOnlineExamResultRequest
): Promise<GetOnlineExamResultResponse> {
  const params: Record<string, number | null> = {
    online_exam_id: request.online_exam_id,
  };

  if (request.session_year_id) {
    params.session_year_id = request.session_year_id;
  }

  // Make GET request with online_exam_id as query parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(EXAM_ENDPOINTS.GET_ONLINE_EXAM_RESULT, {
    params,
  });

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains detailed exam result
  };

  return result;
}

// ============================================================================
// EXAM DETAILS API FUNCTIONS
// ============================================================================

/**
 * Exam Details Request Interface
 * Parameters for fetching exam details
 */
export interface GetExamDetailsRequest {
  exam_id: number; // Required - The exam ID
}

/**
 * Subject Information Interface
 * Defines structure for subject data in exam details
 */
export interface ExamDetailsSubject {
  id: number;
  class_subject_id: number;
  name: string;
  bg_color: string;
  image: string;
  type: string; // "Theory" or "Practical"
}

/**
 * Exam Timetable Item Interface
 * Defines structure for individual exam timetable items
 */
export interface ExamTimetableItem {
  exam_timetable_id: number;
  total_marks: number;
  passing_marks: number;
  date: string; // Format: "DD-MM-YYYY"
  starting_time: string; // Format: "HH:MM"
  ending_time: string; // Format: "HH:MM"
  subject: ExamDetailsSubject;
}

/**
 * Exam Details Response Interface
 * Response structure for exam details API
 */
export interface GetExamDetailsResponse {
  error: boolean;
  message: string;
  data: ExamTimetableItem[];
  code: number;
}

/**
 * Get Exam Details
 * Fetches detailed exam timetable for a specific exam
 *
 * @param request - The exam details request parameters
 * @returns Promise<GetExamDetailsResponse> - The exam details response
 *
 * API Endpoint: GET /student/get-exam-details
 * Query Parameters: exam_id (required)
 *
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getExamDetails(
  request: GetExamDetailsRequest
): Promise<GetExamDetailsResponse> {
  // Make GET request with exam_id as query parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(EXAM_ENDPOINTS.GET_EXAM_DETAILS, {
    params: {
      exam_id: request.exam_id,
    },
  });

  // Return the API response directly as it matches our expected structure
  const result: GetExamDetailsResponse = response.data;

  return result;
}

/**
 * Core Subject Interface
 * Defines structure for core subjects in the API response
 */
interface CoreSubjectResponse {
  id: number;
  name: string;
  code: string | null;
  bg_color: string;
  image: string | null;
  medium_id: number;
  type: string; // e.g., "Theory", "Practical"
  school_id: number;
  deleted_at: string | null;
  class_subject_id: number;
  name_with_type: string; // Combined subject name with type (e.g., "AI - Theory")
  pivot: {
    class_id: number;
    subject_id: number;
    semester_id: number | null;
  };
}

/**
 * Elective Subject Interface
 * Defines structure for elective subjects in the API response
 * Note: Elective subjects have a nested structure
 */
interface ElectiveSubjectResponse {
  class_subject_id: number;
  class_subject: {
    id: number;
    class_id: number;
    subject_id: number;
    type: string; // "Elective"
    elective_subject_group_id: number;
    semester_id: number | null;
    virtual_semester_id: number;
    school_id: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    subject_with_name: string;
    subject: {
      id: number;
      name: string;
      code: string | null;
      bg_color: string;
      image: string | null;
      medium_id: number;
      type: string; // e.g., "Theory", "Practical"
      school_id: number;
      deleted_at: string | null;
      name_with_type: string; // Combined subject name with type (e.g., "IOT - Theory")
    };
  };
}

/**
 * Unified Subject Interface
 * This is the normalized structure we use in the frontend
 */
export interface Subject {
  id: number;
  class_subject_id: number; // ID used for filtering assignments and other APIs
  name: string;
  code: string | null;
  bg_color: string;
  image: string | null;
  type: string; // e.g., "Theory", "Practical"
  name_with_type: string; // Combined subject name with type (e.g., "AI - Theory")
  subject_type: 'core' | 'elective'; // Whether it's a core or elective subject
  elective_subject_group_id?: number; // Optional: Group ID for elective subjects
  semester_id: number | null; // Semester this subject belongs to (null if not semester-specific)
  virtual_semester_id?: number; // Virtual semester number (1 or 2) for display purposes
}

/**
 * Get Subjects Response Interface
 * Defines structure for API response
 * Based on actual API response structure
 */
export interface GetSubjectsResponse {
  success: boolean;
  message: string;
  core_subjects?: Subject[]; // Array of core subjects
  elective_subjects?: Subject[]; // Array of elective subjects
  elective_key_exists?: boolean; // Flag to indicate if elective_subject key exists in API response
}

/**
 * Get Student Subjects Function
 *
 * This function fetches the student's subjects from the API.
 * Returns both core and elective subjects with their details.
 * Normalizes the different structures of core and elective subjects into a unified format.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getStudentSubjects(): Promise<GetSubjectsResponse> {
  // Make GET request to fetch subjects
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(SUBJECT_ENDPOINTS.GET_SUBJECTS);

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: { core_subject: [...], elective_subject: [...] }, code: 200 }
  const apiResponse = response.data;

  // Normalize core subjects - they have a simpler structure
  const coreSubjects: Subject[] =
    apiResponse.data?.core_subject?.map((subject: CoreSubjectResponse) => ({
      id: subject.id,
      class_subject_id: subject.class_subject_id,
      name: subject.name,
      code: subject.code,
      bg_color: subject.bg_color,
      image: subject.image,
      type: subject.type,
      name_with_type: subject.name_with_type,
      subject_type: 'core' as const,
      semester_id: subject.pivot?.semester_id ?? null,
    })) || [];

  // Normalize elective subjects - they have a nested structure
  // We need to extract the subject data from class_subject.subject
  const electiveSubjects: Subject[] =
    apiResponse.data?.elective_subject?.map(
      (item: ElectiveSubjectResponse) => ({
        id: item.class_subject.subject.id,
        class_subject_id: item.class_subject_id,
        name: item.class_subject.subject.name,
        code: item.class_subject.subject.code,
        bg_color: item.class_subject.subject.bg_color,
        image: item.class_subject.subject.image,
        type: item.class_subject.subject.type,
        name_with_type: item.class_subject.subject.name_with_type,
        subject_type: 'elective' as const,
        elective_subject_group_id: item.class_subject.elective_subject_group_id,
        semester_id: item.class_subject.semester_id ?? null,
       
      })
    ) || [];

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    core_subjects: coreSubjects, // Normalized array of core subjects
    elective_subjects: electiveSubjects, // Normalized array of elective subjects
    elective_key_exists: apiResponse.data && Object.prototype.hasOwnProperty.call(apiResponse.data, 'elective_subject'),
  };

  return result;
}

/**
 * Assignment File Interface
 * Defines structure for files attached to assignments
 * Supports multiple file types: images, documents, videos, and links
 */
export interface AssignmentFile {
  id: number;
  modal_type: string; // e.g., "App\\Models\\Assignment"
  modal_id: number;
  file_name: string;
  file_thumbnail: string;
  type: string; // "1" = File Upload, "2" = YouTube Video, "3" = Uploaded Video, "4" = Other Link
  file_url: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file_extension: string;
  type_detail: string; // Human-readable type (e.g., "File Upload", "Other Link")
  youtube_url_action: {
    file_url: string;
    embed_url: string;
    img: string;
  } | null;
}

/**
 * Assignment Subject Interface
 * Defines structure for subject information in assignments
 */
export interface AssignmentSubject {
  id: number;
  name: string;
  code: string;
  bg_color: string;
  image: string;
  medium_id: number;
  type: string; // e.g., "Practical", "Theory"
  school_id: number;
  deleted_at: string | null;
  name_with_type: string; // e.g., "AI - Practical"
}

/**
 * Assignment Class Subject Interface
 * Defines structure for class subject information
 */
export interface AssignmentClassSubject {
  id: number;
  class_id: number;
  subject_id: number;
  type: string; // e.g., "Compulsory", "Elective"
  elective_subject_group_id: number | null;
  semester_id: number | null;
  virtual_semester_id: number;
  school_id: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  subject_with_name: string;
  subject: AssignmentSubject;
}

/**
 * Assignment Submission Interface
 * Defines structure for submission data (null if not submitted)
 */
export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  session_year_id: number;
  subject_id: number;
  feedback: string | null;
  points: number | null;
  status: number; // 0 = Pending, 1 = Accepted, 2 = Rejected, 3 = Resubmitted
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file: AssignmentFile[];
}

/**
 * Assignment Interface
 * Defines structure for individual assignment from API
 */
export interface Assignment {
  id: number;
  class_section_id: number;
  class_subject_id: number;
  name: string;
  instructions: string;
  due_date: string; // Format: "DD-MM-YYYY HH:mm"
  points: number | null;
  resubmission: number; // 0 = No, 1 = Yes
  extra_days_for_resubmission: number | null;
  session_year_id: number;
  school_id: number;
  created_by: number;
  edited_by: number | null;
  created_at: string; // Format: "DD-MM-YYYY HH:mm"
  updated_at: string;
  created_by_teacher: string;
  edited_by_teacher: string | null;
  due_date_original: string; // Format with AM/PM: "DD-MM-YYYY hh:mm AM/PM"
  file: AssignmentFile[];
  class_subject: AssignmentClassSubject;
  submission: AssignmentSubmission | null; // null if not submitted
}

/**
 * Get Assignments Request Interface
 * Query parameters for filtering assignments
 */
export interface GetAssignmentsRequest {
  is_submitted?: number; // 0 = Not submitted (Assigned), 1 = Submitted
  class_subject_id?: number; // Filter by class subject ID (not subject_id)
  page?: number; // Page number for pagination
  search?: string; // Search term to filter assignments by name, instructions, or subject
  sort?: string; // Sort parameter: assigned_latest, assigned_oldest, due_latest, due_oldest
}

/**
 * Get Assignments Response Interface
 * Defines structure for API response with pagination
 */
export interface GetAssignmentsResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: Assignment[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

/**
 * Get Student Assignments Function
 *
 * This function fetches the student's assignments from the API.
 * Can filter by submission status and subject.
 * Returns paginated assignment data with files, subjects, and submission status.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getStudentAssignments(
  params: GetAssignmentsRequest = {}
): Promise<GetAssignmentsResponse> {
  // Make GET request to fetch assignments with query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(ASSIGNMENT_ENDPOINTS.GET_ASSIGNMENTS, {
    params,
  });

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: { pagination data with assignments }, code: 200 }
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Paginated assignment data from API response
  };

  return result;
}

/**
 * Submit Assignment Request Interface
 * Parameters for submitting an assignment
 */
export interface SubmitAssignmentRequest {
  assignment_id: string; // Assignment ID as string
  files?: File[]; // Array of files to upload (documents, images, etc.)
  link?: string; // Optional link submission
}

/**
 * Submit Assignment Response Interface
 * Defines structure for API response
 */
export interface SubmitAssignmentResponse {
  success: boolean;
  message: string;
  data?: AssignmentSubmission; // The newly created submission
}

/**
 * Submit Assignment Function
 *
 * This function submits an assignment with file attachments.
 * Supports multiple file uploads (documents, images, PDFs, etc.).
 * Uses FormData to handle file uploads.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function submitAssignment(
  request: SubmitAssignmentRequest
): Promise<SubmitAssignmentResponse> {
  // Create FormData for file upload support
  const formData = new FormData();

  // Add assignment ID
  formData.append('assignment_id', request.assignment_id);

  // Add files using array format files[]
  // API expects files[] array format for multiple file uploads
  if (request.files && request.files.length > 0) {
    request.files.forEach((file) => {
      formData.append('files[]', file);
    });
  }

  // Add link if present
  if (request.link) {
    formData.append('add_url', request.link);
  }

  // Make POST request with FormData
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  // Note: Don't set Content-Type header manually - axios will automatically set it
  // with the correct boundary for multipart/form-data
  const response = await studentApi.post(
    ASSIGNMENT_ENDPOINTS.SUBMIT_ASSIGNMENT,
    formData
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // The newly created submission
  };

  return result;
}

/**
 * Delete Assignment Submission Request Interface
 * Parameters for deleting an assignment submission
 */
export interface DeleteAssignmentSubmissionRequest {
  assignment_submission_id: string; // Submission ID as string
}

/**
 * Delete Assignment Submission Response Interface
 * Defines structure for API response
 */
export interface DeleteAssignmentSubmissionResponse {
  success: boolean;
  message: string;
}

/**
 * Delete Assignment Submission Function
 *
 * This function deletes an assignment submission by its ID.
 * Used when a student wants to remove their submitted work.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function deleteAssignmentSubmission(
  request: DeleteAssignmentSubmissionRequest
): Promise<DeleteAssignmentSubmissionResponse> {
  // Create FormData object to match the curl command format
  const formData = new FormData();
  formData.append('assignment_submission_id', request.assignment_submission_id);

  // Make POST request with FormData
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    ASSIGNMENT_ENDPOINTS.DELETE_ASSIGNMENT_SUBMISSION,
    formData
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
  };

  return result;
}

// ============================================
// ANNOUNCEMENTS / NOTICEBOARD API
// ============================================

/**
 * File attachment interface for announcements
 * Represents file attachments that may be included with an announcement
 */
export interface AnnouncementFile {
  id: number;
  modal_type: string;
  modal_id: number;
  file_name: string;
  file_thumbnail: string;
  type: string; // "1" for File Upload, "4" for Other Link
  file_url: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file_extension: string;
  type_detail: string; // "File Upload" or "Other Link"
  youtube_url_action: string | null;
}

/**
 * Single Announcement Interface
 * Represents an announcement from the noticeboard
 */
export interface Announcement {
  id: number;
  title: string;
  description: string;
  session_year_id: number;
  school_id: number;
  created_at: string; // Format: "25-09-2025 12:34"
  updated_at: string;
  file: AnnouncementFile[]; // Array of file attachments
  announcement_class: {
    id: number;
    announcement_id: number;
    class_section_id: number;
    class_subject_id: number | null;
    school_id: number;
  }[];
}

/**
 * Announcements Request Interface
 * Parameters for fetching announcements
 */
export interface GetAnnouncementsRequest {
  type: 'class' | 'general'; // Type of announcements to fetch
  page?: number; // Optional page number for pagination
}

/**
 * Pagination metadata for announcements
 */
export interface AnnouncementsPagination {
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}

/**
 * Announcements Response Interface
 * Defines structure for API response
 */
export interface GetAnnouncementsResponse {
  success: boolean;
  message: string;
  data: {
    data: Announcement[]; // Array of announcements
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    // Include other pagination fields as needed
  } & AnnouncementsPagination;
}

/**
 * Get Announcements Function
 *
 * This function fetches announcements/noticeboard items for the student.
 * Supports filtering by type (class or general) and pagination.
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const announcements = await getAnnouncements({ type: 'class', page: 1 });
 */
export async function getAnnouncements(
  request: GetAnnouncementsRequest
): Promise<GetAnnouncementsResponse> {
  // Build query parameters
  const params: Record<string, string | number> = {
    type: request.type,
  };

  // Add page parameter if provided
  if (request.page) {
    params.page = request.page;
  }

  // Make GET request with query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    NOTICE_BOARD_ENDPOINTS.GET_NOTICE_BOARD,
    {
      params,
    }
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains paginated announcements
  };

  return result;
}

/**
 * ================================================================================
 * REPORT API FUNCTIONS
 * ================================================================================
 */

/**
 * Assignment Report Item Interface
 * Represents a single assignment in the report with points
 */
export interface AssignmentReportItem {
  assignment_id: number;
  assignment_name: string;
  obtained_points: number;
  total_points: number;
}

/**
 * Assignments Report Request Interface
 * Parameters needed to fetch assignments report
 */
export interface GetAssignmentsReportRequest {
  class_subject_id?: number;
}

/**
 * Assignments Report Response Interface
 * Contains all assignment statistics and paginated submitted assignments
 */
export interface GetAssignmentsReportResponse {
  success: boolean;
  message: string;
  data?: {
    assignments: number; // Total number of assignments
    submitted_assignments: number; // Number of submitted assignments
    unsubmitted_assignments: number; // Number of pending assignments
    total_points: number; // Total points across all assignments
    total_obtained_points: number; // Total points obtained
    percentage: string; // Percentage score
    submitted_assignment_with_points_data: {
      current_page: number;
      data: AssignmentReportItem[]; // Array of submitted assignments with points
      from: number;
      to: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
}

/**
 * Get Assignments Report Function
 *
 * Fetches assignment statistics and report for a specific subject.
 * Shows total assignments, submission status, points, and detailed list.
 * Used in the report page to display assignment performance.
 */
export async function getAssignmentsReport(
  request: GetAssignmentsReportRequest
): Promise<GetAssignmentsReportResponse> {
  // Make GET request with class_subject_id as query parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    REPORT_ENDPOINTS.GET_ASSIGNMENTS_REPORT,
    {
      params: {
        ...(request.class_subject_id ? { class_subject_id: request.class_subject_id } : {}),
      },
    }
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains all assignment statistics
  };

  return result;
}

/**
 * Online Exam Report Item Interface
 * Represents a single exam in the report with marks
 */
export interface OnlineExamReportItem {
  online_exam_id: number;
  title: string; // Exam title
  obtained_marks: string; // Marks obtained (string from API)
  total_marks: string; // Total marks (string from API)
}

/**
 * Online Exam Report Request Interface
 * Parameters needed to fetch online exam report
 */
export interface GetOnlineExamReportRequest {
  class_subject_id: number; // Required - The class subject ID from route params
}

/**
 * Online Exam Report Response Interface
 * Contains all online exam statistics and paginated exam list
 */
export interface GetOnlineExamReportResponse {
  success: boolean;
  message: string;
  data?: {
    total_exams: number; // Total number of online exams
    attempted: number; // Number of attempted exams
    missed_exams: number; // Number of missed exams
    total_marks: string; // Total marks across all exams (string from API)
    total_obtained_marks: string; // Total marks obtained (string from API)
    percentage: string; // Percentage score
    exam_list: {
      current_page: string;
      data: OnlineExamReportItem[]; // Array of exams with marks
      from: string;
      to: string;
      per_page: string;
      total: string;
      last_page: string;
    };
  };
}

/**
 * Get Online Exam Report Function
 *
 * Fetches online exam statistics and report for a specific subject.
 * Shows total exams, completion status, points, and detailed list.
 * Used in the report page to display exam performance.
 */
export async function getOnlineExamReport(
  request: GetOnlineExamReportRequest
): Promise<GetOnlineExamReportResponse> {
  // Make GET request with class_subject_id as query parameter
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    REPORT_ENDPOINTS.GET_ONLINE_EXAM_REPORT,
    {
      params: {
        class_subject_id: request.class_subject_id,
      },
    }
  );

  // Log the raw API response for debugging
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains all exam statistics
  };

  return result;
}

// ========================
// HOLIDAYS API
// ========================

/**
 * Holiday Interface
 * Represents a single holiday from the API
 */
export interface Holiday {
  id: number; // Holiday unique ID
  date: string; // Date in YYYY/MM/DD format (original format from API)
  title: string; // Holiday title
  description: string; // Holiday description
  school_id: number; // School ID
  created_at: string; // Creation date
  updated_at: string; // Last update date
  default_date_format: string; // Date in DD-MM-YYYY format
  dmyFormat: string; // Date in DD-MM-YYYY format (preferred format for display)
}

/**
 * Get Holidays Response Interface
 * Contains the list of all holidays
 */
export interface GetHolidaysResponse {
  success: boolean; // Indicates if the request was successful
  message: string; // Response message
  data?: Holiday[]; // Array of holidays
}

/**
 * Get Holidays Function
 *
 * Fetches all holidays for the school.
 * No parameters required as it fetches all holidays.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 */
export async function getHolidays(): Promise<GetHolidaysResponse> {
  // Make GET request to fetch holidays
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(HOLIDAY_ENDPOINTS.GET_HOLIDAYS);

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Array of holidays
  };

  return result;
}

// ============================================================================
// SESSION YEARS API FUNCTIONS
// ============================================================================

/**
 * Session Year Data Structure
 * Based on API response from /session-years endpoint
 */
export interface SessionYear {
  id: number;
  name: string;
  default: number;
  start_date: string;
  end_date: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Session Years API Response
 * Standard API response structure for session years
 */
export interface GetSessionYearsResponse {
  success: boolean;
  message: string;
  data: SessionYear[];
}

/**
 * Get Session Years
 *
 * Fetches all available session years for the school.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 */
export async function getSessionYears(): Promise<GetSessionYearsResponse> {
  // Make GET request to fetch session years
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    SESSION_YEARS_ENDPOINTS.GET_SESSION_YEARS
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Array of session years
  };

  return result;
}

// ============================================================================
// SEMESTER API FUNCTIONS
// ============================================================================

export interface Semester {
  id: number;
  name: string;
  session_year_id: number;
  current: boolean;
}

export interface GetSemestersResponse {
  success: boolean;
  message: string;
  data: Semester[];
}

export async function getSemesters(sessionYearId: number): Promise<GetSemestersResponse> {
  const response = await studentApi.get(SEMESTER_ENDPOINTS.GET_SEMESTERS, {
    params: { session_year_id: sessionYearId },
  });
  const apiResponse = response.data;
  return {
    success: !apiResponse.error,
    message: apiResponse.message,
    data: apiResponse.data || [],
  };
}

// ============================================================================
// GALLERY API FUNCTIONS
// ============================================================================

/**
 * Gallery File Data Structure
 * Based on API response from /gallery endpoint
 */
export interface GalleryFile {
  id: number;
  modal_type: string;
  modal_id: number;
  file_name: string;
  file_thumbnail: string;
  type: string;
  file_url: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file_extension: string;
  type_detail: string;
  youtube_url_action: {
    embed_url: string;
    file_url: string;
    img: string;
  } | null;
}

/**
 * Gallery Data Structure
 * Based on API response from /gallery endpoint
 * API now returns separate videos and photos arrays instead of a single file array
 */
export interface Gallery {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  session_year_id: number;
  school_id: number;
  created_at: string;
  updated_at: string;
  file_extension: string;
  total_photos: number;
  total_videos: number;
  // API now returns separate arrays for videos and photos
  videos: GalleryFile[];
  photos: GalleryFile[];
  // Keep file for backward compatibility (deprecated - use videos and photos instead)
  file?: GalleryFile[];
}

/**
 * Gallery API Response
 * Standard API response structure for gallery
 */
export interface GetGalleryResponse {
  success: boolean;
  message: string;
  data: Gallery[];
}

/**
 * Get Gallery
 *
 * Fetches gallery images for a specific session year with pagination support.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 *
 * @param sessionYearId - The session year ID to fetch gallery for
 * @param offset - The offset for pagination (default: 0)
 * @param limit - The limit for pagination (default: 5)
 */
export async function getGallery(
  sessionYearId: number,
  offset: number = 0,
  limit: number = 5
): Promise<GetGalleryResponse> {
  // Make GET request to fetch gallery with session year ID, offset, and limit
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(GALLERY_ENDPOINTS.GET_GALLERY, {
    params: {
      session_year_id: sessionYearId,
      offset: offset,
      limit: limit,
    },
  });

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Array of gallery items
  };

  return result;
}

// ============================================================================
// GALLERY DETAILS API FUNCTIONS
// ============================================================================

/**
 * Gallery Details Data Structure
 * Based on API response from /gallery endpoint with gallery_id parameter
 * API now returns separate videos and photos arrays instead of a single file array
 */
export interface GalleryDetails {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  session_year_id: number;
  school_id: number;
  created_at: string;
  updated_at: string;
  file_extension: string;
  // API now returns separate arrays for videos and photos
  videos: GalleryFile[];
  photos: GalleryFile[];
  // Keep file for backward compatibility (deprecated - use videos and photos instead)
  file?: GalleryFile[];
}

/**
 * Gallery Details API Response
 * Standard API response structure for gallery details
 */
export interface GetGalleryDetailsResponse {
  success: boolean;
  message: string;
  data: GalleryDetails;
}

/**
 * Get Gallery Details
 *
 * Fetches detailed gallery information for a specific gallery ID and session year with pagination support.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 *
 * @param galleryId - The gallery ID to fetch details for
 * @param sessionYearId - The session year ID
 * @param offset - The offset for pagination (default: 0)
 * @param limit - The limit for pagination (default: 5)
 */
export async function getGalleryDetails(
  galleryId: number,
  sessionYearId: number,
  offset: number = 0,
  limit: number = 5
): Promise<GetGalleryDetailsResponse> {
  // Make GET request to fetch gallery details with gallery ID, session year ID, offset, and limit
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(GALLERY_ENDPOINTS.GET_GALLERY, {
    params: {
      gallery_id: galleryId,
      session_year_id: sessionYearId,
      offset: offset,
      limit: limit,
    },
  });

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Single gallery details object
  };

  return result;
}

// ============================================================================
// GUARDIAN API FUNCTIONS
// ============================================================================

/**
 * Guardian Data Structure
 * Based on API response from /student/guradian-details endpoint
 */
export interface Guardian {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  gender: string;
  image: string;
  dob: string | null;
  current_address: string | null;
  permanent_address: string | null;
  occupation: string | null;
  status: number;
  reset_request: number;
  fcm_id: string;
  school_id: number;
  language: string;
  email_verified_at: string | null;
  two_factor_enabled: number;
  two_factor_secret: string | null;
  two_factor_expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  full_name: string;
  school_names: string;
  role: string;
}

/**
 * Guardian Details API Response
 * Standard API response structure for guardian details
 */
export interface GetGuardianDetailsResponse {
  success: boolean;
  message: string;
  data?: {
    guardian: Guardian;
  };
}

/**
 * Get Guardian Details Function
 *
 * Fetches guardian details for the logged-in student.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 */
export async function getGuardianDetails(): Promise<GetGuardianDetailsResponse> {
  // Make GET request to fetch guardian details
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    GUARDIAN_ENDPOINTS.GET_GUARDIAN_DETAILS
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains guardian details
  };

  return result;
}

// Settings API Functions
// Types for settings API
export interface SettingsRequest {
  type:
  | 'app_settings'
  | 'privacy_policy'
  | 'contact_us'
  | 'about_us'
  | 'terms_condition';
}

export interface SettingsResponse {
  error: boolean;
  message: string;
  data: string; // HTML content
  code: number;
}

/**
 * Get settings data from API
 * Fetches settings content based on type (privacy_policy, terms_condition, etc.)
 */
export async function getSettingsData(type: SettingsRequest['type']): Promise<{
  success: boolean;
  message: string;
  data: string;
}> {
  try {
    // Make API request to get settings data
    const response = await studentApi.get<SettingsResponse>(
      `${SETTINGS_ENDPOINTS.GET_SETTINGS}?type=${type}`
    );

    // Handle API response
    const apiResponse = response.data;

    const result = {
      success: !apiResponse.error, // Convert error to success
      message: apiResponse.message,
      data: apiResponse.data, // Contains HTML content
    };

    return result;
  } catch (error: unknown) {
    // Handle different types of errors
    if (error && typeof error === 'object' && 'response' in error) {
      // Server responded with error status
      const axiosError = error as { response: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response.data?.message || 'Server error occurred';
      return {
        success: false,
        message: errorMessage,
        data: '',
      };
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Request was made but no response received
      return {
        success: false,
        message: 'Network error - please check your connection',
        data: '',
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: 'An unexpected error occurred',
        data: '',
      };
    }
  }
}

/**
 * Get school settings data by type from API
 * Fetches school settings content based on type (privacy_policy, terms_condition, refund_cancellation)
 * Uses the /school-settings endpoint with type query parameter
 */
export async function getSchoolSettingsByType(
  type:
    | 'privacy_policy'
    | 'terms_condition'
    | 'refund_cancellation'
    | 'about_us'
    | 'contact_us'
): Promise<{
  success: boolean;
  message: string;
  data: string; // HTML content
}> {
  try {
    // Make API request to get school settings data by type
    // Use 'any' type for response since it might be a string (privacy) or object (about/contact)
    const response = await studentApi.get<{
      error: boolean;
      message: string;
      data:
        | string
        | {
            settings: {
              about_us_heading?: string;
              about_us_description?: string;
              about_us_image?: string;
              contact_us_heading?: string;
              contact_us_description?: string;
              school_address?: string;
              school_phone?: string;
              school_email?: string;
              [key: string]: unknown;
            };
          };
    }>(`${SETTINGS_ENDPOINTS.GET_SCHOOL_SETTINGS}?type=${type}`);

    // Handle API response
    const apiResponse = response.data;
    let htmlContent = '';

    // Check if data is an object with settings (for about_us and contact_us)
    if (
      apiResponse.data &&
      typeof apiResponse.data === 'object' &&
      'settings' in apiResponse.data
    ) {
      const settings = apiResponse.data.settings;

      if (type === 'about_us') {
        const title = settings.about_us_heading || 'About Us';
        const description = settings.about_us_description || '';
        const image = settings.about_us_image || '';

        htmlContent = `
          <div class="space-y-6">
            ${
              image
                ? `<img src="${image}" alt="${title}" class="w-full h-auto max-h-[400px] object-cover rounded-lg shadow-md mb-6" />`
                : ''
            }
            <div>
              <h2 class="text-2xl font-bold text-gray-800 mb-4">${title}</h2>
              <div class="text-gray-600 leading-relaxed whitespace-pre-line">${description}</div>
            </div>
          </div>
        `;
      } else if (type === 'contact_us') {
        const heading = settings.contact_us_heading || 'Contact Us';
        const description = settings.contact_us_description || '';
        const address = settings.school_address || '';
        const phone = settings.school_phone || '';
        const email = settings.school_email || '';

        // SVG Icons
        const locationIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
        const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1c-10.057 0-18.23-8.173-18.23-18.23z" /></svg>`;
        const emailIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;

        htmlContent = `
          <div class="space-y-8">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-gray-800 mb-2">${heading}</h2>
              <p class="text-gray-600">${description}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-gray-50 p-6 rounded-lg text-center flex flex-col items-center h-full">
                <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  ${locationIcon}
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">Address</h3>
                <p class="text-gray-600 whitespace-pre-line">${address}</p>
              </div>
              
              <div class="bg-gray-50 p-6 rounded-lg text-center flex flex-col items-center h-full">
                <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  ${phoneIcon}
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">Phone</h3>
                <p class="text-gray-600">${phone}</p>
              </div>
              
              <div class="bg-gray-50 p-6 rounded-lg text-center flex flex-col items-center h-full">
                <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  ${emailIcon}
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">Email</h3>
                <p class="text-gray-600">${email}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        // Fallback for other types if they happen to return object structure
        // Attempt to find the content in settings based on type key
        // e.g. settings.privacy_policy, settings.terms_condition
        if (type in settings) {
          htmlContent = String(settings[type]);
        } else {
          htmlContent = JSON.stringify(apiResponse.data);
        }
      }
    } else {
      // Standard string response
      htmlContent = apiResponse.data;
    }

    const result = {
      success: !apiResponse.error, // Convert error to success
      message: apiResponse.message,
      data: htmlContent, // Return processed HTML string
    };

    return result;
  } catch (error: unknown) {
    // Handle different types of errors
    if (error && typeof error === 'object' && 'response' in error) {
      // Server responded with error status
      const axiosError = error as { response: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response.data?.message || 'Server error occurred';
      return {
        success: false,
        message: errorMessage,
        data: '',
      };
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Request was made but no response received
      return {
        success: false,
        message: 'Network error - please check your connection',
        data: '',
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: 'An unexpected error occurred',
        data: '',
      };
    }
  }
}

// School Settings API Functions
// Types for school settings API
export interface SchoolSettingsResponse {
  error: boolean;
  message: string;
  data: {
    settings?: {
      footer_text?: string; // Footer text from school settings
      primary_color?: string; // Primary color from school settings (e.g., "#22577a")
      secondary_color?: string; // Secondary color from school settings (e.g., "#38a3a5")
      online_exam_terms_condition?: string; // Online exam rules HTML/text
      google_map_link?: string; // Google Maps embed src for the school location
      google_maps_api_key?: string; // Base64-encoded Google Maps API key
      [key: string]: unknown; // Allow other properties in the settings object
    };
    [key: string]: unknown; // Allow other properties in the data object
  };
  code: number;
}

export interface SystemBrandingResponse {
  error?: boolean;
  message?: string;
  data?: {
    vertical_logo?: string;
    horizontal_logo?: string;
    favicon?: string;
    student_web_background_image?: string;
    theme_color?: string;
    // Privacy policy and terms links from system settings
    student_parent_privacy_policy?: string;
    student_terms_condition?: string;
    student_web_maintenance?: string;
    [key: string]: unknown;
  };
  code?: number;
}

/**
 * Public branding endpoint used before authentication.
 * Optionally include school_code to get school-specific branding.
 */
export async function getSystemBranding(
  schoolCode?: string
): Promise<SystemBrandingResponse> {
  const baseUrl = API_BASE_URL || '';
  const url = schoolCode
    ? `${baseUrl}${SETTINGS_ENDPOINTS.GET_SYSTEM_BRANDING
    }?school_code=${encodeURIComponent(schoolCode)}`
    : `${baseUrl}${SETTINGS_ENDPOINTS.GET_SYSTEM_BRANDING}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch branding settings');
  }

  return response.json();
}

/**
 * Get school settings data from API
 * Fetches school settings including footer_text and other general settings
 * This endpoint returns all school settings data including footer text
 * The API response structure has settings nested inside data: data.settings.footer_text
 */
export async function getSchoolSettings(): Promise<{
  success: boolean;
  message: string;
  data: {
    settings?: {
      footer_text?: string;
      primary_color?: string;
      secondary_color?: string;
      online_exam_terms_condition?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}> {
  try {
    // Make API request to get school settings data
    const response = await studentApi.get<SchoolSettingsResponse>(
      SETTINGS_ENDPOINTS.GET_STUDENT_SCHOOL_SETTINGS
    );

    // Handle API response
    const apiResponse = response.data;

    const result = {
      success: !apiResponse.error, // Convert error to success
      message: apiResponse.message,
      data: apiResponse.data || {}, // Contains school settings including footer_text
    };

    return result;
  } catch (error: unknown) {
    // Handle different types of errors
    if (error && typeof error === 'object' && 'response' in error) {
      // Server responded with error status
      const axiosError = error as { response: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response.data?.message || 'Server error occurred';
      return {
        success: false,
        message: errorMessage,
        data: {},
      };
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Request was made but no response received
      return {
        success: false,
        message: 'Network error - please check your connection',
        data: {},
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: 'An unexpected error occurred',
        data: {},
      };
    }
  }
}

// ============================================================================
// SLIDER API FUNCTIONS
// ============================================================================

/**
 * Slider Data Structure
 * Based on API response from /student/web-sliders endpoint
 */
export interface Slider {
  id: number;
  image: string; // Full URL to the slider image
  link: string; // Optional link URL for the slider
  type: number; // Slider type (1 = image slider)
  school_id: number;
  created_at: string; // Date format: "26-07-2025 10:45"
  updated_at: string; // Date format: "26-07-2025 10:45"
}

/**
 * Get Sliders Response Interface
 * Standard API response structure for sliders
 */
export interface GetSlidersResponse {
  success: boolean;
  message: string;
  data?: Slider[]; // Array of slider images
}

/**
 * Get Sliders Function
 *
 * Fetches all slider images for the school.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 */
export async function getSliders(): Promise<GetSlidersResponse> {
  // Make GET request to fetch sliders
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(SLIDER_ENDPOINTS.GET_SLIDERS);

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data || [], // Array of sliders from API response
  };

  return result;
}

// Types for attendance data
export interface AttendanceRecord {
  id: number;
  class_section_id: number;
  student_id: number;
  session_year_id: number;
  type: number; // 1 = present, 0 = absent, 3 = holiday
  date: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  roll_number: number;
  get_date_original: string;
  date_format: string;
  user: StudentUser;
}

export interface Holiday {
  id: number;
  date: string; // Date in YYYY/MM/DD format (original format from API)
  title: string;
  description: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  default_date_format: string; // Date in DD-MM-YYYY format
  dmyFormat: string; // Date in DD-MM-YYYY format (preferred format for display)
}

export interface SessionYear {
  id: number;
  name: string;
  default: number;
  start_date: string;
  end_date: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AttendanceData {
  attendance: AttendanceRecord[];
  holidays: Holiday[];
  session_year: SessionYear;
}

export interface GetAttendanceResponse {
  error: boolean;
  message: string;
  data: AttendanceData;
  code: number;
}

/**
 * Get student attendance data for a specific month and year
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2025)
 * @returns Promise with attendance data
 */
export async function getAttendance(
  month: number,
  year: number
): Promise<GetAttendanceResponse> {
  // Make GET request to fetch attendance data
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(ATTENDANCE_ENDPOINTS.GET_ATTENDANCE, {
    params: {
      month,
      year,
    },
  });

  const apiResponse = response.data;

  const result = {
    error: apiResponse.error,
    message: apiResponse.message,
    data: apiResponse.data,
    code: apiResponse.code,
  };

  return result;
}

// ============================================================================
// CLASS SUBJECTS API FUNCTIONS
// ============================================================================

/**
 * Elective Subject Interface
 * Defines structure for elective subjects in the API response
 */
export interface ElectiveSubject {
  id: number;
  name: string;
  code: string;
  bg_color: string;
  image: string;
  medium_id: number;
  type: string;
  school_id: number;
  deleted_at: string | null;
  class_subject_id: number;
  name_with_type: string;
  pivot: {
    elective_subject_group_id: number;
    subject_id: number;
  };
}

/**
 * Elective Subject Group Interface
 * Defines structure for elective subject groups in the API response
 */
export interface ElectiveSubjectGroup {
  id: number;
  total_subjects: number;
  total_selectable_subjects: number;
  class_id: number;
  semester_id: number | null;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  subjects: ElectiveSubject[];
}

/**
 * Core Subject Interface
 * Defines structure for core subjects in the API response
 */
export interface CoreSubject {
  id: number;
  name: string;
  code: string;
  bg_color: string;
  image: string;
  medium_id: number;
  type: string;
  school_id: number;
  deleted_at: string | null;
  class_subject_id: number;
  name_with_type: string;
  pivot: {
    class_id: number;
    subject_id: number;
    semester_id: number | null;
  };
}

/**
 * Class Subjects API Response
 * Standard API response structure for class subjects
 */
export interface GetClassSubjectsResponse {
  success: boolean;
  message: string;
  data?: {
    core_subject: CoreSubject[];
    elective_subject_group: ElectiveSubjectGroup[];
  };
}

/**
 * Get Class Subjects Function
 *
 * Fetches class subjects including core subjects and elective subject groups.
 * This is used to determine if elective subject selection is needed.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 */
export async function getClassSubjects(): Promise<GetClassSubjectsResponse> {
  // Make GET request to fetch class subjects
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(SUBJECT_ENDPOINTS.GET_CLASS_SUBJECTS);

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains core subjects and elective subject groups
  };

  return result;
}

/**
 * Select Elective Subjects Request Interface
 * Parameters for saving elective subject selections
 */
export interface SelectElectiveSubjectsRequest {
  subject_group: Array<{
    id: number; // Elective subject group ID
    class_subject_id: number[]; // Array of selected class subject IDs
  }>;
}

/**
 * Select Elective Subjects Response Interface
 * Standard API response structure for selecting subjects
 */
export interface SelectElectiveSubjectsResponse {
  success: boolean;
  message: string;
}

/**
 * Select Elective Subjects Function
 *
 * Saves the student's elective subject selections to the database.
 * The API expects an array of subject groups with their selected class subject IDs.
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 */
export async function selectElectiveSubjects(
  request: SelectElectiveSubjectsRequest
): Promise<SelectElectiveSubjectsResponse> {
  // Make POST request to save elective subject selections
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    SUBJECT_ENDPOINTS.SELECT_SUBJECTS,
    request
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
  };

  return result;
}

// Types for lessons API
export interface LessonFile {
  id: number;
  modal_type: string;
  modal_id: number;
  file_name: string;
  file_thumbnail: string;
  type: string;
  file_url: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file_extension: string;
  type_detail: string;
  youtube_url_action: {
    embed_url: string;
    file_url: string;
    img: string;
  } | null;
}

export interface LessonTopic {
  id: number;
  lesson_id: number;
  name: string;
  description: string;
  school_id: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  name: string;
  description: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  class_section_with_medium: unknown;
  subject_with_name: unknown;
  topic: LessonTopic[];
  file: LessonFile[];
}

export interface LessonsResponse {
  error: boolean;
  message: string;
  data: Lesson[];
  code: number;
}

/**
 * Get lessons for a specific class subject
 * @param classSubjectId - The class subject ID
 * @returns Promise with lessons data
 */
export async function getLessons(
  classSubjectId: number
): Promise<LessonsResponse> {
  const response = await studentApi.get(LESSONS_ENDPOINTS.GET_LESSONS, {
    params: {
      class_subject_id: classSubjectId,
    },
  });

  return response.data;
}

// Types for lesson topics API
export interface LessonTopicFile {
  id: number;
  modal_type: string;
  modal_id: number;
  file_name: string;
  file_thumbnail: string;
  type: string; // "1" = File Upload, "2" = YouTube Video, "3" = Video Upload, "4" = Other Link
  file_url: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file_extension: string;
  type_detail: string; // Human-readable type (e.g., "File Upload", "Youtube Link", "Video Upload", "Other Link")
  youtube_url_action: {
    embed_url: string;
    file_url: string;
    img: string;
  } | null;
}

// Lesson object structure within topic data
export interface LessonTopicLesson {
  id: number;
  name: string;
  description: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  class_section_with_medium: string;
  subject_with_name: string; // Subject name with type, e.g., "Data security - Theory"
  lesson_commons?: Array<{
    id: number;
    lesson_id: number;
    class_section_id: number;
    class_subject_id: number;
    created_at: string | null;
    updated_at: string | null;
    class_section_with_medium: string | null;
    subject_with_name: string | null;
  }>;
}

export interface LessonTopicData {
  id: number;
  lesson_id: number;
  name: string; // Topic title
  description: string; // Topic description
  school_id: number;
  created_at: string;
  updated_at: string;
  file: LessonTopicFile[];
  lesson: LessonTopicLesson; // Lesson object containing subject_with_name
}

export interface GetLessonTopicsResponse {
  success: boolean;
  message: string;
  data?: LessonTopicData[];
}

/**
 * Get lesson topics for a specific lesson
 * @param lessonId - The lesson ID
 * @returns Promise with lesson topics data
 */
export async function getLessonTopics(
  lessonId: number
): Promise<GetLessonTopicsResponse> {
  try {
    const response = await studentApi.get(LESSONS_ENDPOINTS.GET_LESSON_TOPICS, {
      params: {
        lesson_id: lessonId,
      },
    });

    const apiResponse = response.data;

    const result = {
      success: !apiResponse.error, // Convert error to success
      message: apiResponse.message,
      data: apiResponse.data || [], // Array of lesson topics
    };

    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Return error response
    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }
}

// ============================================================================
// ONLINE EXAM QUESTIONS API FUNCTIONS
// ============================================================================

/**
 * Online Exam Question Option Interface
 * Represents a single option for a question
 */
export interface OnlineExamQuestionOption {
  id: number;
  option: string;
  is_answer: number; // 1 = correct answer, 0 = wrong answer
}

/**
 * Online Exam Question Interface
 * Represents a single question in the exam
 */
export interface OnlineExamQuestion {
  id: number;
  question: string;
  options: OnlineExamQuestionOption[];
  marks: number;
  image: string | null;
  note: string | null;
}

/**
 * Get Online Exam Questions Request Interface
 * Parameters for fetching exam questions
 */
export interface GetOnlineExamQuestionsRequest {
  exam_id: number; // Required - The exam ID
  exam_key: string; // Required - The exam key
}

/**
 * Get Online Exam Questions Response Interface
 * Contains exam questions and metadata
 */
export interface GetOnlineExamQuestionsResponse {
  error: boolean;
  message: string;
  data: OnlineExamQuestion[];
  code: number;
  total_questions: number;
  total_marks: number;
}

/**
 * Get Online Exam Questions Function
 *
 * Fetches all questions for a specific online exam using exam ID and key.
 * Returns questions with options, marks, and answer indicators.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export async function getOnlineExamQuestions(
  request: GetOnlineExamQuestionsRequest
): Promise<GetOnlineExamQuestionsResponse> {
  // Make GET request with exam_id and exam_key as query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    EXAM_ENDPOINTS.GET_ONLINE_EXAM_QUESTIONS,
    {
      params: {
        exam_id: request.exam_id,
        exam_key: request.exam_key,
      },
    }
  );

  // Return the API response directly as it matches our expected structure
  // Note: The axios interceptor will handle error responses (error: true) and reject the promise
  // This allows React Query to catch the error properly
  const result: GetOnlineExamQuestionsResponse = response.data;

  return result;
}

// ============================================================================
// SUBJECT ANNOUNCEMENTS API FUNCTIONS
// ============================================================================

/**
 * Subject Announcement File Interface
 * Represents file attachments for subject-specific announcements
 */
export interface SubjectAnnouncementFile {
  id: number;
  modal_type: string;
  modal_id: number;
  file_name: string;
  file_thumbnail: string;
  type: string; // "1" for File Upload, "4" for Other Link
  file_url: string;
  school_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  file_extension: string;
  type_detail: string; // "File Upload" or "Other Link"
  youtube_url_action: string | null;
}

/**
 * Subject Announcement Interface
 * Represents a subject-specific announcement from the API
 */
export interface SubjectAnnouncement {
  id: number;
  title: string;
  description: string;
  session_year_id: number;
  school_id: number;
  created_at: string; // Format: "26-07-2025 11:24"
  updated_at: string; // Format: "04-08-2025 17:20"
  file: SubjectAnnouncementFile[]; // Array of file attachments
  announcement_class: {
    id: number;
    announcement_id: number;
    class_section_id: number;
    class_subject_id: number;
    school_id: number;
  }[];
}

/**
 * Subject Announcements Request Interface
 * Parameters for fetching subject-specific announcements
 */
export interface GetSubjectAnnouncementsRequest {
  type: 'subject'; // Type of announcements to fetch
  class_subject_id: number; // Required - The class subject ID
  page?: number; // Optional page number for pagination
}

/**
 * Subject Announcements Response Interface
 * Defines structure for API response with pagination
 */
export interface GetSubjectAnnouncementsResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: SubjectAnnouncement[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

/**
 * Get Subject Announcements Function
 *
 * This function fetches subject-specific announcements from the API.
 * Supports filtering by class_subject_id and pagination.
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const announcements = await getSubjectAnnouncements({
 *   type: 'subject',
 *   class_subject_id: 2,
 *   page: 1
 * });
 */
export async function getSubjectAnnouncements(
  request: GetSubjectAnnouncementsRequest
): Promise<GetSubjectAnnouncementsResponse> {
  // Build query parameters
  const params: Record<string, string | number> = {
    type: request.type,
    class_subject_id: request.class_subject_id,
  };

  // Add page parameter if provided
  if (request.page) {
    params.page = request.page;
  }

  // Make GET request with query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    ANNOUNCEMENT_ENDPOINTS.GET_ANNOUNCEMENTS,
    {
      params,
    }
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains paginated announcements
  };

  return result;
}

// ==================== DIARY TYPES ====================

/**
 * Diary Category Interface
 * Represents a diary category with id, name, and type (positive/negative)
 */
export interface DiaryCategory {
  id: number;
  name: string;
  type: 'positive' | 'negative'; // Category type: positive or negative
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Diary Subject Interface
 * Represents the subject associated with a diary entry
 */
export interface DiarySubject {
  id: number;
  name: string;
  code: string;
  bg_color: string;
  image: string;
  medium_id: number;
  type: string;
  school_id: number;
  deleted_at: string | null;
  name_with_type: string; // Subject name with type (e.g., "AI - Theory")
}

/**
 * Diary Entry Interface
 * Represents a single diary entry from the API
 */
export interface DiaryEntry {
  id: number;
  diary_category_id: number;
  title: string | null;
  user_id: number;
  subject_id: number;
  session_year_id: number;
  description: string;
  date: string; // Date in DD-MM-YYYY format
  created_at: string; // Created timestamp
  updated_at: string; // Updated timestamp
  deleted_at: string | null;
  subject: DiarySubject; // Subject details
  diary_category: DiaryCategory; // Category details with type
}

/**
 * Diary Student Entry Interface
 * Represents the student-diary relationship from the API
 */
export interface DiaryStudentEntry {
  id: number;
  diary_id: number;
  student_id: number;
  class_section_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  diary: DiaryEntry; // The actual diary entry
}

/**
 * Get Diaries Request Interface
 * Parameters for fetching student diaries with filtering and sorting
 */
export interface GetDiariesRequest {
  student_id: number; // Required: Student ID to fetch diaries for
  sort?: 'positive' | 'negative' | 'new' | 'old'; // Optional: Sort by positive/negative (category type) or new/old (created_at/updated_at)
  subject_id?: number | null; // Optional: Filter by subject ID (null or empty for all subjects)
  diary_category_id?: number | null; // Optional: Filter by category ID (null or empty for all categories)
}

/**
 * Get Diaries Response Interface
 * Defines structure for API response with paginated diary data
 * Note: The API returns a paginated list of diary-student entries directly in data.data
 */
export interface GetDiariesResponse {
  success: boolean;
  message: string;
  data?: {
    current_page: number;
    data: DiaryStudentEntry[]; // Array of diary-student entries, each with nested diary
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

/**
 * Get Student Diaries Function
 *
 * This function fetches the student's diaries from the API with optional filtering and sorting.
 * Supports filtering by subject and category, and sorting by positive/negative (category type)
 * or new/old (based on created_at/updated_at).
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const diaries = await getDiaries({
 *   student_id: 77,
 *   sort: 'new',
 *   subject_id: null, // All subjects
 *   diary_category_id: null // All categories
 * });
 */
export async function getDiaries(
  request: GetDiariesRequest
): Promise<GetDiariesResponse> {
  // Build query parameters
  // Only include parameters that have values (not null or empty)
  const params: Record<string, string | number> = {
    student_id: request.student_id,
  };

  // Add sort parameter if provided (default is 'new' if not specified)
  if (request.sort) {
    params.sort = request.sort;
  }

  // Add subject_id parameter only if provided and not null
  // Empty string means "all subjects" in the API
  if (request.subject_id !== undefined && request.subject_id !== null) {
    params.subject_id = request.subject_id;
  } else {
    params.subject_id = ''; // Empty string for all subjects
  }

  // Add diary_category_id parameter only if provided and not null
  // Empty string means "all categories" in the API
  if (
    request.diary_category_id !== undefined &&
    request.diary_category_id !== null
  ) {
    params.diary_category_id = request.diary_category_id;
  } else {
    params.diary_category_id = ''; // Empty string for all categories
  }

  // Make GET request with query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(DIARY_ENDPOINTS.GET_DIARIES, {
    params,
  });

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: { pagination data with diaries }, code: 200 }
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Paginated diary data from API response
  };

  return result;
}

// ==================== DIARY CATEGORIES ====================

/**
 * Get Diary Categories Response Interface
 * Defines structure for API response with diary categories
 */
export interface GetDiaryCategoriesResponse {
  success: boolean;
  message: string;
  data?: DiaryCategory[]; // Array of diary categories
}

/**
 * Get Diary Categories Function
 *
 * This function fetches all diary categories from the API.
 * Returns all categories (both active and deleted) for dropdown population.
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const categories = await getDiaryCategories();
 */
export async function getDiaryCategories(): Promise<GetDiaryCategoriesResponse> {
  // Make GET request to fetch diary categories
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(DIARY_ENDPOINTS.GET_DIARY_CATEGORIES);

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: [...categories], code: 200 }
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Array of categories from API response
  };

  return result;
}

// ============================================================================
// TRANSPORTATION API FUNCTIONS
// ============================================================================

/**
 * Transportation Plan Interface
 * Represents the student's transportation plan details
 */
export interface TransportationPlan {
  plan_id: number;
  status: string; // "active"
  request_type: string; // "offline"
  duration: string; // "30 Days"
  valid_from: string; // "28 October 2025"
  valid_to: string; // "27 November 2025"
  route: {
    id: number;
    name: string; // "Bhuj - Madhapar"
  };
  pickup_stop: {
    id: number;
    name: string; // "Gandhi circle"
    pickup_time: string; // "08:00 AM"
    drop_time: string; // "02:00 PM"
  };
  expires_in_days: number;
}

/**
 * Transportation Bus Info Interface
 * Represents the bus and staff information
 */
export interface TransportationBusInfo {
  vehicle_id: number;
  vehicle_name: string; // "Omni van"
  registration: string; // "GJ-12-0001"
  driver: {
    id: number;
    name: string;
    phone: string;
    email: string;
    avtar: string; // Profile image URL
  };
  attender: {
    id: number;
    name: string;
    phone: string;
    email: string;
    avtar: string; // Profile image URL
  };
}

/**
 * Transportation Live Summary Interface
 * Represents the current live tracking status
 */
export interface TransportationLiveSummary {
  status: string; // "delayed", "ontime", etc.
  current_location: string; // "Gandhi circle"
  eta_to_user_stop_min: string; // "Reached" or time in minutes
  next_location: string; // "Madhapar police station"
  estimated_time: string; // "Reached" or time
}

/**
 * Transportation Today Attendance Interface
 * Represents today's attendance record
 */
export interface TransportationTodayAttendance {
  status: string; // "P" for Present, "A" for Absent
  time: string; // "05:59 PM"
  trip_type: string; // "pickup" or "drop"
}

/**
 * Transportation Dashboard Request Interface
 * Parameters for fetching transportation dashboard
 */
export interface GetTransportationDashboardRequest {
  user_id: number; // Student ID
  pickup_drop: number; // 0 for pickup, 1 for drop
}

/**
 * Transportation Dashboard Response Interface
 * Complete dashboard data structure
 */
export interface GetTransportationDashboardResponse {
  success: boolean;
  message: string;
  data?: {
    plan: TransportationPlan;
    bus_info: TransportationBusInfo;
    live_summary: TransportationLiveSummary;
    today_attendance: TransportationTodayAttendance[];
  };
}

/**
 * Get Transportation Dashboard Function
 *
 * Fetches the student's transportation dashboard with plan details,
 * bus information, live tracking, and today's attendance.
 * Used to display the main transportation screen.
 */
export async function getTransportationDashboard(
  request: GetTransportationDashboardRequest
): Promise<GetTransportationDashboardResponse> {
  // Create FormData object to match the API format
  const formData = new FormData();
  formData.append('user_id', request.user_id.toString());
  formData.append('pickup_drop', request.pickup_drop.toString());

  // Make POST request with FormData
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    TRANSPORTATION_ENDPOINTS.GET_DASHBOARD,
    formData
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Dashboard data from API response
  };

  return result;
}

/**
 * Live Route Stop Interface
 * Represents a stop in the live route with passengers
 */
export interface LiveRouteStop {
  id?: number; // Optional for school stops
  name: string;
  scheduled_time: string; // "01:00 PM"
  estimated_time?: string; // "Reached" or time
  actual_time: string; // "01:43 PM" or "Pending"
  passengers?: Array<{
    id: number;
    name: string;
    role: string; // "Student", "Teacher", etc.
  }>;
}

/**
 * Live Route Data Interface
 * Represents a single live route trip
 */
export interface LiveRouteData {
  trip_id: number;
  eta: {
    user_stop_min: number | string;
    school_stop_min: number | string;
  };
  status: string; // "inprogress", "completed", etc.
  vehicle: {
    name: string; // "Omni van"
    number: string; // "GJ-12-0001"
  };
  shift_time: {
    label: string; // "Noon"
    from: string; // "01:00 PM"
    to: string; // "02:00 PM"
  };
  route: {
    id: number;
    name: string; // "Bhuj - Madhapar"
  };
  stops: LiveRouteStop[];
  type: string; // "pickup" or "drop"
  last_reached_stop: {
    id: number;
    name: string;
  };
}

/**
 * Live Route Request Interface
 * Parameters for fetching live route data
 */
export interface GetLiveRouteRequest {
  user_id: number; // Student ID
}

/**
 * Live Route Response Interface
 * Response structure for live route API
 */
export interface GetLiveRouteResponse {
  success: boolean;
  message: string;
  data?: LiveRouteData;
}

/**
 * Get Live Route Function
 *
 * Fetches live route tracking data showing current bus location,
 * stops, passengers, and estimated arrival times.
 * Used in the live tracking modal.
 */
export async function getLiveRoute(
  request: GetLiveRouteRequest
): Promise<GetLiveRouteResponse> {
  // Create FormData object to match the API format
  const formData = new FormData();
  formData.append('user_id', request.user_id.toString());

  // Make POST request with FormData
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    TRANSPORTATION_ENDPOINTS.GET_LIVE_ROUTE,
    formData
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Live route data object
  };

  return result;
}

// ============================================================================
// LIVE BUS TRACKING (real-time GPS)
// ============================================================================

/**
 * Tracking status of a trip's location:
 *  - "live"    : location updated within ~90s
 *  - "delayed" : 90-180s old
 *  - "offline" : no location or expired (TTL 180s)
 */
export type TrackingStatus = 'live' | 'delayed' | 'offline' | string;

/**
 * Last known GPS position of the bus. Null when the trip has no cached
 * location (offline).
 */
export interface LiveTrackingLocation {
  latitude: number;
  longitude: number;
  updated_at: string; // ISO 8601, e.g. "2026-08-19T11:45:00+05:30"
  tracking_status: TrackingStatus;
}

/**
 * Passenger "My Bus" live tracking payload.
 * Any block may be null when there is no active plan / running trip.
 */
export interface StudentLiveTrackingData {
  bus: { id: number; name: string; vehicle_number: string } | null;
  driver: { id: number; name: string } | null;
  route: { id: number; name: string } | null;
  trip: {
    id: number;
    type: string; // "pickup" | "drop"
    status: string; // "inprogress"
    started_at: string; // "07:35:00"
  } | null;
  location: LiveTrackingLocation | null;
  tracking_status: TrackingStatus;
  // Backend-provided refresh cadence (seconds); the client polls at this rate.
  poll_interval_sec?: number;
}

export interface GetStudentLiveTrackingResponse {
  error: boolean;
  message: string;
  data?: StudentLiveTrackingData;
  code?: number;
}

/**
 * Get Student Live Bus Tracking
 *
 * Two modes:
 *  - Authenticated: pass a numeric userId. The studentApi interceptor adds the
 *    Bearer token + school-code; the student id is sent as user_id.
 *  - Token: pass a tracking token (from the /live-tracking#tk=... URL hash).
 *    The token is sent as the `X-Tracking-Token` header via a plain fetch that
 *    bypasses the auth/school-code interceptor. The backend resolves the
 *    student/trip from the token.
 *
 * `tracking_status: "offline"` with null blocks is a valid "no running trip"
 * state, not an error.
 */
export async function getStudentLiveTracking(
  userId: number
): Promise<GetStudentLiveTrackingResponse> {
  const response = await studentApi.get<GetStudentLiveTrackingResponse>(
    TRANSPORTATION_ENDPOINTS.GET_LIVE_TRACKING,
    { params: { user_id: userId } }
  );
  return response.data;
}

// ============================================================================
// LIVE TRACKING SESSION (token-based, self-contained, no auth/school-code)
// ============================================================================

/**
 * A stop on the route. Coordinates are null where the school has not filled
 * in pickup_points lat/lng.
 */
export interface TrackingSessionStop {
  id: number;
  name: string;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
  scheduled_time: string;
  estimated_time: string; // time | "Reached"
  actual_time: string; // time | "Pending" | "Reached"
  is_user_stop: boolean;
}

export interface TrackingSessionLocation {
  latitude: number;
  longitude: number;
  updated_at: string; // ISO-8601 with offset
  age_sec: number;
  is_stale: boolean; // true once the fix is older than ~90s
}

/**
 * tracking_status:
 *  - "live"    : trip running, fresh location
 *  - "offline" : trip running, no fresh fix (keep last pin, "waiting")
 *  - "no_trip" : plan active, bus not started
 */
export type SessionTrackingStatus = 'live' | 'offline' | 'no_trip' | string;

export interface TrackingSessionData {
  tracking_status: SessionTrackingStatus;
  poll_interval_sec: number;
  expires_at: string;
  student: { id: number; user_id: number; name: string };
  school: {
    id: number;
    name: string;
    google_maps_api_key: string; // base64
    google_map_link: string;
  };
  bus: { id: number; name: string; vehicle_number: string } | null;
  driver: { id: number; name: string } | null;
  route: { id: number; name: string } | null;
  trip: {
    id: number;
    type: string; // "pickup" | "drop"
    status: string;
    date: string;
    started_at: string;
    shift_time: { label: string; from: string; to: string };
  } | null;
  location: TrackingSessionLocation | null;
  last_reached_stop: { id: number; name: string } | null;
  // Display-ready previous/next stop names ("-" when none). These reflect the
  // actual next station along the route, unlike user_stop which stays fixed
  // on the student's own stop even after it has been reached.
  previous_location?: string;
  next_location?: string;
  user_stop: TrackingSessionStop | null;
  eta: {
    user_stop_min: number | string; // integer | "Delayed" | "Reached"
    school_stop_min: number | string;
  } | null;
  stops: TrackingSessionStop[];
}

export interface TrackingSessionResponse {
  error: boolean;
  message: string;
  data?: TrackingSessionData;
  code?: number;
}

/**
 * Error carrying the HTTP status so the page can distinguish invalid (401),
 * expired/revoked (410) and rate-limited (429) from an ordinary failure.
 */
export class TrackingSessionError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'TrackingSessionError';
    this.status = status;
  }
}

/**
 * Redeem a tracking link.
 *
 * GET /transportation/live-tracking/session with only the X-Tracking-Token
 * header — no Authorization, no school-code. The route sits outside
 * APISwitchDatabase and resolves the school from the token, so the WebView
 * cannot point at another student. Never log the token.
 *
 * 200 -> data (tracking_status live | offline | no_trip)
 * 401 -> invalid / malformed / forged token
 * 410 -> expired or revoked (stop polling)
 * 429 -> polling too fast (back off)
 */
export async function getTrackingSession(
  token: string
): Promise<TrackingSessionResponse> {
  const url = `${API_BASE_URL}${TRANSPORTATION_ENDPOINTS.GET_TRACKING_SESSION}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'X-Tracking-Token': token },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new TrackingSessionError(response.status, `TRACKING_${response.status}`);
  }

  return (await response.json()) as TrackingSessionResponse;
}

/**
 * Generate Live Tracking Link
 *
 * Asks the backend to mint a signed, shareable tracking URL for a student.
 * The returned `url` points at /live-tracking#tk=<token>; the raw `token` is
 * also returned so the web app can build a same-origin route. Auth + school
 * code are added by the studentApi interceptor.
 */
export interface GenerateTrackingLinkResponse {
  error: boolean;
  message: string;
  data?: {
    url: string;
    token: string;
    trip_id: number;
    poll_interval_sec: number;
    expires_at: string;
  };
  code?: number;
}

export async function generateTrackingLink(
  userId: number
): Promise<GenerateTrackingLinkResponse> {
  const response = await studentApi.post<GenerateTrackingLinkResponse>(
    TRANSPORTATION_ENDPOINTS.GENERATE_TRACKING_LINK,
    { user_id: userId }
  );
  return response.data;
}

/**
 * Transportation Attendance Record Interface
 * Represents a single attendance record
 */
export interface TransportationAttendanceRecord {
  date: string; // "2025-09-15"
  trip_type: string; // "pickup" or "drop"
  status: string; // "P" for Present, "A" for Absent
}

/**
 * Transportation Attendance Summary Interface
 * Summary of attendance statistics
 */
export interface TransportationAttendanceSummary {
  present: number; // Total present days
  absent: number; // Total absent days
}

/**
 * Transportation Attendance Request Interface
 * Parameters for fetching attendance list
 */
export interface GetTransportationAttendanceRequest {
  user_id: number; // Student ID
}

/**
 * Transportation Attendance Response Interface
 * Response structure for attendance list API
 */
export interface GetTransportationAttendanceResponse {
  success: boolean;
  message: string;
  data?: {
    summary: TransportationAttendanceSummary;
    records: TransportationAttendanceRecord[];
  };
}

/**
 * Get Transportation Attendance Function
 *
 * Fetches the student's transportation attendance history
 * with monthly records showing present/absent status for pickup and drop.
 * Used in the attendance modal.
 */
export async function getTransportationAttendance(
  request: GetTransportationAttendanceRequest
): Promise<GetTransportationAttendanceResponse> {
  // Create FormData object to match the API format
  const formData = new FormData();
  formData.append('user_id', request.user_id.toString());

  // Make POST request with FormData
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    TRANSPORTATION_ENDPOINTS.GET_ATTENDANCE_LIST,
    formData
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Attendance data from API response
  };

  return result;
}

// ============================================================================
// TEACHER API FUNCTIONS
// ============================================================================

/**
 * Teacher Subject Interface
 * Represents a single subject assignment for a teacher
 */
export interface TeacherSubject {
  id: number; // Subject assignment ID
  subject_id: number; // Subject ID
  teacher_id: number; // Teacher ID
  school_id: number; // School ID
  subject_with_name: string; // Combined subject name with teacher name, e.g. "AI (Theory) - A Teacher"
  subject: {
    id: number;
    name: string; // Subject name, e.g. "AI"
    type: string; // Subject type, e.g. "Theory" or "Practical"
    name_with_type: string; // Combined name with type, e.g. "AI - Theory"
  };
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    image: string; // Teacher image URL
    mobile: string;
    country_code: string | null; // Dialing code without '+', e.g. "244"
    full_name: string; // Combined first and last name
    school_names: string;
    role: string | null;
  };
}

/**
 * Teachers Response Interface
 * Represents the API response containing teacher data
 */
export interface TeachersResponse {
  error: boolean; // false on success
  message: string; // API response message
  data: TeacherSubject[]; // Array of teacher-subject assignments
  code: number; // HTTP status code
}

/**
 * Get Student's Teachers List Request Interface
 */
export interface GetTeachersListRequest {
  student_id: number; // Student ID to fetch teachers for
}

/**
 * Get Student's Teachers List
 *
 * This function fetches all teachers assigned to the student
 * along with their subjects. Returns detailed teacher information
 * including profile images, contact info, and subject assignments.
 *
 * Endpoint: GET /teachers?student_id={student_id}
 * Requires: Authentication token (automatically added by axios interceptor)
 *
 * @param request - Request object containing student_id
 * @returns Promise with teachers data
 */
export async function getTeachersList(request: GetTeachersListRequest) {
  // Make GET request to fetch teachers list with student_id query parameter
  const response = await studentApi.get<TeachersResponse>(
    TEACHER_ENDPOINTS.GET_TEACHERS,
    {
      params: {
        student_id: request.student_id,
      },
    }
  );

  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success flag
    message: apiResponse.message,
    data: apiResponse.data || [], // Array of teacher-subject data
  };

  return result;
}

// ============================================================================
// NOTIFICATIONS API FUNCTIONS
// ============================================================================

/**
 * Notification Interface
 * Represents a single notification from the API
 * Based on actual API response structure
 */
export interface Notification {
  id: number;
  title: string;
  message: string; // Notification description/message
  image: string | null; // Optional notification image URL
  send_to: string; // Who the notification is sent to (e.g., "Student")
  is_custom: number; // 1 for custom notifications, 0 otherwise
  session_year_id: number;
  school_id: number;
  created_at: string; // Date format: "10-11-2025 16:09"
  updated_at: string; // Date format: "10-11-2025 16:09"
  type: string; // Notification type (e.g., "custom")
}

/**
 * Notifications Pagination Interface
 * Standard pagination metadata from API
 */
export interface NotificationsPagination {
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * Get Notifications Request Interface
 * Parameters for fetching notifications (optional pagination)
 */
export interface GetNotificationsRequest {
  page?: number; // Optional page number for pagination
  offset?: number; // Optional offset for pagination (alternative to page)
  limit?: number; // Optional limit for number of items per request
}

/**
 * Get Notifications Response Interface
 * Defines structure for API response with paginated notifications
 */
export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data?: {
    data: Notification[]; // Array of notifications
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    // Include other pagination fields
  } & NotificationsPagination;
}

/**
 * Get Notifications Function
 *
 * This function fetches notifications for the logged-in student.
 * Returns paginated notification data with title, message, image, and timestamps.
 * Requires the user to be authenticated (token is automatically added by axios).
 * The axios interceptor will automatically add the Authorization Bearer token
 * and the school-code header.
 *
 * Example usage:
 * const notifications = await getNotifications({ page: 1 });
 */
export async function getNotifications(
  request: GetNotificationsRequest = {}
): Promise<GetNotificationsResponse> {
  // Build query parameters
  const params: Record<string, number> = {};

  // Add page parameter if provided
  if (request.page) {
    params.page = request.page;
  }

  // Add offset parameter if provided (alternative to page)
  if (request.offset !== undefined) {
    params.offset = request.offset;
  }

  // Add limit parameter if provided
  if (request.limit) {
    params.limit = request.limit;
  }

  // Make GET request with query parameters
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.get(
    NOTIFICATIONS_ENDPOINTS.GET_NOTIFICATIONS,
    {
      params,
    }
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "...", data: { pagination data with notifications }, code: 200 }
  const apiResponse = response.data;

  const result = {
    success: !apiResponse.error, // Convert error to success
    message: apiResponse.message,
    data: apiResponse.data, // Contains paginated notifications
  };

  return result;
}
// =========================================================================
// STORE TRIP REPORT API FUNCTION
// =========================================================================

export interface StoreTripReportRequest {
  route_vehicle_history_id: string; // The ID from liveRouteData.data.id
  description: string; // "Unsafe Driving", etc. or custom text check with user if description is the text or the issue type
  // Note: Standard API usually separates issue type and description, but user curl shows only 'description'.
  // We will pass the selected chip text as description, or typed text as description.
  // User request: -F 'description=Unsafe Driving'
  // It seems 'description' is the main field.
  // Wait, the UI shows predefined chips AND "Enter Issue" textarea.
  // Likely we might need to concat or send one.
  // Based on curl: -F 'description=Unsafe Driving'
  // I will assume for now we send the chip value OR the text value.
  // If both are present, maybe concat? "Unsafe Driving: User details"
}

export interface StoreTripReportResponse {
  success: boolean;
  message: string;
}

/**
 * Store Trip Report Function
 *
 * This function handles submitting a trip report.
 * Uses axios with automatic error handling and token management.
 */
export async function storeTripReport(
  request: StoreTripReportRequest
): Promise<StoreTripReportResponse> {
  // Create FormData object to match the curl command format
  const formData = new FormData();
  formData.append('route_vehicle_history_id', request.route_vehicle_history_id);
  formData.append('description', request.description);

  // Make the API request using axios
  // The axios interceptor will automatically add the Authorization Bearer token
  // and the school-code header
  const response = await studentApi.post(
    TRANSPORTATION_ENDPOINTS.STORE_TRIP_REPORT,
    formData
  );

  // Transform API response to match our expected structure
  // API returns: { error: false, message: "..." }
  const apiResponse = response.data;

  return {
    success: !apiResponse.error,
    message: apiResponse.message,
  };
}
// ============================================================================
// CERTIFICATES API FUNCTIONS
// ============================================================================

export interface AssignedCertificate {
  id: number;
  certificate_template_id: number;
  user_id: number;
  user_type: string;
  class_section_id: number;
  session_year_id: number;
  exam_id: number | null;
  roll_no: string;
  issued_at: string | null;
  created_at: string;
  updated_at: string;
  certificate_template?: {
    id: number;
    name: string;
    type: string;
  };
  exam?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    mobile: string;
    image: string;
  };
}

export interface GetAssignedCertificatesResponse {
  success: boolean;
  message: string;
  data: AssignedCertificate[];
  code: number;
}

export interface AssignCertificatePayload {
  certificate_template_id: number;
  user_id: number;
  user_type: string;
  class_section_id?: number;
  session_year_id?: number;
  exam_id?: number | null;
  roll_no?: string;
}

/**
 * Get Assigned Certificates
 */
export async function getAssignedCertificates(): Promise<GetAssignedCertificatesResponse> {
  const response = await studentApi.post(
    CERTIFICATE_ENDPOINTS.ASSIGN,
    {} // Empty body as per your current API
  );

  const apiResponse = response.data;

  return {
    success: !apiResponse.error,
    message: apiResponse.message || 'Success',
    data: apiResponse.data || [],
    code: apiResponse.code || 200,
  };
}

/**
 * Assign Certificate to Student/Staff (New)
 */
export async function assignCertificate(payload: AssignCertificatePayload) {
  const response = await studentApi.post(
    CERTIFICATE_ENDPOINTS.ASSIGN,
    payload
  );

  const apiResponse = response.data;

  return {
    success: !apiResponse.error,
    message: apiResponse.message,
    data: apiResponse.data,
    code: apiResponse.code,
  };
}

/**
 * Generate Certificate (Returns HTML for PDF preview/download)
 */
/**
 * Generate Certificate with School Code from Redux
 */
export async function generateCertificate(
  id: number, 
  schoolCode: string
) {
  if (!schoolCode) {
    throw new Error("School code is required");
  }

  const response = await studentApi.post(
    `${CERTIFICATE_ENDPOINTS.GENERATE}?id=${id}&school_code=${schoolCode}`,
    {}
  );

  return response.data;
}

/**
 * Get Student ID Card Data Function
 *
 * This function handles fetching the student's ID Card data from the server.
 * Requires the user to be authenticated (token is automatically added by axios interceptor).
 */
export interface StudentIdCardResponse {
  error: boolean;
  pdf: string; // Base64 encoded PDF string
}

/**
 * Get Student ID Card Data Function
 *
 * This function handles fetching the student's ID Card data from the server.
 * Requires the user to be authenticated (token is automatically added by axios interceptor).
 * Returns a response with a base64 encoded PDF in the 'pdf' field.
 */
export async function getIdCard(): Promise<StudentIdCardResponse> {
  const response = await studentApi.get<StudentIdCardResponse>(ID_CARD_ENDPOINTS.GET_ID_CARD);
  return response.data;
}

// ---------------------------------------------------------------------------
// Student Report
// ---------------------------------------------------------------------------

export interface StudentReportDiaryCategory {
  category_name: string;
  count: number;
  percentage: number;
}

export interface StudentReportExamItem {
  exam_name: string;
  exam_date?: string;
  obtained_marks: number;
  total_marks: number | null;
  grade?: string;
}

export interface StudentReportResponse {
  error: boolean;
  message: string;
  code: number;
  data?: {
    diary_report: {
      summary: {
        total_entries: number;
        positive_count: number;
        negative_count: number;
      };
      top_positive_categories: StudentReportDiaryCategory[];
      top_negative_categories: StudentReportDiaryCategory[];
    };
    offline_exam_report: {
      summary: {
        obtained_marks: number;
        total_marks: number;
        percentage: number;
        total_exams: number;
        average_marks: number;
      };
      best_performance: StudentReportExamItem[];
      weak_performance: StudentReportExamItem[];
    };
    online_exam_report: {
      summary: {
        completed_exams: number;
        missed_exams: number;
        total_exams: number;
      };
      best_performance: StudentReportExamItem[];
      weak_performance: StudentReportExamItem[];
    };
    assignment_report: {
      statistics: {
        total_assignments: number;
        accepted: number;
        submitted: number;
        pending: number;
        rejected: number;
      };
      points: {
        total_points: number;
        obtained_points: number;
        percentage: number;
      };
    };
  };
}

export async function getStudentReport(classSubjectId?: number): Promise<StudentReportResponse> {
  const params = classSubjectId ? { class_subject_id: classSubjectId } : {};
  const response = await studentApi.get<StudentReportResponse>(
    REPORT_ENDPOINTS.GET_STUDENT_REPORT,
    { params }
  );
  return response.data;
}
// ============================================================================
// LANGUAGE API FUNCTIONS
// ============================================================================

/**
 * Language item returned by the /get-languages endpoint
 */
export interface ApiLanguage {
  id: number;
  name: string;
  code: string;
  file: string | null;
  student_app_file: string | null;
  staff_app_file: string | null;
  web_file: string | null;
  image: string | null;
  status: number;
  is_rtl: number;
  created_at: string;
  updated_at: string;
}

export interface GetLanguagesResponse {
  error: boolean;
  message: string;
  data: ApiLanguage[];
  code: number;
}

/**
 * Which translation file the API should return.
 * The web panel uses 'web'.
 */
export type LanguageType = 'student' | 'staff' | 'web';

/**
 * Language detail returned by the /set-languages endpoint.
 * `file_name` holds the actual translation key/value pairs.
 */
export interface SetLanguageData {
  id: number;
  code: string;
  name: string;
  name_in_english: string;
  student_app_file: string | null;
  staff_app_file: string | null;
  web_file: string | null;
  panel_file: string | null;
  rtl: boolean;
  image: string | null;
  country_code: string | null;
  file_name: Record<string, string>;
}

export interface SetLanguageResponse {
  error: boolean;
  message: string;
  data: SetLanguageData;
  code: number;
}

/**
 * Get Languages
 *
 * Fetches every language configured for the school. Callers are expected to
 * filter on `status === 1` to only show active languages.
 */
export async function getLanguages(): Promise<GetLanguagesResponse> {
  const response = await studentApi.get<GetLanguagesResponse>(
    LANGUAGE_ENDPOINTS.GET_LANGUAGES
  );
  return response.data;
}

/**
 * Set Language
 *
 * Posts the selected language and returns its translation data in `file_name`.
 */
export async function setLanguageApi(
  languageCode: string,
  type: LanguageType = 'web'
): Promise<SetLanguageResponse> {
  const response = await studentApi.post<SetLanguageResponse>(
    LANGUAGE_ENDPOINTS.SET_LANGUAGE,
    { language_code: languageCode, type }
  );
  return response.data;
}
