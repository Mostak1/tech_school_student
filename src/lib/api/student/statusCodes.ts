/**
 * API Status Codes
 * Centralized status codes returned by the backend API
 */

// Authentication & Login Status Codes
export const STATUS_CODES = {
  // Success codes
  LOGIN_SUCCESS: 100,
  SUCCESS: 200,

  // Error codes - Authentication
  INVALID_LOGIN: 101,
  INVALID_PASSWORD: 109,
  INVALID_USER_DETAILS: 110,
  RESET_PASSWORD_FAILED: 108,
  INACTIVATED_USER: 116,
  INACTIVE_CHILD: 115,

  // Error codes - Validation
  VALIDATION_ERROR: 102,
  EXCEPTION_ERROR: 103,

  // Error codes - Assignment
  ASSIGNMENT_ALREADY_SUBMITTED: 104,

  // Error codes - Exam
  STUDENT_ALREADY_ATTEMPTED_EXAM: 105,
  EXAM_ALREADY_PUBLISHED: 400,
  EXAM_NOT_COMPLETED: 401,

  // Error codes - Data
  INVALID_SUBJECT_ID: 106,
  INVALID_CHILD_ID: 107,
  NOT_UNIQUE_IN_CLASS: 113,
  GRADES_NOT_FOUND: 114,

  // Error codes - Payment
  ENABLE_PAYMENT_GATEWAY: 404,
  FEE_ALREADY_PAID: 405,
} as const;

// Type for status codes
export type StatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];

/**
 * Get user-friendly error message based on status code
 * Returns appropriate message to display to the user
 */
export const getStatusMessage = (statusCode: number): string => {
  switch (statusCode) {
    // Success messages
    case STATUS_CODES.LOGIN_SUCCESS:
      return 'Login successful! Redirecting...';
    case STATUS_CODES.SUCCESS:
      return 'Operation completed successfully';

    // Authentication errors
    case STATUS_CODES.INVALID_LOGIN:
      return 'Invalid school code, GR number, or password. Please try again.';
    case STATUS_CODES.INVALID_PASSWORD:
      return 'Current password is incorrect. Please check and try again.';
    case STATUS_CODES.INVALID_USER_DETAILS:
      return 'Invalid user details. Please verify your credentials.';
    case STATUS_CODES.RESET_PASSWORD_FAILED:
      return 'Password reset failed. Please try again.';
    case STATUS_CODES.INACTIVATED_USER:
      return 'Your account has been deactivated. Please contact administrator.';
    case STATUS_CODES.INACTIVE_CHILD:
      return 'This student account is inactive. Please contact administrator.';

    // Validation errors
    case STATUS_CODES.VALIDATION_ERROR:
      return 'Please check all required fields and try again.';
    case STATUS_CODES.EXCEPTION_ERROR:
      return 'An error occurred. Please try again later.';

    // Assignment errors
    case STATUS_CODES.ASSIGNMENT_ALREADY_SUBMITTED:
      return 'You have already submitted this assignment.';

    // Exam errors
    case STATUS_CODES.STUDENT_ALREADY_ATTEMPTED_EXAM:
      return 'You have already attempted this exam.';
    case STATUS_CODES.EXAM_ALREADY_PUBLISHED:
      return 'This exam has already been published.';
    case STATUS_CODES.EXAM_NOT_COMPLETED:
      return 'Exam is not completed yet.';

    // Data errors
    case STATUS_CODES.INVALID_SUBJECT_ID:
      return 'Invalid subject selected. Please try again.';
    case STATUS_CODES.INVALID_CHILD_ID:
      return 'Invalid student selected. Please try again.';
    case STATUS_CODES.NOT_UNIQUE_IN_CLASS:
      return 'Record is not unique in class.';
    case STATUS_CODES.GRADES_NOT_FOUND:
      return 'Grades not found for this student.';

    // Payment errors
    case STATUS_CODES.ENABLE_PAYMENT_GATEWAY:
      return 'Payment gateway is not enabled. Please contact administrator.';
    case STATUS_CODES.FEE_ALREADY_PAID:
      return 'Fee has already been paid.';

    // Default fallback
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Check if status code indicates success
 */
export const isSuccessCode = (statusCode: number): boolean => {
  return (
    statusCode === STATUS_CODES.LOGIN_SUCCESS ||
    statusCode === STATUS_CODES.SUCCESS
  );
};

/**
 * Check if status code indicates authentication error
 */
export const isAuthError = (statusCode: number): boolean => {
  const authErrorCodes = [
    STATUS_CODES.INVALID_LOGIN,
    STATUS_CODES.INVALID_PASSWORD,
    STATUS_CODES.INVALID_USER_DETAILS,
    STATUS_CODES.INACTIVATED_USER,
    STATUS_CODES.INACTIVE_CHILD,
  ] as const;

  return (authErrorCodes as readonly number[]).includes(statusCode);
};
