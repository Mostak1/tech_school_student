'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { CustomTabs, TabContent } from '@/components/ui/custom-tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BiHomeSmile,
  BiSearch,
  BiChevronDown,
  BiDownload,
  BiUpload,
  BiBookContent,
  BiFile,
  BiFilter,
  BiX,
  BiLinkExternal,
  BiLink,
  BiUndo,
  BiInfoCircle,
} from 'react-icons/bi';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useGetStudentSubjects,
  useGetStudentAssignments,
  useSubmitAssignment,
  useDeleteAssignmentSubmission,
  useGetSchoolSettings,
} from '@/lib/api/student/queryHooks';
import { Assignment } from '@/lib/api/student/functions';
import Image from 'next/image';
import { toastUtils } from '@/components/lib/toast';
import { useTranslate } from '@/components/hooks/useTranslate';

/**
 * Assignments Page Component
 *
 * Displays student assignments with tab navigation (Assigned/Submitted)
 * Features search, filtering, and assignment management
 */
export default function AssignmentsPage() {
  const { collapsed } = useSidebar();
  const translate = useTranslate();
  const router = useRouter();

  // Fetch school settings to check for feature access
  const { data: schoolSettings, isLoading: isLoadingSettings } =
    useGetSchoolSettings();

  // Check feature permission and redirect if disabled
  useEffect(() => {
    // Skip check while loading
    if (isLoadingSettings || !schoolSettings?.data) return;

    const enabledFeatures = schoolSettings.data.features || {};

    const isFeatureEnabled = (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase(),
      );
    };

    if (!isFeatureEnabled('Assignment Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  const [activeTab, setActiveTab] = useState<string>('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  // Sort by state - using API format: assigned_latest, assigned_oldest, due_latest, due_oldest
  const [sortBy, setSortBy] = useState('assigned_latest');

  // Debounce search term to avoid excessive API calls
  // Wait 500ms after user stops typing before updating debouncedSearchTerm
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear existing timeout if user types again
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout to update debounced search term after 500ms
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    // Cleanup timeout on unmount or when searchTerm changes
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch subjects from API
  const { data: subjectsData, isLoading: isLoadingSubjects } =
    useGetStudentSubjects();

  // Fetch assignments from API based on active tab
  // is_submitted: 0 for assigned tab (not submitted)
  // is_submitted: 1 for submitted tab (submitted)
  // search: debounced search term passed to API for server-side filtering
  // sort: sort parameter passed to API for server-side sorting
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isError: isAssignmentsError,
  } = useGetStudentAssignments({
    ...(activeTab === 'assigned' && { is_submitted: 0 }),
    ...(activeTab === 'submitted' && { is_submitted: 1 }),
    ...(selectedSubject !== 'all' && {
      class_subject_id: parseInt(selectedSubject),
    }),
    ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() }),
    // Pass sort parameter to API for server-side sorting
    sort: sortBy,
  });

  // Get assignments from API response
  // API now handles sorting server-side, so we use assignments directly
  const assignments = assignmentsData?.data?.data || [];
  // Use assignments directly since API handles sorting
  const sortedAssignments = assignments;

  // State for managing expanded/collapsed files for each assignment
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  // State for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    number | null
  >(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'file' | 'link' | null>(null);
  const [linkSubmission, setLinkSubmission] = useState('');

  // Mutation hooks for submit and delete operations
  const submitMutation = useSubmitAssignment();
  const deleteMutation = useDeleteAssignmentSubmission();

  // State for edit assignment modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(
    null,
  );
  // const [editAssignmentName, setEditAssignmentName] = useState('');
  const [editUploadedFiles, setEditUploadedFiles] = useState<File[]>([]);
  const [editUploadMode, setEditUploadMode] = useState<'file' | 'link' | null>(
    null,
  );
  const [editLinkSubmission, setEditLinkSubmission] = useState('');

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(
    null,
  );
  const [actionType, setActionType] = useState<'delete' | 'undo'>('delete');
  const [undoUploadedFiles, setUndoUploadedFiles] = useState<File[]>([]);
  const [undoUploadMode, setUndoUploadMode] = useState<'file' | 'link' | null>(
    null,
  );
  const [undoLinkSubmission, setUndoLinkSubmission] = useState('');

  // Combine core and elective subjects from API
  const subjects = useMemo(() => {
    if (!subjectsData) return [];

    const coreSubjects = subjectsData.core_subjects || [];
    const electiveSubjects = subjectsData.elective_subjects || [];

    return [...coreSubjects, ...electiveSubjects];
  }, [subjectsData]);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('assignments'),
    },
  ];

  // Helper function to check if file is a link (YouTube or Other Link)
  const isFileLink = (fileType: string) => {
    return fileType === '2' || fileType === '4';
  };

  // Handle file download or open link
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle opening link in new tab
  const handleOpenLink = (fileUrl: string) => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper function to format file name with extension
  const formatFileName = (fileName: string, fileExtension: string) => {
    if (!fileName) return 'Attachment';

    const lowerFileName = fileName.toLowerCase();
    const lowerExtension = fileExtension.toLowerCase();

    if (lowerFileName.endsWith(`.${lowerExtension}`)) {
      return fileName;
    } else {
      return fileExtension ? `${fileName} (.${lowerExtension})` : fileName;
    }
  };

  // Handle assignment upload - show selection modal
  const handleAssignmentUpload = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    setUploadMode(null);
    setLinkSubmission('');
    setUploadedFiles([]);
    setIsUploadModalOpen(true);
  };

  // Handle file selection - support multiple files
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle file drop - support multiple files
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle removing a specific file from the list
  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsUploadModalOpen(false);
    setSelectedAssignmentId(null);
    setUploadedFiles([]);
    setLinkSubmission('');
    setUploadMode(null);
  };

  // Handle file upload submission using API
  const handleUploadSubmit = () => {
    if (uploadMode === 'link') {
      if (!linkSubmission.trim()) {
        toastUtils.error(translate('pleaseEnterLink'));
        return;
      }
    } else {
      if (uploadedFiles.length === 0) {
        toastUtils.error(translate('pleaseSelectAtLeastOneFile'));
        return;
      }
    }

    if (!selectedAssignmentId) {
      toastUtils.error(translate('noAssignmentSelected'));
      return;
    }

    submitMutation.mutate(
      {
        assignment_id: selectedAssignmentId.toString(),
        files: uploadedFiles,
        link: uploadMode === 'link' ? linkSubmission : undefined,
      },
      {
        onSuccess: () => {
          handleModalClose();
        },
      },
    );
  };

  // Handle edit submitted file - open edit modal

  // Handle resubmit file - same as upload, opens modal to resubmit
  // const handleResubmitFile = (assignmentId: number) => {
  //   setSelectedAssignmentId(assignmentId);
  //   setIsUploadModalOpen(true);
  // };

  // Handle remove submitted file - open delete confirmation dialog
  const handleRemoveSubmittedFile = (
    assignmentId: number,
    type: 'delete' | 'undo' = 'delete',
  ) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment || !assignment.submission) {
      toastUtils.error(translate('noSubmissionFoundToDelete'));
      return;
    }

    setAssignmentToDelete(assignmentId);
    setActionType(type);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!assignmentToDelete) return;

    const assignment = assignments.find((a) => a.id === assignmentToDelete);
    if (!assignment || !assignment.submission) {
      toastUtils.error(translate('noSubmissionFoundToDelete'));
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      return;
    }

    deleteMutation.mutate(
      {
        assignment_submission_id: assignment.submission.id.toString(),
      },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setAssignmentToDelete(null);
        },
      },
    );
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setAssignmentToDelete(null);
    setUndoUploadMode(null);
    setUndoUploadedFiles([]);
    setUndoLinkSubmission('');
  };

  // Handle undo modal file selection
  const handleUndoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUndoUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle undo modal file drop
  const handleUndoFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUndoUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle undo modal drag over
  const handleUndoDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle removing a specific file from the undo list
  const handleUndoRemoveFile = (index: number) => {
    setUndoUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle undo assignment submission (Resubmit)
  const handleUndoSubmit = () => {
    if (undoUploadMode === 'link') {
      if (!undoLinkSubmission.trim()) {
        toastUtils.error(translate('pleaseEnterLink'));
        return;
      }
    } else {
      if (undoUploadedFiles.length === 0) {
        toastUtils.error(translate('pleaseSelectAtLeastOneFile'));
        return;
      }
    }

    if (!assignmentToDelete) {
      toastUtils.error(translate('noAssignmentSelected'));
      return;
    }

    submitMutation.mutate(
      {
        assignment_id: assignmentToDelete.toString(),
        files: undoUploadedFiles,
        link: undoUploadMode === 'link' ? undoLinkSubmission : undefined,
      },
      {
        onSuccess: () => {
          handleDeleteDialogClose();
        },
      },
    );
  };

  // Handle edit modal file selection
  const handleEditFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setEditUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle edit modal file drop
  const handleEditFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setEditUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle edit modal drag over
  const handleEditDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle removing a specific file from the edit list
  const handleEditRemoveFile = (index: number) => {
    setEditUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingAssignmentId(null);
    setEditUploadedFiles([]);
    setEditLinkSubmission('');
    setEditUploadMode(null);
  };

  // Handle edit assignment submission
  const handleEditSubmit = () => {
    if (editUploadMode === 'link') {
      if (!editLinkSubmission.trim()) {
        toastUtils.error(translate('pleaseEnterLink'));
        return;
      }
    } else {
      if (editUploadedFiles.length === 0) {
        toastUtils.error(translate('pleaseSelectAtLeastOneFile'));
        return;
      }
    }

    if (!editingAssignmentId) {
      toastUtils.error(translate('noAssignmentSelected'));
      return;
    }

    submitMutation.mutate(
      {
        assignment_id: editingAssignmentId.toString(),
        files: editUploadedFiles,
        link: editUploadMode === 'link' ? editLinkSubmission : undefined,
      },
      {
        onSuccess: () => {
          handleEditModalClose();
        },
      },
    );
  };

  // Toggle files visibility for an assignment
  const toggleFiles = (assignmentId: number) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  // Helper function to parse date string "DD-MM-YYYY HH:mm A" to Date object
  // The API returns dates in format "DD-MM-YYYY HH:mm A" (e.g., "05-01-2026 12:32 PM")
  const parseDateString = (dateString: string): Date => {
    if (!dateString) return new Date(0); // Return epoch if undefined/null

    // console.log('Parsing dateString:', dateString);
    const [datePart, timePart, period] = dateString.split(' ');

    if (!datePart || !timePart) return new Date(dateString); // Fallback to standard parsing if format doesn't match

    // Handle both - and / as separators
    const separator = datePart.includes('/') ? '/' : '-';
    const [day, month, year] = datePart.split(separator);
    const [hours, minutes] = timePart.split(':');

    let hoursInt = parseInt(hours);
    const minutesInt = parseInt(minutes);

    // Convert to 24-hour format
    if (period === 'PM' && hoursInt !== 12) {
      hoursInt += 12;
    } else if (period === 'AM' && hoursInt === 12) {
      hoursInt = 0;
    }

    return new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed in JavaScript Date
      parseInt(day),
      hoursInt,
      minutesInt,
    );
  };

  // Helper function to format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = parseDateString(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  // Helper function to check if upload button should be shown for assigned assignments
  // This checks the same conditions as assignedUploadButton but without rendering
  const hasUploadButton = (assignment: Assignment): boolean => {
    const {
      resubmission,
      submission,
      due_date_original,
      extra_days_for_resubmission,
    } = assignment;
    const status = submission?.status;
    const now = new Date();
    const due = parseDateString(due_date_original);

    // Calculate extended due date including extra days
    const extendedDueDate = new Date(due);
    if (extra_days_for_resubmission) {
      extendedDueDate.setDate(due.getDate() + extra_days_for_resubmission);
    }

    const isBeforeDueDate = extendedDueDate > now;

    if (isBeforeDueDate) {
      // Case 1: No submission & no resubmission
      if (!submission && resubmission === 0) {
        return true;
      }
      // Case 2: No submission but resubmission allowed
      if (!submission && resubmission === 1) {
        return true;
      }
      // Case 3 & 4: Rejected or Resubmitted with resubmission allowed
      if ([2, 3].includes(status || 0) && resubmission === 1) {
        return true;
      }
    }
    return false;
  };

  // Helper function to check if submitted files should be shown
  // This checks the same conditions as renderSubmittedButtons but without rendering
  const hasSubmittedFiles = (assignment: Assignment): boolean => {
    return !!(
      assignment.submission &&
      assignment.submission.file &&
      assignment.submission.file.length > 0
    );
  };

  // Helper function to render upload button for assigned assignments
  const assignedUploadButton = (assignment: Assignment) => {
    if (!hasUploadButton(assignment)) {
      return null;
    }

    return (
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expandedFiles.has(assignment.id)
            ? 'max-h-20 opacity-100 mb-4'
            : 'max-h-0 opacity-0 mb-0'
        }`}
      >
        <div className="flex justify-start mb-4">
          <button
            onClick={() => handleAssignmentUpload(assignment.id)}
            className="bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-6 py-2 rounded-[4px] text-base font-normal flex items-center gap-2 transition-colors duration-200"
          >
            {translate('uploadAssignment')}
            <BiUpload className="text-xl" />
          </button>
        </div>
      </div>
    );
  };

  // Helper function to render buttons for submitted assignments
  const renderSubmittedButtons = (assignment: Assignment) => {
    const dueDate = assignment?.due_date_original;
    const submission = assignment?.submission;
    const status = submission?.status;
    const appendedDays = assignment?.extra_days_for_resubmission;
    // console.log('resubmission', resubmission, 'submission', submission);

    // Parse due date and get current date

    const due = parseDateString(dueDate);

    //  addition of due date with appended days for resubmission
    const dueDateWithAppendedDays = new Date(due);
    dueDateWithAppendedDays.setDate(due.getDate() + (appendedDays || 0));

    // Check if current date is past due date
    // console.log(isPastDueDate);

    // status 1 = accepted
    // status 2 = rejected
    // status 3 = resubmitted
    // status 0 = in review

    // Determine which case applies for buttons

    // if (isFirstAssignment) {
    //   console.log('Final buttonCase:', buttonCase);
    //   console.log('=== END DEBUGGING FIRST ASSIGNMENT ===');
    // }

    // Always show files if they exist, regardless of buttonCase
    // But only show buttons when buttonCase is 'edit-reupload-delete'
    if (
      !assignment.submission ||
      !assignment.submission.file ||
      assignment.submission.file.length === 0
    ) {
      return null;
    }

    return (
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-white rounded-lg border border-gray-200 ${
          expandedFiles.has(assignment.id)
            ? 'max-h-[500px] opacity-100 mb-4 p-3 sm:p-4'
            : 'max-h-0 opacity-0 mb-0'
        }`}
      >
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {translate('yourSubmittedFiles')}
          </h4>
          <div className="space-y-2">
            {assignment.submission.file.map((file) => (
              <div key={file.id}>
                <div className="flex items-start justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {isFileLink(file.type) ? (
                      <BiLink className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <BiFile className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                      <span className="text-sm text-gray-900 break-all leading-snug">
                        {file.file_name || translate('submission')}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0 w-fit">
                        {file.type_detail}
                      </span>
                    </div>
                  </div>
                  {/* download/link button */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {isFileLink(file.type) ? (
                      <button
                        onClick={() => handleOpenLink(file.file_url)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200"
                        title={translate('openLink')}
                      >
                        <BiLinkExternal className="w-5 h-5 text-gray-600" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleFileDownload(file.file_url, file.file_name)
                        }
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200"
                        title={translate('download')}
                      >
                        <BiDownload className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {assignment.submission && assignment.submission.feedback && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-1">
                {translate('teacherFeedback')}
              </h5>
              <p className="text-sm text-blue-800">
                {assignment.submission?.feedback}
              </p>
            </div>
          )}
          {assignment.submission && assignment.submission.points !== null && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="text-sm font-medium text-green-900 mb-1">
                {translate('pointsAwarded')}
              </h5>
              <p className="text-sm text-green-800 font-semibold">
                {assignment.submission.points} /{' '}
                {assignment.points || translate('notAvailable')}
              </p>
            </div>
          )}

          {/* Undo Submission Button - Only shown before due date (with extra days) */}
          {(() => {
            const now = new Date();
            const due = parseDateString(assignment.due_date_original);
            const appendedDays = assignment?.extra_days_for_resubmission || 0;
            const dueDateWithAppendedDays = new Date(due);
            dueDateWithAppendedDays.setDate(due.getDate() + appendedDays);
            const isBeforeDueDate = now < dueDateWithAppendedDays;

            // Only show undo button if current date is before due date (with extra days)
            // And hide it if the assignment has already been accepted
            if (!isBeforeDueDate || status === 1) return null;

            return (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
                
                <button
                  onClick={() =>
                    handleRemoveSubmittedFile(assignment.id, 'undo')
                  }
                  className={`bg-(--primary-color) text-white flex items-center justify-center hover:bg-opacity-90 transition-colors shadow-md ${
                    status === 2
                      ? 'px-6 py-2 w-auto h-auto rounded-[4px]'
                      : 'w-10 h-10 rounded-full'
                  }`}
                  title={ 
                    status === 2
                      ? translate('uploadAssignment')
                      : translate('undo') || 'Undo'
                  }
                >
                  {status === 2 ? (
                    <div className="flex items-center gap-2">
                      <span>{translate('uploadAssignment')}</span>
                      <BiUpload className="text-xl" />
                    </div>
                  ) : (
                    <BiUndo className="w-6 h-6" />
                  )}
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb title={translate('assignments')} items={breadcrumbItems} />

      {/* Custom Tabs */}
      <div className="bg-white rounded-[12px] border border-gray-200 overflow-x-auto">
        <CustomTabs
          items={[
            {
              id: 'assigned',
              label: translate('assigned'),
            },
            {
              id: 'submitted',
              label: translate('submitted'),
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-4 bg-white border-b border-gray-200 px-4 pt-4"
          buttonClassName="px-0 pb-3 pt-0"
          isActiveClassName="bg-white pb-3 pt-0"
        />

        {/* Assigned Tab Content */}
        <TabContent value="assigned" activeTab={activeTab}>
          <div className="px-4 pb-4">
            {/* Search and Filters - Responsive for all screen sizes */}
            <div className="flex flex-wrap flex-col lg:flex-row gap-4 mb-4 justify-between">
              {/* Search Bar */}
              <div className="flex-1 lg:flex-none">
                <div className="relative w-full lg:w-[350px] bg-[var(--light-primary-color)]">
                  <Input
                    type="text"
                    placeholder={translate('searchAssignments')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 rounded-[4px] h-[40px] shadow-none"
                  />
                  <Button className="absolute right-[6px] top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 bg-(--primary-color) rounded-[4px]">
                    <BiSearch className="text-xl text-white" />
                  </Button>
                </div>
              </div>

              {/* Filters Container - Responsive layout */}
              <div className="flex flex-col md:flex-row flex-wrap gap-4 lg:gap-6">
                {/* Subject Filter */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span className="text-sm md:text-base font-normal text-gray-900 whitespace-nowrap">
                    {translate('subject')}
                  </span>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={isLoadingSubjects}
                  >
                    <SelectTrigger className="w-full md:w-[200px] h-[40px] rounded-[4px] shadow-none">
                      <SelectValue
                        placeholder={
                          isLoadingSubjects
                            ? translate('loading')
                            : translate('all')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{translate('all')}</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.class_subject_id.toString()}
                        >
                          <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-left">
                            {subject.name_with_type}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By Filter */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <BiFilter className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                    <span className="text-sm md:text-base font-normal text-gray-900 whitespace-nowrap">
                      {translate('sortBy')}
                    </span>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px] h-[40px] rounded-[4px] shadow-none text-left">
                      <SelectValue
                        placeholder={translate('sortByPlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned_latest">
                        {translate('assignedDateLatest')}
                      </SelectItem>
                      <SelectItem value="assigned_oldest">
                        {translate('assignedDateOldest')}
                      </SelectItem>
                      <SelectItem value="due_oldest">
                        {translate('dueDateEarliest')}
                      </SelectItem>
                      <SelectItem value="due_latest">
                        {translate('dueDateLatest')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
              {/* Loading State */}
              {isLoadingAssignments && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
                  <p className="text-gray-500">
                    {translate('loadingAssignments')}
                  </p>
                </div>
              )}

              {/* Error State */}
              {isAssignmentsError && (
                <div className="text-center py-12 bg-red-50 rounded-lg">
                  <BiBookContent className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">
                    {translate('errorLoadingAssignments')}
                  </h3>
                  <p className="text-red-600">
                    {translate('failedToFetchAssignments')}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingAssignments &&
                !isAssignmentsError &&
                sortedAssignments.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BiBookContent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {translate('noAssignmentsFound')}
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'assigned'
                        ? translate('noAssignedTasksMatch')
                        : translate('noSubmittedAssignmentsMatch')}
                    </p>
                  </div>
                )}

              {/* Assignments List */}
              {!isLoadingAssignments &&
                !isAssignmentsError &&
                sortedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`border border-gray-200 rounded-lg p-3 sm:p-4 transition-colors duration-300 ${
                      expandedFiles.has(assignment.id)
                        ? 'bg-[var(--light-primary-color)]'
                        : 'bg-white'
                    }`}
                  >
                    {/* Assignment Header - Created on (blue) and Due Date (red) */}
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <span className="text-sm font-normal text-[var(--primary-color)]">
                        {translate('createdOn')}{' '}
                        {formatDate(assignment.created_at)}
                      </span>
                      <span className="text-sm font-normal text-red-500">
                        {translate('dueDate')}{' '}
                        {formatDate(assignment.due_date_original)}
                      </span>
                    </div>

                    {/* Horizontal line */}
                    <div className="border-b border-gray-200 mb-4"></div>

                    {/* Subject Name with icon - Mobile responsive layout */}
                    <div className="flex flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 w-full">
                      {/* Subject icon - fixed size with subject image or color */}
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{
                          backgroundColor:
                            assignment.class_subject?.subject?.bg_color ||
                            '#EAEAEA',
                        }}
                      >
                        {assignment.class_subject?.subject?.image ? (
                          <Image
                            width={0}
                            height={0}
                            src={assignment.class_subject.subject.image}
                            alt={assignment.class_subject.subject.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg sm:text-xl">
                            {assignment.class_subject?.subject?.name?.charAt(0) ||
                              assignment.name?.charAt(0) ||
                              '?'}
                          </span>
                        )}
                      </div>

                      {/* Subject info and points - responsive layout */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-3 flex-grow min-w-0 gap-2 sm:gap-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                              {translate('subjectName')}{' '}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {assignment.class_subject?.subject?.name_with_type ||
                                translate('notAvailable')}
                            </span>
                          </div>
                          {assignment.points && (
                            <span className="inline-flex bg-[#E6ECF0] text-[var(--primary-color)] px-2 py-0.5 rounded text-xs sm:text-sm font-normal whitespace-nowrap w-fit">
                              {translate('points')} {assignment.points}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand button - fixed size, positioned for mobile */}
                      {/* Only show dropdown button if there's content to display (reference files or upload button) */}
                      {((assignment.file && assignment.file.length > 0) ||
                        hasUploadButton(assignment)) && (
                        <div className="flex-shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                          <button
                            onClick={() => toggleFiles(assignment.id)}
                            className="flex items-center justify-center w-8 h-8 border border-[var(--primary-color)] rounded-[4px] bg-(--primary-color) text-white transition-colors duration-200 hover:bg-opacity-90"
                          >
                            <div
                              className={`transition-transform duration-300 ${
                                expandedFiles.has(assignment.id)
                                  ? 'rotate-180'
                                  : 'rotate-0'
                              }`}
                            >
                              <BiChevronDown className="text-lg text-white" />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="sm:ml-16">
                      {/* Assignment Title */}
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        {assignment.name}
                      </h3>

                      {/* Assignment Description */}
                      <p className="text-gray-600 text-sm font-normal mb-4">
                        {assignment.instructions}
                      </p>
                    </div>

                    {/* Reference Material - Collapsible with smooth animation */}
                    {assignment.file && assignment.file.length > 0 && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out bg-white rounded-lg border border-gray-200 ${
                          expandedFiles.has(assignment.id)
                            ? 'max-h-[800px] opacity-100 mb-4 p-3 sm:p-4'
                            : 'max-h-0 opacity-0 mb-0 '
                        }`}
                      >
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            {translate('referenceMaterial')}
                          </h4>
                          <div className="space-y-2">
                            {assignment.file.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-start justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg gap-2 sm:gap-3"
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <BiFile className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                  {/* Show full URL for links, file name for files */}
                                  <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-sm text-gray-900 break-all leading-snug">
                                      {isFileLink(file.type)
                                        ? file.file_url
                                        : formatFileName(
                                            file.file_name,
                                            file.file_extension,
                                          )}
                                    </span>
                                  </div>
                                </div>
                                {/* Show link icon for YouTube/Other links, download icon for files */}
                                <button
                                  onClick={() =>
                                    isFileLink(file.type)
                                      ? handleOpenLink(file.file_url)
                                      : handleFileDownload(
                                          file.file_url,
                                          file.file_name || 'download',
                                        )
                                  }
                                  className="p-1.5 rounded-[4px] transition-colors duration-200 bg-(--primary-color) text-white flex-shrink-0 hover:bg-opacity-90"
                                  title={
                                    isFileLink(file.type)
                                      ? translate('openLink')
                                      : translate('downloadView')
                                  }
                                >
                                  {isFileLink(file.type) ? (
                                    <BiLinkExternal className="text-lg" />
                                  ) : (
                                    <BiDownload className="text-lg" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Buttons Section - Show based on submission status conditions */}
                    {activeTab === 'assigned' &&
                      assignedUploadButton(assignment)}
                  </div>
                ))}
            </div>
          </div>
        </TabContent>

        {/* Submitted Tab Content */}
        <TabContent value="submitted" activeTab={activeTab}>
          <div className="px-4 pb-4">
            {/* Search and Filters - Responsive for all screen sizes */}
            <div className="flex flex-wrap flex-col lg:flex-row gap-4 mb-4 justify-between">
              {/* Search Bar */}
              <div className="flex-1 lg:flex-none">
                <div className="relative w-full lg:w-[350px] bg-[var(--light-primary-color)]">
                  <Input
                    type="text"
                    placeholder={translate('searchAssignments')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 rounded-[4px] h-[40px] shadow-none"
                  />
                  <Button className="absolute right-[6px] top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 bg-(--primary-color) rounded-[4px]">
                    <BiSearch className="text-xl text-white" />
                  </Button>
                </div>
              </div>

              {/* Filters Container - Responsive layout */}
              <div className="flex flex-col md:flex-row flex-wrap gap-4 lg:gap-6">
                {/* Subject Filter */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span className="text-sm md:text-base font-normal text-gray-900 whitespace-nowrap">
                    {translate('subject')}
                  </span>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={isLoadingSubjects}
                  >
                    <SelectTrigger className="w-full md:w-[200px] h-[40px] rounded-[4px] shadow-none">
                      <SelectValue
                        placeholder={
                          isLoadingSubjects
                            ? translate('loading')
                            : translate('all')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{translate('all')}</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.class_subject_id.toString()}
                        >
                          <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-left">
                            {subject.name_with_type}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
              {/* Loading State */}
              {isLoadingAssignments && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
                  <p className="text-gray-500">
                    {translate('loadingAssignments')}
                  </p>
                </div>
              )}

              {/* Error State */}
              {isAssignmentsError && (
                <div className="text-center py-12 bg-red-50 rounded-lg">
                  <BiBookContent className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">
                    {translate('errorLoadingAssignments')}
                  </h3>
                  <p className="text-red-600">
                    {translate('failedToFetchSubmittedAssignments')}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingAssignments &&
                !isAssignmentsError &&
                sortedAssignments.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BiBookContent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {translate('noSubmittedAssignments')}
                    </h3>
                    <p className="text-gray-500">
                      {translate('noSubmittedAssignmentsMatch')}
                    </p>
                  </div>
                )}

              {/* Assignments List */}
              {!isLoadingAssignments &&
                !isAssignmentsError &&
                sortedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`border border-gray-200 rounded-lg p-3 sm:p-4 transition-colors duration-300 ${
                      expandedFiles.has(assignment.id)
                        ? 'bg-[var(--light-primary-color)]'
                        : 'bg-white'
                    }`}
                  >
                    {/* Assignment Header - Created on (blue) and Due Date (red) */}
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <span className="text-sm font-normal text-[var(--primary-color)]">
                        {translate('createdOn')}{' '}
                        {formatDate(assignment.created_at)}
                      </span>
                      <span className="text-sm font-normal text-red-500">
                        {translate('dueDate')}{' '}
                        {formatDate(assignment.due_date_original)}
                      </span>
                    </div>

                    {/* Horizontal line */}
                    <div className="border-b border-gray-200 mb-4"></div>

                    {/* Subject Name with icon - Mobile responsive layout */}
                    <div className="flex flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 w-full">
                      {/* Subject icon - fixed size with subject image or color */}
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{
                          backgroundColor:
                            assignment.class_subject?.subject?.bg_color ||
                            '#EAEAEA',
                        }}
                      >
                        {assignment.class_subject?.subject?.image ? (
                          <Image
                            width={0}
                            height={0}
                            src={assignment.class_subject.subject.image}
                            alt={assignment.class_subject.subject.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg sm:text-xl">
                            {assignment.class_subject?.subject?.name?.charAt(0) ||
                              assignment.name?.charAt(0) ||
                              '?'}
                          </span>
                        )}
                      </div>

                      {/* Subject info and points - responsive layout */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-3 flex-grow min-w-0 gap-2 sm:gap-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                              {translate('subjectName')}{' '}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {assignment.class_subject?.subject?.name_with_type ||
                                translate('notAvailable')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            {assignment.points && (
                              <span className="inline-flex bg-[#E6ECF0] text-[var(--primary-color)] px-2 py-0.5 rounded text-xs sm:text-sm font-normal whitespace-nowrap">
                                {translate('points')} {assignment.points}
                              </span>
                            )}
                            {/* Submission Status Badge */}
                            {assignment.submission && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs sm:text-sm font-normal whitespace-nowrap border ${
                                  assignment.submission.status === 1
                                    ? 'bg-green-100 border-[var(--secondary-color)] text-[var(--secondary-color)]'
                                    : assignment.submission.status === 2
                                      ? 'bg-red-100 border-red-500 text-red-700'
                                      : assignment.submission.status === 3
                                        ? 'bg-[var(--light-primary-color)] border-[var(--primary-color)] text-[var(--primary-color)]'
                                        : 'bg-[var(--light-primary-color)] border-[var(--primary-color)] text-[var(--primary-color)]'
                                }`}
                              >
                                {assignment.submission.status === 1
                                  ? translate('accepted')
                                  : assignment.submission.status === 2
                                    ? translate('rejected')
                                    : assignment.submission.status === 3
                                      ? translate('resubmitted')
                                      : translate('inReview')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand button - fixed size, positioned for mobile */}
                      {/* Only show dropdown button if there's content to display (reference files or submitted files) */}
                      {((assignment.file && assignment.file.length > 0) ||
                        hasSubmittedFiles(assignment)) && (
                        <div className="flex-shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                          <button
                            onClick={() => toggleFiles(assignment.id)}
                            className="flex items-center justify-center w-8 h-8 border border-[var(--primary-color)] rounded-[4px] bg-(--primary-color) text-white transition-colors duration-200 hover:bg-opacity-90"
                          >
                            <div
                              className={`transition-transform duration-300 ${
                                expandedFiles.has(assignment.id)
                                  ? 'rotate-180'
                                  : 'rotate-0'
                              }`}
                            >
                              <BiChevronDown className="text-lg text-white" />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Assignment Title */}
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        {assignment.name}
                      </h3>

                      {/* Assignment Description */}
                      <p className="text-gray-600 text-sm font-normal mb-4">
                        {assignment.instructions}
                      </p>
                    </div>

                    {/* Reference Material - Collapsible with smooth animation */}
                    {assignment.file && assignment.file.length > 0 && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out bg-white rounded-lg border border-gray-200 ${
                          expandedFiles.has(assignment.id)
                            ? 'max-h-[800px] opacity-100 mb-4 p-3 sm:p-4'
                            : 'max-h-0 opacity-0 mb-0 '
                        }`}
                      >
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            {translate('referenceMaterial')}
                          </h4>
                          <div className="space-y-2">
                            {assignment.file.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-start justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg gap-2 sm:gap-3"
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <BiFile className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                  {/* Show full URL for links, file name for files */}
                                  <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-sm text-gray-900 break-all leading-snug">
                                      {isFileLink(file.type)
                                        ? file.file_url
                                        : formatFileName(
                                            file.file_name,
                                            file.file_extension,
                                          )}
                                    </span>
                                  </div>
                                </div>
                                {/* Show link icon for YouTube/Other links, download icon for files */}
                                <button
                                  onClick={() =>
                                    isFileLink(file.type)
                                      ? handleOpenLink(file.file_url)
                                      : handleFileDownload(
                                          file.file_url,
                                          file.file_name || 'download',
                                        )
                                  }
                                  className="p-1.5 rounded-[4px] transition-colors duration-200 bg-(--primary-color) text-white flex-shrink-0 hover:bg-opacity-90"
                                  title={
                                    isFileLink(file.type)
                                      ? translate('openLink')
                                      : translate('downloadView')
                                  }
                                >
                                  {isFileLink(file.type) ? (
                                    <BiLinkExternal className="text-lg" />
                                  ) : (
                                    <BiDownload className="text-lg" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {renderSubmittedButtons(assignment)}
                  </div>
                ))}
            </div>
          </div>
        </TabContent>
      </div>

      {/* Upload Assignment Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent
          className="sm:max-w-[600px] max-w-[95vw] p-0"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 p-3 sm:p-4 gap-3">
              <div className="flex flex-col items-start text-left w-full">
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 text-left">
                  {translate('uploadYourAssignment')}
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm font-normal md:w-[500px] w-full text-left">
                  {translate('uploadAssignmentDescription')}
                </DialogDescription>
              </div>
              <div className="self-end sm:self-auto order-first sm:order-last">
                <DialogClose>
                  <BiX className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-gray-400 bg-[var(--light-primary-color)] border border-gray-200 rounded-[4px] p-1 flex-shrink-0" />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-3 sm:p-4">
            {uploadMode === null ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 sm:py-8">
                <button
                  onClick={() => setUploadMode('file')}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-(--primary-color) hover:bg-(--light-primary-color) transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <BiFile className="w-6 h-6 text-gray-600 group-hover:text-(--primary-color)" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    {translate('uploadFile')}
                  </span>
                </button>
                <button
                  onClick={() => setUploadMode('link')}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-(--primary-color) hover:bg-(--light-primary-color) transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <BiLink className="w-6 h-6 text-gray-600 group-hover:text-(--primary-color)" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    {translate('addLink')}
                  </span>
                </button>
              </div>
            ) : uploadMode === 'file' ? (
              /* File Upload Area - Mobile optimized, supports multiple files */
              <div
                className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors duration-200 ${
                  uploadedFiles.length > 0
                    ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)]/10'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
              >
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900 text-left">
                      {uploadedFiles.length} {translate('filesSelected')}
                    </p>
                    {/* List of uploaded files */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                        >
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm text-gray-900 break-all">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="ml-2 p-1 hover:bg-red-100 rounded transition-colors duration-200"
                            title={translate('removeFile')}
                          >
                            <BiX className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Button to add more files */}
                    <div className="pt-2 border-t border-gray-200 flex justify-start">
                      <input
                        type="file"
                        id="file-upload-more"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".jpeg,.png,.jpg,.gif,.svg,.webp,.pdf,.doc,.docx,.xml"
                        multiple
                      />
                      <label
                        htmlFor="file-upload-more"
                        className="inline-flex items-center gap-2 bg-white border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-(--primary-color) hover:text-white px-4 py-2 rounded-[4px] text-sm font-normal cursor-pointer transition-colors duration-200"
                      >
                        <BiUpload className="w-4 h-4" />
                        {translate('addMoreFiles')}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm sm:text-base font-normal">
                        <span className="text-[var(--primary-color)] underline cursor-pointer">
                          {translate('clickToUpload')}
                        </span>{' '}
                        {translate('or')}{' '}
                        <span className="text-[var(--primary-color)] underline">
                          {translate('dragYourAssignmentHere')}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {translate('uploadMultipleFilesDescription')}
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".jpeg,.png,.jpg,.gif,.svg,.webp,.pdf,.doc,.docx,.xml"
                        multiple
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center gap-2 bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-4 py-2 rounded-[4px] text-sm font-normal cursor-pointer transition-colors duration-200 min-h-[44px]"
                      >
                        <BiUpload className="w-4 h-4" />
                        {translate('chooseFiles')}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Link Input Area */
              <div className="py-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    {translate('assignmentLink') || 'Assignment Link'}
                  </label>
                  <Input
                    value={linkSubmission}
                    onChange={(e) => setLinkSubmission(e.target.value)}
                    placeholder="https://example.com/my-assignment"
                    className="h-12 border-gray-300 focus:border-(--primary-color) focus:ring-(--primary-color)"
                  />
                  <p className="text-xs text-gray-500">
                    {translate('enterLinkDescription') ||
                      'Enter the URL to your assignment (e.g. Google Drive, GitHub, etc.)'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200 justify-end">
              <Button
                variant="outline"
                onClick={handleModalClose}
                className="w-full sm:w-auto"
                disabled={submitMutation.isPending}
              >
                {translate('cancel')}
              </Button>
              {uploadMode !== null && (
                <Button
                  onClick={handleUploadSubmit}
                  className="w-full sm:w-auto bg-(--primary-color) hover:bg-(--primary-color)/90"
                  disabled={
                    (uploadMode === 'file' && uploadedFiles.length === 0) ||
                    (uploadMode === 'link' && !linkSubmission.trim()) ||
                    submitMutation.isPending
                  }
                >
                  {submitMutation.isPending ? (
                    <>
                      <BiUpload className="w-4 h-4 mr-2 animate-pulse" />
                      {translate('submitting')}
                    </>
                  ) : (
                    <>
                      {uploadMode === 'file' ? (
                        <BiUpload className="w-4 h-4 mr-2" />
                      ) : (
                        <BiLink className="w-4 h-4 mr-2" />
                      )}
                      {translate('submitAssignment')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-[600px] max-w-[95vw] p-0"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 p-3 sm:p-4 gap-3">
              <div className="flex flex-col items-start text-left w-full">
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 text-left">
                  {translate('editAssignment')}
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm font-normal md:w-[500px] w-full text-left">
                  {translate('editAssignmentDescription')}
                </DialogDescription>
              </div>
              <div className="self-end sm:self-auto order-first sm:order-last">
                <DialogClose>
                  <BiX className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-gray-400 bg-[var(--light-primary-color)] border border-gray-200 rounded-[4px] p-1 flex-shrink-0" />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-3 sm:p-4">
            {editUploadMode === null ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 sm:py-8">
                <button
                  onClick={() => setEditUploadMode('file')}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-(--primary-color) hover:bg-(--light-primary-color) transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <BiFile className="w-6 h-6 text-gray-600 group-hover:text-(--primary-color)" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    {translate('uploadFile')}
                  </span>
                </button>
                <button
                  onClick={() => setEditUploadMode('link')}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-(--primary-color) hover:bg-(--light-primary-color) transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <BiLink className="w-6 h-6 text-gray-600 group-hover:text-(--primary-color)" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    {translate('addLink')}
                  </span>
                </button>
              </div>
            ) : editUploadMode === 'file' ? (
              /* File Upload Area - Mobile optimized, supports multiple files */
              <div
                className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors duration-200 ${
                  editUploadedFiles.length > 0
                    ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)]/10'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleEditFileDrop}
                onDragOver={handleEditDragOver}
              >
                {editUploadedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900 text-left">
                      {editUploadedFiles.length} {translate('filesSelected')}
                    </p>
                    {/* List of uploaded files */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {editUploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                        >
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm text-gray-900 break-all">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => handleEditRemoveFile(index)}
                            className="ml-2 p-1 hover:bg-red-100 rounded transition-colors duration-200"
                            title={translate('removeFile')}
                          >
                            <BiX className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Button to add more files */}
                    <div className="pt-2 border-t border-gray-200 flex justify-start">
                      <input
                        type="file"
                        id="edit-file-upload-more"
                        className="hidden"
                        onChange={handleEditFileSelect}
                        accept=".jpeg,.png,.jpg,.gif,.svg,.webp,.pdf,.doc,.docx,.xml"
                        multiple
                      />
                      <label
                        htmlFor="edit-file-upload-more"
                        className="inline-flex items-center gap-2 bg-white border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-(--primary-color) hover:text-white px-4 py-2 rounded-[4px] text-sm font-normal cursor-pointer transition-colors duration-200"
                      >
                        <BiUpload className="w-4 h-4" />
                        {translate('addMoreFiles')}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm sm:text-base font-normal">
                        <span className="text-[var(--primary-color)] underline cursor-pointer">
                          {translate('clickToUpload')}
                        </span>{' '}
                        {translate('or')}{' '}
                        <span className="text-[var(--primary-color)] underline">
                          {translate('dragYourAssignmentHere')}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {translate('uploadMultipleFilesDescription')}
                      </p>
                      <input
                        type="file"
                        id="edit-file-upload"
                        className="hidden"
                        onChange={handleEditFileSelect}
                        accept=".jpeg,.png,.jpg,.gif,.svg,.webp,.pdf,.doc,.docx,.xml"
                        multiple
                      />
                      <label
                        htmlFor="edit-file-upload"
                        className="inline-flex items-center gap-2 bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-4 py-2 rounded-[4px] text-sm font-normal cursor-pointer transition-colors duration-200 min-h-[44px]"
                      >
                        <BiUpload className="w-4 h-4" />
                        {translate('chooseFiles')}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Link Input Area */
              <div className="py-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    {translate('assignmentLink') || 'Assignment Link'}
                  </label>
                  <Input
                    value={editLinkSubmission}
                    onChange={(e) => setEditLinkSubmission(e.target.value)}
                    placeholder="https://example.com/my-assignment"
                    className="h-12 border-gray-300 focus:border-(--primary-color) focus:ring-(--primary-color)"
                  />
                  <p className="text-xs text-gray-500">
                    {translate('enterLinkDescription') ||
                      'Enter the URL to your assignment (e.g. Google Drive, GitHub, etc.)'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200 justify-end">
              <Button
                variant="outline"
                onClick={handleEditModalClose}
                className="w-full sm:w-auto"
                disabled={submitMutation.isPending}
              >
                {translate('cancel')}
              </Button>
              {editUploadMode !== null && (
                <Button
                  onClick={handleEditSubmit}
                  className="w-full sm:w-auto bg-(--primary-color) hover:bg-(--primary-color)/90"
                  disabled={
                    (editUploadMode === 'file' &&
                      editUploadedFiles.length === 0) ||
                    (editUploadMode === 'link' && !editLinkSubmission.trim()) ||
                    submitMutation.isPending
                  }
                >
                  {submitMutation.isPending ? (
                    <>
                      <BiUpload className="w-4 h-4 mr-2 animate-pulse" />
                      {translate('resubmitting')}
                    </>
                  ) : (
                    <>
                      {editUploadMode === 'file' ? (
                        <BiUpload className="w-4 h-4 mr-2" />
                      ) : (
                        <BiLink className="w-4 h-4 mr-2" />
                      )}
                      {translate('resubmitAssignment')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete/Undo Assignment Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
        <DialogContent
          className={`w-[95vw] ${
            actionType === 'undo' ? 'max-w-[600px] p-0' : 'max-w-[420px] p-6'
          } bg-white rounded-[12px] shadow-xl`}
          showCloseButton={actionType === 'undo'}
        >
          {actionType === 'undo' ? (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 p-3 sm:p-4 gap-3">
                  <div className="flex flex-col items-start text-left w-full">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 text-left">
                      {translate('resubmitAssignment') || 'Resubmit Assignment'}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3 sm:p-4">
                {/* Info Text */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4 flex gap-3 mb-4">
                  <BiInfoCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary-color)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    {translate('resubmitAssignmentInfo') ||
                      'You are updating your assignment submission. Your previous submission will be replaced.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {undoUploadMode === null ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 sm:py-8">
                      <button
                        onClick={() => setUndoUploadMode('file')}
                        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-(--primary-color) hover:bg-(--light-primary-color) transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <BiFile className="w-6 h-6 text-gray-600 group-hover:text-(--primary-color)" />
                        </div>
                        <span className="text-base font-medium text-gray-900">
                          {translate('uploadFile')}
                        </span>
                      </button>
                      <button
                        onClick={() => setUndoUploadMode('link')}
                        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-(--primary-color) hover:bg-(--light-primary-color) transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <BiLink className="w-6 h-6 text-gray-600 group-hover:text-(--primary-color)" />
                        </div>
                        <span className="text-base font-medium text-gray-900">
                          {translate('addLink')}
                        </span>
                      </button>
                    </div>
                  ) : undoUploadMode === 'file' ? (
                    /* File Upload Area */
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors duration-200 ${
                        undoUploadedFiles.length > 0
                          ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)]/10'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDrop={handleUndoFileDrop}
                      onDragOver={handleUndoDragOver}
                    >
                      {undoUploadedFiles.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-900 text-left">
                            {undoUploadedFiles.length}{' '}
                            {translate('filesSelected')}
                          </p>
                          {/* List of uploaded files */}
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {undoUploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                              >
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="text-sm text-gray-900 break-all">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleUndoRemoveFile(index)}
                                  className="ml-2 p-1 hover:bg-red-100 rounded transition-colors duration-200"
                                  title={translate('removeFile')}
                                >
                                  <BiX className="w-5 h-5 text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {/* Button to add more files */}
                          <div className="pt-2 border-t border-gray-200 flex justify-start">
                            <input
                              type="file"
                              id="undo-file-upload-more"
                              className="hidden"
                              onChange={handleUndoFileSelect}
                              accept=".jpeg,.png,.jpg,.gif,.svg,.webp,.pdf,.doc,.docx,.xml"
                              multiple
                            />
                            <label
                              htmlFor="undo-file-upload-more"
                              className="inline-flex items-center gap-2 bg-white border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-(--primary-color) hover:text-white px-4 py-2 rounded-[4px] text-sm font-normal cursor-pointer transition-colors duration-200"
                            >
                              <BiUpload className="w-4 h-4" />
                              {translate('addMoreFiles')}
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <p className="text-gray-600 text-sm sm:text-base font-normal">
                              <span className="text-[var(--primary-color)] underline cursor-pointer">
                                {translate('clickToUpload')}
                              </span>{' '}
                              {translate('or')}{' '}
                              <span className="text-[var(--primary-color)] underline">
                                {translate('dragYourAssignmentHere')}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {translate('uploadMultipleFilesDescription')}
                            </p>
                            <input
                              type="file"
                              id="undo-file-upload"
                              className="hidden"
                              onChange={handleUndoFileSelect}
                              accept=".jpeg,.png,.jpg,.gif,.svg,.webp,.pdf,.doc,.docx,.xml"
                              multiple
                            />
                            <label
                              htmlFor="undo-file-upload"
                              className="inline-flex items-center gap-2 bg-(--primary-color) hover:bg-(--primary-color)/90 text-white px-4 py-2 rounded-[4px] text-sm font-normal cursor-pointer transition-colors duration-200 min-h-[44px]"
                            >
                              <BiUpload className="w-4 h-4" />
                              {translate('chooseFiles')}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Link Input Area */
                    <div className="py-8 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">
                          {translate('assignmentLink') || 'Assignment Link'}
                        </label>
                        <Input
                          value={undoLinkSubmission}
                          onChange={(e) =>
                            setUndoLinkSubmission(e.target.value)
                          }
                          placeholder="https://example.com/my-assignment"
                          className="h-12 border-gray-300 focus:border-(--primary-color) focus:ring-(--primary-color)"
                        />
                        <p className="text-xs text-gray-500">
                          {translate('enterLinkDescription') ||
                            'Enter the URL to your assignment (e.g. Google Drive, GitHub, etc.)'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200 justify-end">
                    <Button
                      variant="outline"
                      onClick={handleDeleteDialogClose}
                      className="w-full sm:w-auto"
                      disabled={submitMutation.isPending}
                    >
                      {translate('cancel')}
                    </Button>
                    {undoUploadMode !== null && (
                      <Button
                        onClick={handleUndoSubmit}
                        className="w-full sm:w-auto bg-(--primary-color) hover:bg-(--primary-color)/90"
                        disabled={
                          (undoUploadMode === 'file' &&
                            undoUploadedFiles.length === 0) ||
                          (undoUploadMode === 'link' &&
                            !undoLinkSubmission.trim()) ||
                          submitMutation.isPending
                        }
                      >
                        {submitMutation.isPending ? (
                          <>
                            <BiUpload className="w-4 h-4 mr-2 animate-pulse" />
                            {translate('submitting')}
                          </>
                        ) : (
                          <>
                            {undoUploadMode === 'file' ? (
                              <BiUpload className="w-4 h-4 mr-2" />
                            ) : (
                              <BiLink className="w-4 h-4 mr-2" />
                            )}
                            {translate('resubmitAssignment')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="text-base sm:text-base font-bold text-gray-900 text-center">
                {translate('deleteThisAssignment')}
              </DialogTitle>
              <DialogDescription className="text-sm font-normal text-gray-600 text-center mt-2">
                <span className="block">
                  {translate('deleteAssignmentWarning')}
                </span>
                <span className="block mt-1">
                  {translate('deleteAssignmentWarning2')}
                </span>
              </DialogDescription>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  onClick={handleDeleteConfirm}
                  className="bg-(--primary-color) rounded-[4px] text-white text-base font-normal px-4 py-2 min-w-[100px]"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending
                    ? translate('loading')
                    : translate('delete')}
                </Button>
                <Button
                  onClick={handleDeleteDialogClose}
                  className="bg-white hover:bg-gray-50 text-(--primary-color) border border-(--primary-color) rounded-[4px] text-base font-normal px-4 py-2"
                  disabled={deleteMutation.isPending}
                >
                  {translate('cancel')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
