/**
 * Tuition Media Types for Student & Guardian Web Portal
 */

export type TuitionPostStatus = 'pending' | 'approved' | 'matched' | 'closed' | string;

export interface AssignedTutor {
  id: number;
  name: string;
  image?: string;
  university?: string;
  department?: string;
  experience_years?: string | number;
  phone?: string;
  rating?: number;
  total_reviews?: number;
}

export interface TuitionPost {
  id: number;
  job_code: string;
  title: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  student_gender?: 'male' | 'female' | 'any' | string;
  class_grade: string;
  medium: string;
  subjects: string;
  days_per_week: string;
  preferred_tutor_gender?: 'male' | 'female' | 'any' | string;
  preferred_gender?: 'male' | 'female' | 'any' | string;
  salary: number | string;
  location_district: string;
  location_area: string;
  address?: string;
  student_institute?: string;
  special_requirements?: string;
  status: TuitionPostStatus;
  applications_count?: number;
  assigned_tutor?: AssignedTutor | null;
  created_at: string;
  updated_at?: string;
}

export interface TuitionApplication {
  id?: number;
  application_id: number;
  tutor_id: number;
  tutor_name: string;
  university?: string;
  department?: string;
  experience_years?: string | number;
  expected_salary: number | string;
  is_verified?: boolean | number;
  rating?: number;
  total_reviews?: number;
  cover_note?: string;
  status?: 'applied' | 'shortlisted' | 'confirmed' | 'rejected' | string;
  image?: string;
  phone?: string;
  created_at?: string;
}

export interface TutorReview {
  tutor_id: number;
  rating: number; // 1 to 5
  comment?: string;
}

export interface CreateTuitionRequestPayload {
  title?: string;
  class_grade: string;
  medium: string;
  subjects: string;
  days_per_week: string;
  preferred_gender?: string;
  preferred_tutor_gender?: string;
  salary: number | string;
  location_district: string;
  location_area: string;
  student_gender?: string;
  student_institute?: string;
  special_requirements?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
}

export interface TuitionBill {
  id: number;
  invoice_no: string;
  month: string;
  tutor_name: string;
  subject: string;
  tuition_fee: number;
  platform_charge: number;
  total_amount: number;
  status: 'paid' | 'unpaid' | 'pending';
  due_date: string;
  payment_method?: string;
  paid_at?: string;
}

