'use client';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { BiHomeSmile } from 'react-icons/bi';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  useGetDiaries,
  useGetStudentSubjects,
  useGetDiaryCategories,
  useGetSchoolSettings,
} from '@/lib/api/student/queryHooks';
import type { DiaryStudentEntry } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';

  

/**
 * Format date for display
 * API returns date in "DD-MM-YYYY 00:00" format and created_at/updated_at in "DD-MM-YYYY HH:mm" format
 */
const formatDate = (dateString: string, timeString?: string) => {
  // Use the date from diary.date and time from created_at or updated_at
  if (timeString) {
    // Extract time part from timeString (format: "DD-MM-YYYY HH:mm")
    const timeMatch = timeString.match(/\s(\d{2}:\d{2})/);
    if (timeMatch) {
      return `${dateString}, ${timeMatch[1]}`;
    }
  }
  // Fallback to just the date
  return dateString;
};

/**
 * My Diary Page Component
 *
 * Displays student diary entries with filtering by category and subject,
 * and sorting by positive/negative or new/old.
 * Initially shows all data without filters, with default sort as 'new'.
 */
export default function MyDiaryPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
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

    if (!isFeatureEnabled('Student Management')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  // Get student user from Redux store to access student ID
  const user = useSelector((state: RootState) => state.studentAuth.user);

  // Breadcrumb navigation items
  const breadcrumbItems = useMemo(() => [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('myDiary'),
      href: '/student/diary',
    },
  ], [translate]);

  // Filter state - initially show all data
  // 'all' means no filter applied (don't pass parameter to API)
  const [category, setCategory] = useState<string>('all');
  const [subject, setSubject] = useState<string>('all');
  // Sort state - default is 'new' as per requirements
  const [sortBy, setSortBy] = useState<string>('new');

  // Fetch subjects from the dedicated subjects API
  // This provides all available subjects for the student (core + elective)
  const { data: subjectsData } = useGetStudentSubjects();

  // Extract and combine all subjects (core + elective) for the dropdown
  // Show all subjects including both core and elective, even if names are duplicated
  const subjects = useMemo(() => {
    if (!subjectsData) {
      return [];
    }

    // Combine core and elective subjects
    // Show all subjects separately, not just unique ones by name
    const allSubjects = [
      ...(subjectsData.core_subjects || []),
      ...(subjectsData.elective_subjects || []),
    ];

    // Map all subjects to include class_subject_id, name, and name_with_type
    // Use name_with_type as the unique identifier since it includes the type
    const subjectsList = allSubjects
      .filter((subj) => subj && subj.name) // Filter out any null/undefined subjects
      .map((subj) => ({
        id: subj.id,
        name: subj.name,
        name_with_type: subj.name_with_type,
      }));

    // Return sorted array of all subjects by name_with_type
    // This will show both core and elective subjects separately
    return subjectsList.sort((a, b) =>
      a.name_with_type.localeCompare(b.name_with_type),
    );
  }, [subjectsData]);

  // Prepare API request parameters for filtered data
  // Convert filter state to API parameters
  const apiParams = useMemo(() => {
    // Map sortBy state to API sort values
    const sortValue = (sortBy === 'old' || sortBy === 'positive' || sortBy === 'negative')
      ? sortBy
      : 'new';

    // Build API parameters
    // Only include subject_id and diary_category_id if not 'all'
    const params: {
      student_id: number;
      sort: 'positive' | 'negative' | 'new' | 'old';
      subject_id?: number | null;
      diary_category_id?: number | null;
    } = {
      student_id: user?.id || 0,
      sort: sortValue,
    };

    // Add subject_id only if a specific subject is selected
    // Subject value is now name_with_type, so we need to find the matching subject and get its class_subject_id
    if (subject !== 'all') {
      // Find the subject by name_with_type from the subjects list
      const selectedSubject = subjects.find(
        (s) => s.name_with_type === subject,
      );
      if (selectedSubject) {
        // Use class_subject_id for filtering (this is what the API expects)
        params.subject_id = selectedSubject.id;
      } else {
        // Fallback: try finding by name if name_with_type lookup fails
        const subjectByName = subjects.find((s) => s.name === subject);
        if (subjectByName) {
          params.subject_id = subjectByName.id;
        } else {
          // Final fallback: try parsing as ID
          const subjectId = parseInt(subject, 10);
          if (!isNaN(subjectId)) {
            params.subject_id = subjectId;
          }
        }
      }
    } else {
      // 'all' means don't pass subject_id (or pass empty string)
      params.subject_id = null;
    }

    // Add diary_category_id only if a specific category is selected
    if (category !== 'all') {
      const categoryId = parseInt(category, 10);
      if (!isNaN(categoryId)) {
        params.diary_category_id = categoryId;
      }
    } else {
      // 'all' means don't pass diary_category_id (or pass empty string)
      params.diary_category_id = null;
    }

    return params;
  }, [category, subject, sortBy, user?.id, subjects]);

  // Fetch filtered diaries from API using the hook
  const { data: diariesData, isLoading, error } = useGetDiaries(apiParams);

  // Extract diary entries from API response
  // API returns data.data as a paginated array of diary-student entries directly,
  // each entry already carrying its nested diary object
  const diaryEntries = useMemo(() => {
    if (!diariesData?.data?.data || !Array.isArray(diariesData.data.data)) {
      return [];
    }
    return diariesData.data.data.filter(
      (entry): entry is DiaryStudentEntry => !!entry && !!entry.diary,
    );
  }, [diariesData]);

  // Fetch diary categories from the dedicated categories API
  // This provides all available categories for the dropdown
  const { data: categoriesData } = useGetDiaryCategories();

  // Extract categories from API response for the dropdown
  // Show all categories (both active and deleted) and sort by name
  const categories = useMemo(() => {
    if (!categoriesData?.data) {
      return [];
    }

    // Show all categories from API (both active and deleted)
    // Map all categories to the format needed for dropdown
    const allCategories = categoriesData.data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
    }));

    // Return sorted array of all categories by name
    return allCategories.sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesData]);

  // Calculate positive and negative counts from the currently displayed diary entries
  // Count entries based on diary_category.type
  // Count entries that are currently being displayed (filtered/sorted)
  // This way counts reflect what the user is actually seeing
  const { positiveCount, negativeCount } = useMemo(() => {
    let positive = 0;
    let negative = 0;

    // Count from the currently displayed diary entries (filtered/sorted)
    // This ensures counts match what's actually shown on the page
    diaryEntries.forEach((entry) => {
      const cat = entry.diary?.diary_category;
      // Count all entries by category type, regardless of deleted_at status
      if (cat && cat.type) {
        const categoryType = cat.type;
        if (categoryType === 'positive') {
          positive++;
        } else if (categoryType === 'negative') {
          negative++;
        }
      }
    });

    return { positiveCount: positive, negativeCount: negative };
  }, [diaryEntries]);

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb */}
      <Breadcrumb title={translate('myDiary')} items={breadcrumbItems} />

      <div className="min-h-screen bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row items-end gap-3 sm:gap-4 w-full">
            {/* Category Filter */}
            <div className="flex flex-col gap-1.5 w-full lg:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {translate('category')}
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full lg:w-[180px] bg-white shadow-none rounded-[4px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder={translate('allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {translate('allCategories')}
                  </SelectItem>
                  {/* Render categories from API response */}
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-left rtl:text-right">
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="flex flex-col gap-1.5 w-full lg:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {translate('subjects')}
              </label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full lg:w-[180px] bg-white shadow-none rounded-[4px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder={translate('allSubjects')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {translate('allSubjects')}
                  </SelectItem>
                  {/* Render subjects from API response - showing all core and elective subjects */}
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.name_with_type}>
                      <span className="block max-w-[200px] sm:max-w-xs md:max-w-none whitespace-normal break-words text-left rtl:text-right">
                        {subj.name_with_type}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Filter */}
            <div className="flex flex-col gap-1.5 w-full lg:w-auto lg:ml-auto rtl:lg:ml-0 rtl:lg:mr-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                {translate('sortBy').replace(':', '')}
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[180px] bg-white shadow-none rounded-[4px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder={translate('newestFirst')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    {translate('newestFirst')}
                  </SelectItem>
                  <SelectItem value="old">
                    {translate('oldestFirst')}
                  </SelectItem>
                  <SelectItem value="positive">
                    {translate('positive')}
                  </SelectItem>
                  <SelectItem value="negative">
                    {translate('negative')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#F2FFD9] border border-green-200 rounded-lg p-3 sm:p-4 flex items-center justify-between">
            <span className="text-green-800 text-xs sm:text-base font-medium">
              {translate('positiveEntries')}
            </span>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">
              {positiveCount}
            </span>
          </div>
          <div className="bg-[#FFF5F5] border border-red-200 rounded-lg p-3 sm:p-4 flex items-center justify-between">
            <span className="text-red-800 text-xs sm:text-base font-medium">
              {translate('negativeEntries')}
            </span>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">
              {negativeCount}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">{translate('loadingDiaries')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{translate('errorLoadingDiaries')}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && diaryEntries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">{translate('noDiaryEntriesFound')}</p>
          </div>
        )}

        {/* Entries */}
        {!isLoading && !error && diaryEntries.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {diaryEntries.map((entry: DiaryStudentEntry) => {
              const diary = entry.diary;
              const isPositive = diary.diary_category?.type === 'positive';
              const subjectName = diary.subject?.name_with_type;
              const categoryName =
                diary.diary_category?.name || translate('unknownCategory');
              const title = diary.title || translate('noTitle');
              const description = diary.description || '';
              const displayDate = formatDate(
                diary.date,
                diary.created_at || diary.updated_at,
              );

              return (
                <div
                  key={entry.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 min-w-0">
                        {subjectName && (
                          <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-[4px] text-[10px] sm:text-xs font-normal border border-gray-200 bg-gray-50 text-gray-600 leading-tight">
                            {translate('subjectName')} {subjectName}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-[4px] text-[10px] sm:text-xs font-normal border border-gray-200 bg-gray-50 text-gray-600 leading-tight">
                          {categoryName}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-normal text-gray-500 whitespace-nowrap shrink-0 pt-0.5">
                        {displayDate}
                      </span>
                    </div>

                    <div className="border-b border-gray-100 mb-3"></div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value={entry.id.toString()}
                        className="border-none"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-2.5 shrink-0 ${isPositive ? 'bg-green-500' : 'bg-red-500'
                              }`}
                          />
                          <div className="flex-1 min-w-0">
                            <AccordionTrigger
                              className="hover:no-underline py-0 text-left rtl:text-right"
                              iconClassName="bg-[var(--primary-color)] text-white rounded-[4px] w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center p-1.5 sm:p-2 shrink-0 transition-transform duration-200"
                            >
                              <h3 className="text-xs sm:text-base font-medium text-gray-900 pr-2 sm:pr-4 rtl:pr-0 rtl:pl-2 sm:rtl:pl-4 line-clamp-2 sm:line-clamp-none">
                                {title}
                              </h3>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-0">
                              <p className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {description}
                              </p>
                            </AccordionContent>
                          </div>
                        </div>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
