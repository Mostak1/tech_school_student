'use client';

import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';

export type InstituteType = 'school' | 'coaching' | 'tuition_media';

export interface UseInstituteTypeReturn {
  instituteType: InstituteType;
  isTuitionMedia: boolean;
  isCoaching: boolean;
  isSchool: boolean;
  isLoading: boolean;
}

/**
 * Hook to detect institute type from school settings
 * Returns current type and boolean convenience flags
 */
export function useInstituteType(): UseInstituteTypeReturn {
  const { data: schoolSettings, isLoading } = useGetSchoolSettings();

  const rawType =
    (schoolSettings?.data?.settings?.institute_type as string) ||
    (schoolSettings?.data?.institute_type as string) ||
    'school';

  const normalized = (typeof rawType === 'string' ? rawType.toLowerCase().trim() : 'school') as InstituteType;
  const instituteType: InstituteType =
    normalized === 'tuition_media' || normalized === 'coaching' ? normalized : 'school';

  return {
    instituteType,
    isTuitionMedia: instituteType === 'tuition_media',
    isCoaching: instituteType === 'coaching',
    isSchool: instituteType === 'school',
    isLoading,
  };
}

export default useInstituteType;

