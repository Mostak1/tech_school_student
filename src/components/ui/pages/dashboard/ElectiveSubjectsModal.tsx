'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ElectiveSubjectGroup } from '@/lib/api/student/functions';
import Image from 'next/image';
import { BiX } from 'react-icons/bi';
import { useTranslate } from '@/components/hooks/useTranslate';

interface ElectiveSubjectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  electiveSubjectGroups: ElectiveSubjectGroup[];
  onSave: (selectedSubjects: { [groupId: number]: number[] }) => void;
}

export default function ElectiveSubjectsModal({
  open,
  onOpenChange,
  electiveSubjectGroups,
  onSave,
}: ElectiveSubjectsModalProps) {
  const translate = useTranslate();
  // State to track selected subjects for each group
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [groupId: number]: number[];
  }>({});

  // Initialize selected subjects state when modal opens
  useEffect(() => {
    if (open) {
      const initialSelection: { [groupId: number]: number[] } = {};
      electiveSubjectGroups.forEach((group) => {
        initialSelection[group.id] = [];
      });
      setSelectedSubjects(initialSelection);
    }
  }, [open, electiveSubjectGroups]);

  // Handle subject selection/deselection
  const handleSubjectToggle = (groupId: number, classSubjectId: number) => {
    setSelectedSubjects((prev) => {
      const currentSelection = prev[groupId] || [];
      const maxSelectable =
        electiveSubjectGroups.find((g) => g.id === groupId)
          ?.total_selectable_subjects || 0;

      // If subject is already selected, remove it
      if (currentSelection.includes(classSubjectId)) {
        return {
          ...prev,
          [groupId]: currentSelection.filter((id) => id !== classSubjectId),
        };
      }

      // If subject is not selected and we haven't reached the limit, add it
      if (currentSelection.length < maxSelectable) {
        return {
          ...prev,
          [groupId]: [...currentSelection, classSubjectId],
        };
      }

      return prev;
    });
  };

  // Handle save button click
  const handleSave = () => {
    onSave(selectedSubjects);
    onOpenChange(false);
  };

  // Check if all groups have valid selections
  const isSelectionValid = () => {
    return electiveSubjectGroups.every((group) => {
      const selected = selectedSubjects[group.id] || [];
      return selected.length === group.total_selectable_subjects;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100vw-2rem)] sm:max-w-[600px] p-0 max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="p-3 pb-2 sm:p-6 sm:pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between text-left">
            <div className="flex-1 pr-2">
              <DialogTitle className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                {translate('chooseYourElectiveSubjects')}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed">
                {translate('selectElectiveSubjectsDescription')}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button className="ml-2 sm:ml-4 p-1.5 sm:p-2 bg-[var(--light-primary-color)] rounded-[4px] transition-colors border border-gray-200 flex-shrink-0">
                <BiX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4 space-y-4 sm:space-y-6">
          {electiveSubjectGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="space-y-3 bg-[var(--light-primary-color)] border border-gray-200 rounded-lg p-3 sm:p-4"
            >
              {/* Group Header */}
              <div className="bg-[var(--light-primary-color)] rounded-lg">
                <h3 className="text-base font-normal text-gray-900">
                  {translate('group')} {groupIndex + 1}{' '}
                  <span className="text-sm font-normal text-gray-700">
                    ({translate('selectAny')} {group.total_selectable_subjects}{' '}
                    {translate('subjects')})
                  </span>
                </h3>
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {group.subjects.map((subject) => {
                  const isSelected =
                    selectedSubjects[group.id]?.includes(
                      subject.class_subject_id
                    ) || false;
                  const canSelect =
                    isSelected ||
                    (selectedSubjects[group.id]?.length || 0) <
                      group.total_selectable_subjects;

                  return (
                    <div
                      key={subject.id}
                      className={`bg-white border border-gray-200 rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-[var(--primary-color)] bg-(--primary-color)'
                          : canSelect
                          ? 'hover:bg-gray-200'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() =>
                        canSelect &&
                        handleSubjectToggle(group.id, subject.class_subject_id)
                      }
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Subject Image */}
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={subject.image}
                            alt={subject.name}
                            className="w-full h-full object-cover"
                            width={0}
                            height={0}
                          />
                        </div>

                        {/* Subject Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2">
                            {subject.name_with_type}
                          </h4>
                        </div>

                        {/* Selection Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-(--primary-color) border-[var(--primary-color)]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 pt-2 sm:p-6 sm:pt-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!isSelectionValid()}
            className={`w-full py-2.5 sm:py-3 rounded-lg font-bold text-white transition-colors text-sm sm:text-base ${
              isSelectionValid()
                ? 'bg-(--primary-color) hover:bg-(--primary-color)/90'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {translate('addSelectiveSubjects')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
