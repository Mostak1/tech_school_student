/**
 * Student TanStack Query Hooks
 *
 * Simple hooks file focused only on student authentication.
 * This keeps the code clean and easy to understand for beginners.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import {
  studentLogin,
  StudentLoginRequest,
  studentChangePassword,
  StudentChangePasswordRequest,
  getStudentProfile,
  getClassSectionTeachers,
  getChatHistory,
  GetChatHistoryResponse,
  getChatUsers,
  GetChatUsersResponse,
  getMessages,
  GetMessagesResponse,
  ChatMessage,
  sendMessage,
  SendMessageRequest,
  SendMessageResponse,
  deleteMessage,
  DeleteMessageRequest,
  getStudentTimetable,
  getExamMarks,
  getStudentSubjects,
  getStudentAssignments,
  GetAssignmentsRequest,
  submitAssignment,
  SubmitAssignmentRequest,
  deleteAssignmentSubmission,
  DeleteAssignmentSubmissionRequest,
  getAnnouncements,
  GetAnnouncementsRequest,
  getAssignmentsReport,
  GetAssignmentsReportRequest,
  getOnlineExamReport,
  GetOnlineExamReportRequest,
  getHolidays,
  getSessionYears,
  getGallery,
  getGalleryDetails,
  getSettingsData,
  getSchoolSettings,
  getSchoolSettingsByType,
  getSystemBranding,
  getAttendance,
  getLessons,
  getLessonTopics,
  getGuardianDetails,
  getOnlineExamList,
  getOnlineExamResultList,
  getOnlineExamResult,
  getOfflineExamList,
  getOnlineExamQuestions,
  GetOnlineExamQuestionsRequest,
  submitOnlineExamAnswers,
  SubmitOnlineExamAnswersRequest,
  getDiaries,
  GetDiariesRequest,
  getDiaryCategories,
  getTransportationDashboard,
  GetTransportationDashboardRequest,
  getLiveRoute,
  getStudentLiveTracking,
  getTrackingSession,
  TrackingSessionError,
  GetLiveRouteRequest,
  getTransportationAttendance,
  GetTransportationAttendanceRequest,
  getTeachersList,
  getNotifications,
  GetNotificationsRequest,
  getSliders,
  getIdCard,
  getStudentReport,
  getSemesters,
  createTuitionRequest,
  getMyTuitionRequests,
  getPostApplicants,
  submitTutorReview,
  selectPostApplicant,
} from './functions';
import type {
  CreateTuitionRequestPayload,
  TutorReview,
} from '@/types/student';
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from '@/components/store/slices/studentAuthSlice';
import { toastUtils } from '@/components/lib/toast';
import { getErrorMessage, isApiError } from './responseHandler';

/**
 * Student Login Mutation Hook
 *
 * This hook handles student login with automatic error handling and loading states.
 * Uses Redux for state management and custom status code handling.
 * Use this in your student login form component.
 */
export function useStudentLogin() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['student', 'login'],
    mutationFn: (credentials: StudentLoginRequest) => studentLogin(credentials),
    onMutate: () => {
      // Start login process - set loading state
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      // Login successful (status code 100)

      // Store user data and token in Redux
      if (data.data?.user && data.data?.token) {
        dispatch(
          loginSuccess({
            user: data.data.user,
            token: data.data.token,
          })
        );

        // Prefetch school settings immediately on login
        // This ensures the dashboard has settings data (colors, etc.) ready
        queryClient.prefetchQuery({
          queryKey: ['student', 'school-settings'],
          queryFn: () => getSchoolSettings(),
        });

        // Show success toast
        toastUtils.success('Login successful! Welcome back.');
      } else {
        // Unexpected response structure
        const errorMessage = 'Invalid response from server';
        dispatch(loginFailure(errorMessage));
        toastUtils.error(errorMessage);
      }
    },
    onError: (error: unknown) => {
      // Handle login errors with custom status codes
      // The axios interceptor converts API errors to ApiError
      const errorMessage = getErrorMessage(error);

      // Log error details for debugging (use console.log to prevent error overlay)
      if (isApiError(error)) {
      } else {
      }

      // Update Redux state with error
      dispatch(loginFailure(errorMessage));

      // Show error toast to user
      toastUtils.error(errorMessage);
    },
  });
}

/**
 * Student Logout Hook
 *
 * This hook handles student logout by clearing Redux state and cached data.
 * No API call needed - logout is managed purely by client state.
 */
export function useStudentLogout() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const logout = () => {
    // Clear all cached data
    queryClient.clear();
    // Clear Redux state
    dispatch({ type: 'studentAuth/logout' });
    // Clear stored FCM token
    // This ensures a fresh token check on next login
    localStorage.removeItem('eschool_fcm_token');
    console.log('[Logout] FCM token cleared from storage');
    // Show logout toast
    toastUtils.success('Logged out successfully');
  };

  return { logout };
}

/**
 * Student Change Password Mutation Hook
 *
 * This hook handles changing the student's password with automatic error handling.
 * Uses the token from Redux state (automatically added by axios interceptor).
 * Use this in the change password modal component.
 */
export function useStudentChangePassword() {
  return useMutation({
    mutationKey: ['student', 'change-password'],
    mutationFn: (credentials: StudentChangePasswordRequest) =>
      studentChangePassword(credentials),
    onSuccess: (data) => {
      // Show success toast with the API message
      toastUtils.success(data.message || 'Password changed successfully');
    },
    onError: (error: unknown) => {
      // Handle password change errors
      // The axios interceptor converts API errors to ApiError
      const errorMessage = getErrorMessage(error);

      // Show error toast to user
      toastUtils.error(errorMessage);
    },
  });
}

/**
 * Get Student Profile Query Hook
 *
 * This hook fetches the student's profile data from the API.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Requires schoolCode to be passed as parameter.
 */
export function useGetStudentProfile(schoolCode: string | null) {
  return useQuery({
    // Query key includes schoolCode for proper caching
    queryKey: ['student', 'profile', schoolCode],
    // Only run query if schoolCode is available
    queryFn: () => getStudentProfile(schoolCode!),
    // Don't run the query if schoolCode is null or empty
    enabled: !!schoolCode,
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Get Student Id Card Query Hook
 *
 * This hook fetches the student's ID Card data from the API.
 * Uses React Query for automatic caching, refetching, and loading states.
 */
export function useGetIdCard() {
  return useQuery({
    queryKey: ['student', 'id-card'],
    queryFn: () => getIdCard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Get Class Section Teachers Query Hook
 *
 * This hook fetches all teachers for a specific class section.
 * Uses React Query for automatic caching and loading states.
 * Requires classSectionId to be passed as parameter.
 * Used in the chat feature to show available teachers for messaging.
 */
export function useGetClassSectionTeachers(classSectionId: string | null) {
  return useQuery({
    // Query key includes classSectionId for proper caching
    queryKey: ['chat', 'teachers', classSectionId],
    // Only run query if classSectionId is available
    queryFn: () =>
      getClassSectionTeachers({ class_section_id: classSectionId! }),
    // Don't run the query if classSectionId is null or empty
    enabled: !!classSectionId,
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 10 * 60 * 1000, // 10 minutes (teachers don't change often)
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Get Chat History Query Hook
 *
 * This hook fetches the chat history with all contacts.
 * Uses React Query for automatic caching and loading states.
 * Requires role to be passed as parameter (e.g., "Teacher").
 * Used in the chat feature to display the list of contacts with chat history.
 */
export function useGetChatHistory(role: string, search?: string) {
  return useQuery({
    // Query key includes role and search for proper caching per search term
    queryKey: ['chat', 'history', role, search],
    // Fetch chat history with the specified role and optional search term
    queryFn: () =>
      getChatHistory({
        role,
        ...(search && search.trim() && { search: search.trim() }),
        page: 1, // Default to page 1 for simple hook
      }),
    // Keep data fresh with shorter stale time (chat data changes frequently)
    staleTime: 1 * 60 * 1000, // 1 minute
    // Retry failed requests once
    retry: 1,
    // Don't refetch on window focus when searching (to avoid interrupting user)
    refetchOnWindowFocus: !search || !search.trim(),
  });
}

/**
 * Infinite Get Chat History Query Hook
 *
 * This hook fetches chat history with pagination support/infinite scroll.
 * Uses useInfiniteQuery to handle loading more pages.
 */
/**
 * Infinite Get Chat Users (Staff/Teachers) Query Hook
 *
 * This hook fetches users with pagination support using the /users endpoint.
 * Uses strict checks to prevent infinite loops.
 */
export function useGetChatUsersInfinite(
  role: string,
  childId: number | null,
  search?: string
) {
  return useInfiniteQuery({
    queryKey: ['chat', 'users', 'infinite', role, childId, search],
    queryFn: ({ pageParam = 1 }) =>
      getChatUsers({
        role,
        child_id: childId!,
        ...(search && search.trim() && { search: search.trim() }),
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: GetChatUsersResponse,
      allPages: GetChatUsersResponse[]
    ) => {
      // 1. Basic validation
      if (!lastPage?.data) return undefined;

      const { current_page, last_page, data } = lastPage.data;

      // 2. Empty Data Check
      if (!data || !Array.isArray(data) || data.length === 0) return undefined;

      // 3. Page Count Check
      if (allPages.length >= last_page) return undefined;

      // 4. Duplicate Content Check (Deep Check)
      if (allPages.length > 1) {
        const previousResponse = allPages[allPages.length - 2];
        const previousData = previousResponse?.data?.data;

        if (
          previousData &&
          previousData.length > 0 &&
          data.length > 0 &&
          previousData[0].id === data[0].id
        ) {
          console.warn(
            'Chat Users Pagination: API returned duplicate CONTENT, stopping',
            {
              page: current_page,
              firstId: data[0].id,
            }
          );
          return undefined;
        }
      }

      // 5. Normal Next Page
      if (current_page < last_page) {
        return current_page + 1;
      }
      return undefined;
    },
    enabled: !!childId,
    staleTime: 10 * 1000,
  });
}

export function useGetChatHistoryInfinite(role: string, search?: string) {
  return useInfiniteQuery({
    queryKey: ['chat', 'history', 'infinite', role, search],
    queryFn: ({ pageParam = 1 }) =>
      getChatHistory({
        role,
        ...(search && search.trim() && { search: search.trim() }),
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: GetChatHistoryResponse,
      allPages: GetChatHistoryResponse[]
    ) => {
      // 1. Basic validation: Ensure data exists
      if (!lastPage?.data) {
        return undefined;
      }

      const { current_page, last_page, data } = lastPage.data;

      // 2. Empty Data Check: If the current page has no items, stop fetching
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('Chat History Pagination: Page is empty, stopping');
        return undefined;
      }

      // 3. Page Count Check: If we have fetched all pages (or more), stop
      if (allPages.length >= last_page) {
        console.log('Chat History Pagination: All pages fetched, stopping', {
          pagesFetched: allPages.length,
          lastPage: last_page,
        });
        return undefined;
      }

      // 4. Duplicate Content Check (Deep Check):
      // Even if page numbers are different, the API might be returning the same data.
      // We compare the first item of the current page with the first item of the previous page.
      if (allPages.length > 1) {
        const previousResponse = allPages[allPages.length - 2];
        const previousData = previousResponse?.data?.data;

        if (
          previousData &&
          previousData.length > 0 &&
          data.length > 0 &&
          previousData[0].id === data[0].id
        ) {
          console.warn(
            'Chat History Pagination: API returned duplicate CONTENT, stopping infinite scroll',
            {
              currentPage: current_page,
              previousPageFirstId: previousData[0].id,
              currentPageFirstId: data[0].id,
            }
          );
          return undefined;
        }
      }

      // 5. Duplicate Page Number Check:
      if (allPages.length > 1) {
        const previousPage = allPages[allPages.length - 2];
        const previousPageNum = previousPage?.data?.current_page;

        if (current_page === previousPageNum) {
          console.warn(
            'Chat History Pagination: API returned duplicate page number, stopping infinite scroll',
            { current_page, previousPageNum }
          );
          return undefined;
        }
      }

      // 6. Normal Pagination: If current_page < last_page, fetch next
      if (current_page < last_page) {
        return current_page + 1;
      }

      return undefined;
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000, // fallback when WebSocket/FCM unavailable
  });
}

/**
 * Get Messages Query Hook
 *
 * This hook fetches all messages between the logged-in user and a specific contact.
 * Uses React Query for automatic caching and loading states.
 * Requires receiverId to be passed as parameter (the contact's ID).
 * Optional search parameter for filtering messages by content.
 * Used in the chat window to display message history with a selected contact.
 */
export function useGetMessages(receiverId: number | null, search?: string) {
  return useQuery({
    // Query key includes receiverId and search for proper caching per conversation and search term
    queryKey: ['chat', 'messages', receiverId, search],
    // Fetch messages with the specified receiver and optional search term
    queryFn: () =>
      getMessages({
        receiver_id: receiverId!,
        ...(search && search.trim() && { search: search.trim() }),
      }),
    // Only run query if receiverId is available (a contact is selected)
    enabled: !!receiverId && receiverId > 0,
    // Keep data fresh with shorter stale time (chat data changes frequently)
    staleTime: 30 * 1000, // 30 seconds
    // Retry failed requests once
    retry: 1,
    // Refetch on window focus to show latest messages (only when not searching)
    refetchOnWindowFocus: !search || !search.trim(),
  });
}

/**
 * Get Messages Infinite Query Hook
 *
 * This hook fetches messages with pagination support for infinite scroll.
 * Uses useInfiniteQuery to handle loading older messages when scrolling up.
 * Requires receiverId to be passed as parameter (the contact's ID).
 * Used in the chat window to display message history with infinite scroll.
 */
export function useGetMessagesInfinite(receiverId: number | null) {
  return useInfiniteQuery({
    queryKey: ['chat', 'messages', 'infinite', receiverId],
    queryFn: ({ pageParam = 1 }) =>
      getMessages({
        receiver_id: receiverId!,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetMessagesResponse) => {
      // Check if pagination data exists
      if (!lastPage?.pagination) return undefined;

      const { current_page, last_page } = lastPage.pagination;

      // Stop if no messages in current page
      if (!lastPage.data || lastPage.data.length === 0) return undefined;

      // Stop if we've reached the last page
      if (current_page >= last_page) return undefined;

      // Return next page number
      return current_page + 1;
    },
    enabled: !!receiverId && receiverId > 0,
    staleTime: Infinity,
    retry: 1,
  });
}

/**
 * Send Message Mutation Hook
 *
 * This hook handles sending a new message with optional file attachments.
 * Supports images, documents, and MP4 videos (up to 10MB for videos).
 * Uses React Query for automatic error handling and loading states.
 * Automatically refetches messages after successful send.
 * Used in the chat window to send messages to a selected contact.
 */
export function useSendMessage(receiverId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['chat', 'send-message', receiverId],
    mutationFn: (request: SendMessageRequest) => sendMessage(request),
    onSuccess: (response: SendMessageResponse) => {
      if (receiverId && response.data) {
        const sentMessage: ChatMessage = response.data;
        queryClient.setQueryData(
          ['chat', 'messages', 'infinite', receiverId],
          (old: InfiniteData<GetMessagesResponse> | undefined) => {
            if (!old) return old;
            const [firstPage, ...rest] = old.pages;
            const ids = new Set((firstPage.data || []).map((m) => m.id));
            if (ids.has(sentMessage.id)) return old;
            return {
              ...old,
              pages: [
                { ...firstPage, data: [sentMessage, ...(firstPage.data || [])] },
                ...rest,
              ],
            };
          },
        );
      }

      queryClient.invalidateQueries({ queryKey: ['chat', 'history'] });
    },
    onError: (error: unknown) => {
      // Handle message send errors
      // The axios interceptor converts API errors to ApiError
      const errorMessage = getErrorMessage(error);

      // Show error toast to user
      toastUtils.error(errorMessage);
    },
  });
}

/**
 * Delete Message Mutation Hook
 *
 * This hook handles deleting one or more messages by their IDs.
 * Uses React Query for automatic error handling and loading states.
 * Automatically refetches messages after successful deletion.
 * Used in the chat window to delete messages from a conversation.
 */
export function useDeleteMessage(receiverId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['chat', 'delete-message', receiverId],
    mutationFn: (request: DeleteMessageRequest) => deleteMessage(request),
    onSuccess: (data) => {
      // Invalidate and refetch messages for this conversation
      // This ensures the deleted message is removed immediately
      if (receiverId) {
        queryClient.invalidateQueries({
          queryKey: ['chat', 'messages'],
        });
      }

      // Also invalidate chat history to update last message
      queryClient.invalidateQueries({
        queryKey: ['chat', 'history'],
      });

      // Show success toast
      toastUtils.success(data.message || 'Message deleted successfully');
    },
    onError: (error: unknown) => {
      // Handle message deletion errors
      // The axios interceptor converts API errors to ApiError
      const errorMessage = getErrorMessage(error);

      // Show error toast to user
      toastUtils.error(errorMessage);
    },
  });
}

/**
 * Get Student Timetable Query Hook
 *
 * This hook fetches the student's weekly timetable from the API.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Returns all class schedules organized by day with timing, subject, and teacher info.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export function useGetStudentTimetable() {
  return useQuery({
    // Query key for caching the timetable data
    queryKey: ['student', 'timetable'],
    // Fetch timetable data from API
    queryFn: () => getStudentTimetable(),
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 10 * 60 * 1000, // 10 minutes (timetable doesn't change frequently)
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Get Exam Marks Query Hook
 *
 * This hook fetches the student's exam marks using TanStack Query.
 * Provides automatic caching, loading states, and error handling.
 * Use this in components to display exam results with grades and percentages.
 */
export function useGetExamMarks(sessionYearId?: number | null, semesterId?: number | null) {
  return useQuery({
    queryKey: ['student', 'exam-marks', sessionYearId, semesterId],
    queryFn: () => getExamMarks({ session_year_id: sessionYearId, semester_id: semesterId }),
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 10 * 60 * 1000, // 10 minutes (exam results don't change frequently)
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Get Student Subjects Query Hook
 *
 * This hook fetches the student's subjects (core and elective) from the API.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Returns both core and elective subjects with their details including name_with_type.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export function useGetStudentSubjects() {
  return useQuery({
    // Query key for caching the subjects data
    queryKey: ['student', 'subjects'],
    // Fetch subjects data from API
    queryFn: () => getStudentSubjects(),
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 15 * 60 * 1000, // 15 minutes (subjects don't change frequently)
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Get Student Assignments Query Hook
 *
 * This hook fetches the student's assignments from the API with optional filtering.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Can filter by submission status (assigned vs submitted) and subject.
 * Returns paginated assignment data with files, subjects, and submission status.
 * Requires the user to be authenticated (token is automatically added by axios).
 */
export function useGetStudentAssignments(params: GetAssignmentsRequest = {}) {
  return useQuery({
    // Query key includes parameters for proper caching per filter combination
    queryKey: ['student', 'assignments', params],
    // Fetch assignments data from API with parameters
    queryFn: () => getStudentAssignments(params),

    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Submit Assignment Mutation Hook
 *
 * This hook handles submitting an assignment with file attachments.
 * Supports multiple file uploads (documents, images, PDFs, etc.).
 * Uses React Query for automatic error handling and loading states.
 * Automatically refetches assignments after successful submission.
 * Used in the assignment submission form/modal.
 */
export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['student', 'submit-assignment'],
    mutationFn: (request: SubmitAssignmentRequest) => submitAssignment(request),
    onSuccess: (data) => {
      // Invalidate and refetch all assignments queries
      // This ensures the UI updates to show the submission
      queryClient.invalidateQueries({
        queryKey: ['student', 'assignments'],
      });

      // Show success toast with the API message
      toastUtils.success(data.message || 'Assignment submitted successfully');
    },
    onError: (error: unknown) => {
      // Handle assignment submission errors
      // The axios interceptor converts API errors to ApiError
      const errorMessage = getErrorMessage(error);

      // Log error details for debugging
      if (isApiError(error)) {
      } else {
      }
      // Show error toast to user
      toastUtils.error(errorMessage);
    },
  });
}

/**
 * Delete Assignment Submission Mutation Hook
 *
 * This hook handles deleting an assignment submission by its ID.
 * Uses React Query for automatic error handling and loading states.
 * Automatically refetches assignments after successful deletion.
 * Used when a student wants to remove their submitted work.
 */
export function useDeleteAssignmentSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['student', 'delete-assignment-submission'],
    mutationFn: (request: DeleteAssignmentSubmissionRequest) =>
      deleteAssignmentSubmission(request),
    onSuccess: (data) => {
      // Invalidate and refetch all assignments queries
      // This ensures the UI updates to remove the submission
      queryClient.invalidateQueries({
        queryKey: ['student', 'assignments'],
      });

      // Show success toast with the API message
      toastUtils.success(
        data.message || 'Assignment submission deleted successfully'
      );
    },
    onError: (error: unknown) => {
      // Handle deletion errors
      // The axios interceptor converts API errors to ApiError
      const errorMessage = getErrorMessage(error);

      // Log error details for debugging
      if (isApiError(error)) {
      } else {
      }

      // Show error toast to user
      toastUtils.error(errorMessage);
    },
  });
}

/**
 * Get Announcements Query Hook
 *
 * This hook fetches announcements/noticeboard items for the student.
 * Uses React Query for automatic caching, error handling, and loading states.
 * Supports filtering by type (class or general) and pagination.
 *
 * Example usage in a component:
 * const { data, isLoading, error } = useGetAnnouncements({ type: 'class', page: 1 });
 */
export function useGetAnnouncements(request: GetAnnouncementsRequest) {
  return useQuery({
    // Query key includes the request parameters for proper caching
    // When type or page changes, a new query will be triggered
    queryKey: ['student', 'announcements', request.type, request.page],
    queryFn: () => getAnnouncements(request),
    // Keep the data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Enable query by default
    // You can disable it by passing enabled: false in the component
  });
}

/**
 * Get Assignments Report Query Hook
 *
 * This hook fetches assignment statistics and detailed report for a specific subject.
 * Uses React Query for automatic caching, error handling, and loading states.
 * Returns total assignments, submission counts, points, percentage, and paginated list.
 * Requires class_subject_id from the route params.
 *
 * Example usage in a component:
 * const { data, isLoading, error } = useGetAssignmentsReport({ class_subject_id: 1 });
 */
export function useGetAssignmentsReport(
  request: GetAssignmentsReportRequest | null
) {
  return useQuery({
    queryKey: ['student', 'report', 'assignments', request?.class_subject_id ?? 'all'],
    queryFn: () => getAssignmentsReport(request!),
    enabled: request !== null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Get Online Exam Report Query Hook
 *
 * This hook fetches online exam statistics and detailed report for a specific subject.
 * Uses React Query for automatic caching, error handling, and loading states.
 * Returns total exams, completion counts, points, percentage, and paginated list.
 * Requires class_subject_id from the route params.
 *
 * Example usage in a component:
 * const { data, isLoading, error } = useGetOnlineExamReport({ class_subject_id: 1 });
 */
export function useGetOnlineExamReport(
  request: GetOnlineExamReportRequest | null
) {
  return useQuery({
    // Query key includes class_subject_id for proper caching per subject
    queryKey: ['student', 'report', 'online-exam', request?.class_subject_id],
    queryFn: () => getOnlineExamReport(request!),
    // Only run query when a request is provided (0 = all subjects is valid)
    enabled: request !== null,
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Get Holidays Query Hook
 *
 * This hook fetches all holidays for the school.
 * Uses React Query for automatic caching, error handling, and loading states.
 * Returns list of all holidays with dates, titles, and descriptions.
 * No parameters required - fetches all holidays for the school.
 *
 * Example usage in a component:
 * const { data, isLoading, error } = useGetHolidays();
 */
export function useGetHolidays() {
  return useQuery({
    // Simple query key for holidays
    queryKey: ['student', 'holidays'],
    queryFn: () => getHolidays(),
    // Keep data fresh for a reasonable time since holidays don't change often
    staleTime: 30 * 60 * 1000, // 30 minutes
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Session Years Query Hook
 *
 * Fetches all available session years for the school.
 * Session years don't change often, so we cache them for a long time.
 */
export function useGetSessionYears() {
  return useQuery({
    // Simple query key for session years
    queryKey: ['student', 'session-years'],
    queryFn: () => getSessionYears(),
    // Keep data fresh for a long time since session years don't change often
    staleTime: 60 * 60 * 1000, // 1 hour
    // Retry failed requests once
    retry: 1,
  });
}

export function useGetSemesters(sessionYearId: number | null | undefined) {
  return useQuery({
    queryKey: ['student', 'semesters', sessionYearId],
    queryFn: () => getSemesters(sessionYearId!),
    enabled: !!sessionYearId,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Gallery Query Hook
 *
 * Fetches gallery images for a specific session year with pagination support.
 * Gallery data can change, so we keep it fresh for a shorter time.
 *
 * @param sessionYearId - The session year ID to fetch gallery for
 * @param offset - The offset for pagination (default: 0)
 * @param limit - The limit for pagination (default: 10)
 */
export function useGetGallery(
  sessionYearId: number,
  offset: number = 0,
  limit: number = 10
) {
  return useQuery({
    // Query key includes session year ID, offset, and limit for proper caching
    queryKey: ['student', 'gallery', sessionYearId, offset, limit],
    queryFn: () => getGallery(sessionYearId, offset, limit),
    // Only fetch if sessionYearId is provided (allow 0 as valid index)
    enabled: sessionYearId !== null && sessionYearId !== undefined,
    // Keep data fresh for a reasonable time since gallery can change
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Gallery Details Query Hook
 *
 * Fetches detailed gallery information for a specific gallery ID and session year with pagination support.
 * Gallery details can change, so we keep it fresh for a reasonable time.
 *
 * @param galleryId - The gallery ID to fetch details for
 * @param sessionYearId - The session year ID
 * @param offset - The offset for pagination (default: 0)
 * @param limit - The limit for pagination (default: 10)
 */
export function useGetGalleryDetails(
  galleryId: number,
  sessionYearId: number,
  offset: number = 0,
  limit: number = 10
) {
  return useQuery({
    // Query key includes gallery ID, session year ID, offset, and limit for proper caching
    queryKey: [
      'student',
      'gallery-details',
      galleryId,
      sessionYearId,
      offset,
      limit,
    ],
    queryFn: () => getGalleryDetails(galleryId, sessionYearId, offset, limit),
    // Only fetch if both IDs are provided (allow 0 as valid sessionYearId)
    enabled:
      !!galleryId && sessionYearId !== null && sessionYearId !== undefined,
    // Keep data fresh for a reasonable time since gallery details can change
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Retry failed requests once
    retry: 1,
  });
}

// Settings Query Hooks
/**
 * Hook to fetch settings data (privacy policy, terms, etc.)
 * Settings data is cached for a longer time since it changes infrequently
 *
 * @param type - The type of settings to fetch
 */
export function useGetSettings(
  type:
    | 'app_settings'
    | 'privacy_policy'
    | 'contact_us'
    | 'about_us'
    | 'terms_condition'
) {
  return useQuery({
    // Query key includes the type for proper caching
    queryKey: ['student', 'settings', type],
    queryFn: () => getSettingsData(type),
    // Settings data changes infrequently, so we cache it for a longer time
    staleTime: 60 * 60 * 1000, // 1 hour
    // Cache for 2 hours since settings don't change often
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Hook to fetch school settings data (footer_text and other general settings)
 * School settings data is cached for a longer time since it changes infrequently
 * This hook fetches all school settings including footer_text for the footer component
 */
export function useGetSchoolSettings(enabled: boolean = true) {
  return useQuery({
    // Query key for caching school settings data
    queryKey: ['student', 'school-settings'],
    queryFn: () => getSchoolSettings(),
    // Skip in unauthenticated contexts (e.g. token-only tracking view)
    enabled,
    // Set staleTime to 0 to ensure fresh data is fetched on every refresh/mount
    staleTime: 0,
    // Cache for 2 hours since school settings don't change often
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Hook to fetch system branding (logos, favicon, etc.)
 */
export function useGetSystemBranding() {
  return useQuery({
    queryKey: ['system', 'branding'],
    queryFn: () => getSystemBranding(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch school settings data by type (privacy_policy, terms_condition, refund_cancellation)
 * Uses the /school-settings endpoint with type query parameter
 * School settings data is cached for a longer time since it changes infrequently
 *
 * @param type - The type of school settings to fetch
 */
export function useGetSchoolSettingsByType(
  type:
    | 'privacy_policy'
    | 'terms_condition'
    | 'refund_cancellation'
    | 'about_us'
    | 'contact_us'
) {
  return useQuery({
    // Query key includes the type for proper caching
    queryKey: ['student', 'school-settings', type],
    queryFn: () => getSchoolSettingsByType(type),
    // School settings data changes infrequently, so we cache it for a longer time
    staleTime: 60 * 60 * 1000, // 1 hour
    // Cache for 2 hours since school settings don't change often
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    // Retry failed requests once
    retry: 1,
  });
}

export function useSystemBranding(schoolCode?: string) {
  return useQuery({
    queryKey: ['system-branding', schoolCode || 'default'],
    queryFn: () => getSystemBranding(schoolCode),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch student attendance data for a specific month and year
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2025)
 * @returns React Query result with attendance data
 */
export function useAttendance(month: number, year: number) {
  return useQuery({
    queryKey: ['attendance', month, year],
    queryFn: () => getAttendance(month, year),
    // Cache for 5 minutes since attendance data might change during the day
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Cache for 30 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Retry failed requests once
    retry: 1,
    // Only fetch if both month and year are valid
    enabled: month >= 1 && month <= 12 && year > 0,
  });
}

/**
 * Hook to fetch lessons for a specific subject
 * @param classSubjectId - The class subject ID
 * @returns React Query result with lessons data
 */
export function useLessons(classSubjectId: number) {
  return useQuery({
    queryKey: ['lessons', classSubjectId],
    queryFn: () => getLessons(classSubjectId),
    // Cache for 5 minutes since lessons don't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Cache for 30 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Retry failed requests once
    retry: 1,
    // Only fetch if classSubjectId is valid
    enabled: classSubjectId > 0,
  });
}

/**
 * Hook to fetch topics for a specific lesson
 * @param lessonId - The lesson ID
 * @returns React Query result with topics data
 */
export function useLessonTopics(lessonId: number) {
  return useQuery({
    queryKey: ['lesson-topics', lessonId],
    queryFn: () => getLessonTopics(lessonId),
    // Cache for 5 minutes since topics don't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Cache for 30 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Retry failed requests once
    retry: 1,
    // Only fetch if lessonId is valid
    enabled: lessonId > 0,
  });
}

/**
 * Hook to fetch subject details including lessons and announcements
 * @param subjectId - The subject ID
 * @returns React Query result with subject details
 */
export function useSubjectDetails(subjectId: string) {
  return useQuery({
    queryKey: ['subject-details', subjectId],
    queryFn: async () => {
      // First, fetch all subjects to find the correct class_subject_id
      const subjectsResponse = await getStudentSubjects();

      if (!subjectsResponse.success) {
        throw new Error(subjectsResponse.message || 'Failed to fetch subjects');
      }

      // Find the subject by ID
      const allSubjects = [
        ...(subjectsResponse.core_subjects || []),
        ...(subjectsResponse.elective_subjects || []),
      ];

      const currentSubject = allSubjects.find(
        (subject) => subject.id.toString() === subjectId
      );

      if (!currentSubject) {
        throw new Error('Subject not found');
      }

      // Fetch lessons for this subject
      const lessonsResponse = await getLessons(currentSubject.class_subject_id);

      if (lessonsResponse.error) {
        throw new Error(lessonsResponse.message || 'Failed to fetch lessons');
      }

      return {
        subject: currentSubject,
        lessons: lessonsResponse.data,
      };
    },
    // Cache for 5 minutes since subject details don't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Cache for 30 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Retry failed requests once
    retry: 1,
    // Only fetch if subjectId is valid
    enabled: !!subjectId && !isNaN(parseInt(subjectId)),
  });
}

/**
 * Hook to fetch guardian details
 * @returns React Query result with guardian details
 */
export function useGuardianDetails() {
  return useQuery({
    queryKey: ['guardian-details'],
    queryFn: getGuardianDetails,
    // Cache for 10 minutes since guardian details don't change frequently
    staleTime: 10 * 60 * 1000, // 10 minutes
    // Cache for 1 hour
    gcTime: 60 * 60 * 1000, // 1 hour
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Hook to fetch online exam list for a specific subject or all subjects
 * @param classSubjectId - The class subject ID (null for all subjects)
 * @returns React Query result with online exam list
 */
export function useOnlineExamList(classSubjectId: number | null) {
  return useQuery({
    queryKey: ['online-exam-list', classSubjectId],
    queryFn: () => getOnlineExamList({ class_subject_id: classSubjectId }),
    // Always fetch - null means "all subjects"
    enabled: true,
    // Force refetch on mount and on subject changes (including switching to "All")
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Disable caching so every selection triggers a fresh API call
    staleTime: 0,
    gcTime: 0,
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Hook to fetch online exam result list (submitted exams)
 * @param classSubjectId - The class subject ID (null for all subjects)
 */
export function useOnlineExamResultList(
  classSubjectId: number | null,
  sessionYearId?: number | null,
  semesterId?: number | null
) {
  return useQuery({
    queryKey: ['online-exam-result-list', classSubjectId, sessionYearId, semesterId],
    queryFn: () =>
      getOnlineExamResultList({
        class_subject_id: classSubjectId,
        session_year_id: sessionYearId,
        semester_id: semesterId,
      }),
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });
}

/**
 * Hook to fetch detailed online exam result
 * @param onlineExamId - The online exam ID (null to disable)
 * @returns React Query result with exam details
 */
export function useOnlineExamResult(
  onlineExamId: number | null,
  sessionYearId?: number | null
) {
  return useQuery({
    queryKey: ['online-exam-result', onlineExamId, sessionYearId],
    queryFn: () =>
      getOnlineExamResult({
        online_exam_id: onlineExamId!,
        session_year_id: sessionYearId,
      }),
    // Only fetch if onlineExamId is provided and not null
    enabled: !!onlineExamId && onlineExamId > 0,
    // Cache for 10 minutes since exam results don't change
    staleTime: 10 * 60 * 1000, // 10 minutes
    // Cache for 1 hour
    gcTime: 60 * 60 * 1000, // 1 hour
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Offline Exam List Query Hook
 *
 * Fetches the list of offline exams with status filter.
 * Uses React Query for caching and automatic refetching.
 *
 * @param status - Status filter for exams (3 for all offline exams)
 * @param enabled - Whether the query should be enabled (default: true)
 * @returns Query result with offline exam list data
 */
export function useOfflineExamList(
  status: number = 3,
  enabled: boolean = true
) {
  return useQuery({
    // Ensure status is always included as a distinct value in query key
    // Using String() to ensure 0 and other numbers are properly serialized
    queryKey: ['offline-exam-list', String(status)],
    queryFn: () => getOfflineExamList({ status }),
    // Only fetch when enabled (e.g., when on offline tab)
    enabled: enabled,
    // Always refetch when status changes (no stale time)
    staleTime: 0,
    // Disable cache time to ensure fresh data on every status change
    gcTime: 0,
    // Always refetch on mount when status changes
    refetchOnMount: 'always',
    // Refetch on window focus to get latest data
    refetchOnWindowFocus: true,
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Online Exam Questions Query Hook
 *
 * Fetches exam questions for a specific online exam using exam ID and key.
 * Uses React Query for caching and automatic refetching.
 * This hook is used when starting an exam after entering the exam key.
 *
 * @param request - The exam questions request parameters (exam_id and exam_key)
 * @returns Query result with exam questions data
 */
export function useOnlineExamQuestions(
  request: GetOnlineExamQuestionsRequest | null
) {
  return useQuery({
    queryKey: ['online-exam-questions', request?.exam_id, request?.exam_key],
    queryFn: () => getOnlineExamQuestions(request!),
    // Only fetch if both exam_id and exam_key are provided
    enabled: !!request?.exam_id && !!request?.exam_key,
    // Cache for 10 minutes since exam questions don't change during exam
    staleTime: 10 * 60 * 1000, // 10 minutes
    // Cache for 1 hour
    gcTime: 60 * 60 * 1000, // 1 hour
    // Retry failed requests once
    retry: 1,
  });
}

/**
 * Submit Online Exam Answers Mutation Hook
 *
 * Submits answers stored in Redux to the server.
 */
export function useSubmitOnlineExamAnswers() {
  return useMutation({
    mutationKey: ['online-exam', 'submit-answers'],
    mutationFn: (request: SubmitOnlineExamAnswersRequest) =>
      submitOnlineExamAnswers(request),
  });
}

/**
 * Get Student Diaries Query Hook
 *
 * This hook fetches the student's diaries from the API with optional filtering and sorting.
 * Supports filtering by subject and category, and sorting by positive/negative (category type)
 * or new/old (based on created_at/updated_at).
 * Uses React Query for automatic caching, refetching, and loading states.
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const { data, isLoading } = useGetDiaries({
 *   student_id: 77,
 *   sort: 'new',
 *   subject_id: null, // All subjects
 *   diary_category_id: null // All categories
 * });
 */
export function useGetDiaries(params: GetDiariesRequest) {
  return useQuery({
    // Query key includes all parameters explicitly for proper caching per filter combination
    // Using individual values ensures React Query detects changes when filters change
    queryKey: [
      'student',
      'diaries',
      params.student_id,
      params.sort,
      params.subject_id ?? null,
      params.diary_category_id ?? null,
    ],
    // Fetch diaries data from API with parameters
    queryFn: () => getDiaries(params),
    // Set staleTime to 0 so data is immediately considered stale
    // This ensures API is called every time filters change, even if selecting the same value again
    staleTime: 0,
    // Keep cached data for 5 minutes for quick navigation between filters
    gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
    // Always refetch when component mounts with new query key
    refetchOnMount: true,
    // Retry failed requests once
    retry: 1,
    // Only run query if student_id is available
    enabled: !!params.student_id,
  });
}

/**
 * Get Diary Categories Query Hook
 *
 * This hook fetches all diary categories from the API.
 * Returns all categories (both active and deleted) for dropdown population.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const { data, isLoading } = useGetDiaryCategories();
 */
export function useGetDiaryCategories() {
  return useQuery({
    // Query key for caching the categories data
    queryKey: ['student', 'diary-categories'],
    // Fetch categories data from API
    queryFn: () => getDiaryCategories(),
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 15 * 60 * 1000, // 15 minutes (categories don't change frequently)
    // Retry failed requests once
    retry: 1,
  });
}

// ============================================================================
// TRANSPORTATION QUERY HOOKS
// ============================================================================

/**
 * Get Transportation Dashboard Query Hook
 *
 * This hook fetches the student's transportation dashboard with plan details,
 * bus information, live tracking, and today's attendance.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Requires user_id and pickup_drop parameters.
 *
 * Example usage:
 * const { data, isLoading } = useGetTransportationDashboard({
 *   user_id: 77,
 *   pickup_drop: 0 // 0 for pickup, 1 for drop
 * });
 */
export function useGetTransportationDashboard(
  params: GetTransportationDashboardRequest | null
) {
  return useQuery({
    // Query key includes parameters for proper caching per user and trip type
    queryKey: ['student', 'transportation', 'dashboard', params],
    // Fetch dashboard data from API with parameters
    queryFn: () => getTransportationDashboard(params!),
    // Only run query if parameters are available
    enabled: !!params?.user_id,
    // Keep data fresh with shorter stale time (transportation data changes frequently)
    // staleTime: 2 * 60 * 1000, // 2 minutes
    // Retry failed requests once
    retry: 1,
    // Refetch on window focus to show latest status
    refetchOnWindowFocus: true,
  });
}

/**
 * Get Live Route Query Hook
 *
 * This hook fetches live route tracking data showing current bus location,
 * stops, passengers, and estimated arrival times.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Requires user_id parameter.
 *
 * Example usage:
 * const { data, isLoading } = useGetLiveRoute({ user_id: 77 });
 */
export function useGetLiveRoute(params: GetLiveRouteRequest | null) {
  return useQuery({
    // Query key includes user_id for proper caching per user
    queryKey: ['student', 'transportation', 'live-route', params?.user_id],
    // Fetch live route data from API
    queryFn: () => getLiveRoute(params!),
    // Only run query if user_id is available
    enabled: !!params?.user_id,
    // Keep data very fresh since live tracking changes frequently
    staleTime: 30 * 1000, // 30 seconds
    // Retry failed requests once
    retry: 1,
    // Refetch on window focus to show latest tracking
    refetchOnWindowFocus: true,
    // Auto refetch every 30 seconds for live updates
    refetchInterval: 30 * 1000,
  });
}

/**
 * Get Student Live Bus Tracking Query Hook
 *
 * Fetches the running trip + last GPS location for the logged-in student.
 * Auth/school-code are added by the studentApi interceptor. Polls every 60s
 * as recommended by the backend.
 */
export function useGetStudentLiveTracking(userId: number | null | undefined) {
  return useQuery({
    queryKey: ['student', 'transportation', 'live-tracking', userId],
    queryFn: () => getStudentLiveTracking(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
    // Respect the backend-provided cadence; fall back to 60s.
    refetchInterval: (query) => {
      const sec = query.state.data?.data?.poll_interval_sec;
      return sec && sec > 0 ? sec * 1000 : 60 * 1000;
    },
  });
}

/**
 * Live Tracking Session (token-based) Query Hook
 *
 * Redeems the X-Tracking-Token and polls at the backend-provided cadence.
 * Stops polling once the link expires or is revoked (410); never retries an
 * invalid (401) or expired (410) token; backs off on rate-limit (429).
 */
export function useTrackingSession(token: string | null | undefined) {
  return useQuery({
    queryKey: ['tracking-session', token],
    queryFn: () => getTrackingSession(token!),
    enabled: !!token,
    retry: (failureCount, error) => {
      const status = (error as TrackingSessionError)?.status;
      if (status === 401 || status === 410) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const status = (query.state.error as TrackingSessionError | null)?.status;
      // Expired / revoked -> stop polling entirely
      if (status === 410) return false;

      const data = query.state.data?.data;
      // Stop once the link has expired
      if (data?.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
        return false;
      }

      const sec = data?.poll_interval_sec;
      const base = sec && sec > 0 ? sec * 1000 : 30 * 1000;
      // Rate limited -> back off (keep last pin)
      return status === 429 ? base * 2 : base;
    },
  });
}

/**
 * Get Transportation Attendance Query Hook
 *
 * This hook fetches the student's transportation attendance history
 * with monthly records showing present/absent status for pickup and drop.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Requires user_id parameter.
 *
 * Example usage:
 * const { data, isLoading } = useGetTransportationAttendance({ user_id: 77 });
 */
export function useGetTransportationAttendance(
  params: GetTransportationAttendanceRequest | null
) {
  return useQuery({
    // Query key includes user_id for proper caching per user
    queryKey: ['student', 'transportation', 'attendance', params?.user_id],
    // Fetch attendance data from API
    queryFn: () => getTransportationAttendance(params!),
    // Only run query if user_id is available
    enabled: !!params?.user_id,
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 10 * 60 * 1000, // 10 minutes (attendance history doesn't change frequently)
    // Retry failed requests once
    retry: 1,
  });
}

// ============================================================================
// TEACHER QUERY HOOKS
// ============================================================================

/**
 * Get Teachers List Query Hook
 *
 * This hook fetches all teachers assigned to the student with their subjects.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Returns teacher details including images, contact info, and subject assignments.
 * Requires the user to be authenticated (token is automatically added by axios).
 * Requires student_id to be passed as parameter.
 *
 * Example usage:
 * const { data, isLoading, error } = useGetTeachersList(77);
 *
 * @param studentId - The student ID to fetch teachers for
 */
export function useGetTeachersList(studentId: number | null) {
  return useQuery({
    // Query key for caching the teachers list per student
    queryKey: ['student', 'teachers', studentId],
    // Fetch teachers list from API
    queryFn: () => getTeachersList({ student_id: studentId! }),
    // Only run query if studentId is available
    enabled: !!studentId && studentId > 0,
    // Keep data fresh but reduce unnecessary refetches
    staleTime: 10 * 60 * 1000, // 10 minutes (teachers don't change frequently)
    // Retry failed requests once
    retry: 1,
  });
}

// ============================================================================
// NOTIFICATIONS QUERY HOOKS
// ============================================================================

/**
 * Get Notifications Query Hook
 *
 * This hook fetches notifications for the logged-in student.
 * Uses React Query for automatic caching, refetching, and loading states.
 * Returns paginated notification data with title, message, image, and timestamps.
 * Requires the user to be authenticated (token is automatically added by axios).
 *
 * Example usage:
 * const { data, isLoading, error } = useGetNotifications({ page: 1 });
 */
export function useGetNotifications(request: GetNotificationsRequest = {}) {
  return useQuery({
    // Query key includes page, offset, and limit for proper caching
    queryKey: [
      'student',
      'notifications',
      request.page,
      request.offset,
      request.limit,
    ],
    // Fetch notifications from API
    queryFn: () => getNotifications(request),
    // Keep data fresh with shorter stale time (notifications change frequently)
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Retry failed requests once
    retry: 1,
    // Refetch on window focus to show latest notifications
    refetchOnWindowFocus: true,
  });
}

/**
 * Get Sliders Query Hook
 *
 * This hook fetches the slider images for the dashboard.
 * Uses React Query for automatic caching.
 */
export function useGetSliders() {
  return useQuery({
    queryKey: ['student', 'sliders'],
    queryFn: () => getSliders(),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}

export function useGetStudentReport(classSubjectId?: number) {
  return useQuery({
    queryKey: ['student', 'report', classSubjectId],
    queryFn: () => getStudentReport(classSubjectId!),
    enabled: classSubjectId !== undefined && classSubjectId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Tuition Media Query Hooks
 */

/**
 * Hook to create a new tuition request / requirement post
 */
export function useCreateTuitionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTuitionRequestPayload) => createTuitionRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'my-tuitions'] });
    },
  });
}

/**
 * Hook to fetch all tuition requests created by the student / guardian
 */
export function useGetMyTuitionRequests() {
  return useQuery({
    queryKey: ['student', 'my-tuitions'],
    queryFn: () => getMyTuitionRequests(),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}

/**
 * Hook to fetch applicant tutors for a given tuition post
 */
export function useGetPostApplicants(postId: number | string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['student', 'tuition-applicants', postId],
    queryFn: () => getPostApplicants(postId),
    enabled: Boolean(postId) && enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to submit rating and review for an assigned tutor
 */
export function useSubmitTutorReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TutorReview) => submitTutorReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'teachers'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'my-tuitions'] });
    },
  });
}

/**
 * Hook to confirm / select an applicant tutor
 */
export function useSelectPostApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, applicationId }: { postId: number | string; applicationId: number | string }) =>
      selectPostApplicant(postId, applicationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', 'my-tuitions'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'tuition-applicants', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'teachers'] });
    },
  });
}

