import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Offline Exam interface for Redux store
 * Based on offline exam API response structure
 */
export interface OfflineExamData {
  id: number;
  name: string;
  description: string;
  exam_starting_date: string;
  exam_ending_date: string;
  publish: number;
  session_year: string;
  exam_status: string;
}

/**
 * Online Exam interface for Redux store
 * Based on online exam API response structure
 */
export interface OnlineExamData {
  id: number;
  title: string;
  subject_with_name: string;
  start_date: string;
  end_date: string;
  total_marks: number;
  exam_key: number;
  duration: number;
  exam_status_name: string;
}

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
 * Student Answer Interface
 * Represents a student's answer to a question
 */
export interface StudentAnswer {
  questionId: number;
  optionId: number;
  isCorrect: boolean;
}

/**
 * Union type for exam data
 */
export type ExamData = OfflineExamData | OnlineExamData;

/**
 * Exam state interface
 * Defines the structure of the exam slice state
 */
interface ExamState {
  // Store all exams data
  exams: ExamData[];

  // Store currently selected exam for exam key validation
  selectedExam: ExamData | null;

  // Store exam keys for validation (examId -> examKey mapping)
  examKeys: Record<number, number>;

  // Store exam questions and answers
  examQuestions: OnlineExamQuestion[];
  studentAnswers: StudentAnswer[];
  currentQuestionIndex: number;
  examStarted: boolean;
  examCompleted: boolean;

  // Exam metadata
  totalQuestions: number;
  totalMarks: number;
  examKey: string;

  // Loading states
  loading: boolean;

  // Error handling
  error: string | null;
}

// Initial state
const initialState: ExamState = {
  exams: [],
  selectedExam: null,
  examKeys: {},
  examQuestions: [],
  studentAnswers: [],
  currentQuestionIndex: 0,
  examStarted: false,
  examCompleted: false,
  totalQuestions: 0,
  totalMarks: 0,
  examKey: '',
  loading: false,
  error: null,
};

/**
 * Exam Redux Slice
 *
 * Manages exam data, selected exam, and exam key validation
 * Provides actions for storing exam data and validating exam keys
 */
const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Store exams data from API
     * Replaces existing exams with new data
     */
    setExams: (state, action: PayloadAction<ExamData[]>) => {
      state.exams = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Add or update a single exam
     * Useful for adding new exams or updating existing ones
     */
    setExam: (state, action: PayloadAction<ExamData>) => {
      const examIndex = state.exams.findIndex(
        (exam) => exam.id === action.payload.id
      );

      if (examIndex >= 0) {
        // Update existing exam
        state.exams[examIndex] = action.payload;
      } else {
        // Add new exam
        state.exams.push(action.payload);
      }
    },

    /**
     * Set selected exam for exam key validation
     * This is called when user clicks "Start Exam" button
     */
    setSelectedExam: (state, action: PayloadAction<ExamData | null>) => {
      state.selectedExam = action.payload;
    },

    /**
     * Store exam key for an exam
     * Maps exam ID to its corresponding exam key for validation
     */
    setExamKey: (
      state,
      action: PayloadAction<{ examId: number; examKey: number }>
    ) => {
      const { examId, examKey } = action.payload;
      state.examKeys[examId] = examKey;
    },

    /**
     * Validate exam key against stored exam data
     * Returns true if the provided exam key matches the stored key for the selected exam
     */
    validateExamKey: (state, action: PayloadAction<string>) => {
      const providedKey = parseInt(action.payload);

      if (!state.selectedExam) {
        state.error = 'No exam selected for validation';
        return;
      }

      const storedKey = state.examKeys[state.selectedExam.id];

      if (!storedKey) {
        state.error = 'Exam key not found for this exam';
        return;
      }

      if (providedKey !== storedKey) {
        state.error = 'Invalid exam key. Please check and try again.';
        return;
      }

      // If validation passes, clear any previous errors
      state.error = null;
    },

    /**
     * Clear selected exam and reset validation state
     * Called when modal is closed or exam is completed
     */
    clearSelectedExam: (state) => {
      state.selectedExam = null;
      state.error = null;
    },

    /**
     * Set exam questions from API response
     * Called when exam questions are successfully fetched
     */
    setExamQuestions: (
      state,
      action: PayloadAction<{
        questions: OnlineExamQuestion[];
        totalQuestions: number;
        totalMarks: number;
        examKey: string;
      }>
    ) => {
      const { questions, totalQuestions, totalMarks, examKey } = action.payload;
      state.examQuestions = questions;
      state.totalQuestions = totalQuestions;
      state.totalMarks = totalMarks;
      state.examKey = examKey;
      state.currentQuestionIndex = 0;
      state.studentAnswers = [];
      state.examStarted = true;
      state.examCompleted = false;
      state.loading = false;
      state.error = null;
    },

    /**
     * Set student answer for a question
     * Called when student selects an option
     */
    setStudentAnswer: (
      state,
      action: PayloadAction<{
        questionId: number;
        optionId: number;
        isCorrect: boolean;
      }>
    ) => {
      const { questionId, optionId, isCorrect } = action.payload;

      // Find existing answer for this question
      const existingAnswerIndex = state.studentAnswers.findIndex(
        (answer) => answer.questionId === questionId
      );

      const newAnswer: StudentAnswer = {
        questionId,
        optionId,
        isCorrect,
      };

      if (existingAnswerIndex >= 0) {
        // Update existing answer
        state.studentAnswers[existingAnswerIndex] = newAnswer;
      } else {
        // Add new answer
        state.studentAnswers.push(newAnswer);
      }
    },

    /**
     * Set multiple student answers at once
     * Useful for restoring state from storage
     */
    setStudentAnswers: (state, action: PayloadAction<StudentAnswer[]>) => {
      state.studentAnswers = action.payload;
    },

    /**
     * Navigate to next question
     */
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.totalQuestions - 1) {
        state.currentQuestionIndex += 1;
      }
    },

    /**
     * Navigate to previous question
     */
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },

    /**
     * Navigate to specific question by index
     */
    goToQuestion: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.totalQuestions) {
        state.currentQuestionIndex = index;
      }
    },

    /**
     * Complete the exam
     * Called when exam is submitted or timer expires
     */
    completeExam: (state) => {
      state.examCompleted = true;
      state.examStarted = false;
    },

    /**
     * Reset exam state
     * Called when starting a new exam or closing exam
     */
    resetExam: (state) => {
      state.examQuestions = [];
      state.studentAnswers = [];
      state.currentQuestionIndex = 0;
      state.examStarted = false;
      state.examCompleted = false;
      state.totalQuestions = 0;
      state.totalMarks = 0;
      state.examKey = '';
      state.error = null;
    },

    /**
     * Clear all exam data
     * Useful for logout or reset functionality
     */
    clearAllExams: (state) => {
      state.exams = [];
      state.selectedExam = null;
      state.examKeys = {};
      state.examQuestions = [];
      state.studentAnswers = [];
      state.currentQuestionIndex = 0;
      state.examStarted = false;
      state.examCompleted = false;
      state.totalQuestions = 0;
      state.totalMarks = 0;
      state.examKey = '';
      state.loading = false;
      state.error = null;
    },
  },
});

// Export actions
export const {
  setLoading,
  setError,
  clearError,
  setExams,
  setExam,
  setSelectedExam,
  setExamKey,
  validateExamKey,
  clearSelectedExam,
  setExamQuestions,
  setStudentAnswer,
  setStudentAnswers,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  completeExam,
  resetExam,
  clearAllExams,
} = examSlice.actions;

// Export reducer
export default examSlice.reducer;

// Selector functions for easy access to state
export const selectExams = (state: { exam: ExamState }) => state.exam.exams;
export const selectSelectedExam = (state: { exam: ExamState }) =>
  state.exam.selectedExam;
export const selectExamKeys = (state: { exam: ExamState }) =>
  state.exam.examKeys;
export const selectExamLoading = (state: { exam: ExamState }) =>
  state.exam.loading;
export const selectExamError = (state: { exam: ExamState }) => state.exam.error;

// New selectors for exam questions and answers
export const selectExamQuestions = (state: { exam: ExamState }) =>
  state.exam.examQuestions;
export const selectStudentAnswers = (state: { exam: ExamState }) =>
  state.exam.studentAnswers;
export const selectCurrentQuestionIndex = (state: { exam: ExamState }) =>
  state.exam.currentQuestionIndex;
export const selectExamStarted = (state: { exam: ExamState }) =>
  state.exam.examStarted;
export const selectExamCompleted = (state: { exam: ExamState }) =>
  state.exam.examCompleted;
export const selectTotalQuestions = (state: { exam: ExamState }) =>
  state.exam.totalQuestions;
export const selectTotalMarks = (state: { exam: ExamState }) =>
  state.exam.totalMarks;
export const selectExamKey = (state: { exam: ExamState }) => state.exam.examKey;

// Computed selectors
export const selectCurrentQuestion = (state: { exam: ExamState }) => {
  const questions = state.exam.examQuestions;
  const currentIndex = state.exam.currentQuestionIndex;
  return questions[currentIndex] || null;
};

export const selectStudentAnswerForQuestion =
  (questionId: number) => (state: { exam: ExamState }) => {
    return (
      state.exam.studentAnswers.find(
        (answer) => answer.questionId === questionId
      ) || null
    );
  };

export const selectAnsweredQuestionsCount = (state: { exam: ExamState }) => {
  return state.exam.studentAnswers.length;
};

export const selectCorrectAnswersCount = (state: { exam: ExamState }) => {
  return state.exam.studentAnswers.filter((answer) => answer.isCorrect).length;
};
