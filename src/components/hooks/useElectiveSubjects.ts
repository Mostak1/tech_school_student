import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getClassSubjects,
  selectElectiveSubjects,
  getStudentSubjects,
  GetClassSubjectsResponse,
  GetSubjectsResponse,
  SelectElectiveSubjectsRequest,
} from '@/lib/api/student/functions';

export function useElectiveSubjects() {
  const [showModal, setShowModal] = useState(false);
  const [hasCheckedElectives, setHasCheckedElectives] = useState(false);
  const queryClient = useQueryClient();

  // Fetch class subjects data (for showing available elective groups)
  const {
    data: classSubjectsData,
    isLoading: classSubjectsLoading,
    error: classSubjectsError,
  } = useQuery({
    queryKey: ['class-subjects'],
    queryFn: getClassSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch student subjects data (to check if student has already selected)
  const {
    data: studentSubjectsData,
    isLoading: studentSubjectsLoading,
    error: studentSubjectsError,
  } = useQuery({
    queryKey: ['student-subjects'],
    queryFn: getStudentSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if elective subjects modal should be shown
  useEffect(() => {
    if (classSubjectsData && studentSubjectsData && !hasCheckedElectives) {
      const classResponse = classSubjectsData as GetClassSubjectsResponse;
      const studentResponse = studentSubjectsData as GetSubjectsResponse;

      const electiveGroups = classResponse.data?.elective_subject_group;
      const studentElectiveSubjects = studentResponse.elective_subjects;
      const electiveKeyExists = studentResponse.elective_key_exists;

      // Case 1: Key Does NOT Exist - no popup needed
      // If the elective_subject key is missing, assume no elective subjects in class
      if (!electiveKeyExists) {
        setShowModal(false);
        setHasCheckedElectives(true);
        return;
      }

      // Case 2: Key EXISTS, Value is EMPTY Array - show popup
      // Student hasn't selected elective subjects yet
      if (
        studentElectiveSubjects &&
        studentElectiveSubjects.length === 0
      ) {
        setShowModal(true);
        setHasCheckedElectives(true);
        return;
      }

      // Case 3: Key EXISTS, Value Has Data
      // Check if student has selected the REQUIRED number of subjects for EACH group
      let allRequirementsMet = true;

      if (electiveGroups && Array.isArray(electiveGroups)) {
        electiveGroups.forEach((group) => {
          // Count how many subjects student selected for this group
          const selectedForGroup = studentElectiveSubjects?.filter(
            (subj) => subj.elective_subject_group_id === group.id
          ).length || 0;

          // If selected count is less than required, requirement is NOT met
          if (selectedForGroup < group.total_selectable_subjects) {
            allRequirementsMet = false;
          }
        });
      }

      // If requirements are NOT met (i.e. need to select more), SHOW modal
      if (!allRequirementsMet) {
        setShowModal(true);
        setHasCheckedElectives(true);
        return;
      }
      
      // If all requirements met, hide modal
      setShowModal(false);
      setHasCheckedElectives(true);
      return;
    }
  }, [classSubjectsData, studentSubjectsData, hasCheckedElectives]);

  // Handle saving elective subject selections
  const handleSaveElectiveSubjects = async (selectedSubjects: {
    [groupId: number]: number[];
  }) => {
    try {
      // Transform the selected subjects into the API format
      const subjectGroups: SelectElectiveSubjectsRequest['subject_group'] =
        Object.entries(selectedSubjects).map(([groupId, subjectIds]) => ({
          id: parseInt(groupId),
          class_subject_id: subjectIds,
        }));

      // Call the API to save selections
      const response = await selectElectiveSubjects({
        subject_group: subjectGroups,
      });

      if (response.success) {
        setShowModal(false);
        // Invalidate the student subjects query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['student-subjects'] });
        // You might want to show a success message here
        // toast.success('Elective subjects saved successfully!');
      } else {
        // Handle error - maybe show an error toast
        // toast.error('Failed to save elective subjects. Please try again.');
      }
    } catch (error) {
      // Handle error - maybe show an error toast
      console.error('Error saving elective subjects:', error);
      // toast.error('An error occurred while saving your selections. Please try again.');
    }
  };

  return {
    showModal,
    setShowModal,
    electiveSubjectGroups:
      classSubjectsData?.data?.elective_subject_group || [],
    isLoading: classSubjectsLoading || studentSubjectsLoading,
    error: classSubjectsError || studentSubjectsError,
    handleSaveElectiveSubjects,
  };
}
