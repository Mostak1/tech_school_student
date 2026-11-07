'use client';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import {
  BiHomeSmile,
  BiMessageDetail,
  BiPhone,
  BiStar,
  BiUserCheck,
  BiCheckCircle,
  BiBookOpen,
} from 'react-icons/bi';
import Image from 'next/image';
import {
  useGetTeachersList,
  useGetSchoolSettings,
  useSubmitTutorReview,
} from '@/lib/api/student/queryHooks';
import { useInstituteType } from '@/hooks/useInstituteType';
import { useMemo, useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import Tooltip from '@/components/ui/pages/common/Tooltip';
import { useRouter } from 'next/navigation';
import { useTranslate } from '@/components/hooks/useTranslate';
import { toastUtils } from '@/components/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';

/**
 * Teacher data interface (grouped by teacher)
 * This represents a teacher with all their subjects grouped together
 */
interface Teacher {
  id: number; // Teacher ID
  name: string; // Full name
  image: string; // Profile image URL
  mobile: string; // Mobile number, country code prefixed when available
  displaySubjects: string[]; // Subjects to display on card
  moreSubjects: number; // Number of additional subjects beyond the first 3
  allSubjects: string[]; // All subject names (for future use)
  university?: string;
  department?: string;
  experience?: string;
  rating?: number;
  totalReviews?: number;
  isVerified?: boolean;
}

/**
 * Teachers / My Tutors Page Component
 *
 * In Tuition Media mode: Displays assigned home tutors with university, experience,
 * direct call/chat, and a 1-5 Star rating review modal.
 * In School mode: Displays traditional school subject teachers intact.
 */
export default function TeachersPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const router = useRouter();

  const { isTuitionMedia } = useInstituteType();
  const submitReviewMutation = useSubmitTutorReview();

  // Review Modal state for Tuition Media
  const [ratingTutor, setRatingTutor] = useState<Teacher | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Fetch school settings to check for feature access
  const { data: schoolSettings, isLoading: isLoadingSettings } =
    useGetSchoolSettings();

  const enabledFeatures = useMemo(
    () => schoolSettings?.data?.features || {},
    [schoolSettings]
  );

  const isFeatureEnabled = useCallback(
    (featureName: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) {
        return true;
      }
      return Object.values(enabledFeatures).some(
        (feature) =>
          typeof feature === 'string' &&
          feature.toLowerCase() === featureName.toLowerCase()
      );
    },
    [enabledFeatures]
  );

  // Check feature permission and redirect if disabled (only in school mode)
  useEffect(() => {
    // Skip check while loading or in tuition media mode
    if (isLoadingSettings || isTuitionMedia) return;

    if (!isFeatureEnabled('Teacher Management')) {
      router.push('/student/dashboard');
    }
  }, [isFeatureEnabled, isLoadingSettings, isTuitionMedia, router]);

  // Get student ID from Redux store
  const user = useSelector((state: RootState) => state.studentAuth.user);
  const studentId = user?.id || null;

  // Fetch teachers data from API with student ID
  const {
    data: teachersData,
    isLoading,
    error,
  } = useGetTeachersList(studentId);

  // Breadcrumb navigation items
  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: isTuitionMedia
        ? (translate('myTutors') || 'My Tutors (আমার গৃহশিক্ষকগণ)')
        : translate('teachers'),
    },
  ];

  /**
   * Process teachers data and group by teacher ID
   */
  const teachers: Teacher[] = useMemo(() => {
    if (!teachersData?.data || teachersData.data.length === 0) {
      return [];
    }

    const teacherMap = new Map<number, Teacher>();

    teachersData.data.forEach((item) => {
      const teacherId = item.teacher.id;
      const subjectName = item.subject.name_with_type;

      const rawTeacher = item.teacher as unknown as Record<string, unknown>;

      if (teacherMap.has(teacherId)) {
        const teacher = teacherMap.get(teacherId)!;
        teacher.allSubjects.push(subjectName);
      } else {
        teacherMap.set(teacherId, {
          id: item.teacher.id,
          name: item.teacher.full_name,
          image: item.teacher.image || '/assets/images/common/user.png',
          mobile: item.teacher.mobile
            ? `${item.teacher.country_code ? `+${item.teacher.country_code} ` : ''}${item.teacher.mobile}`
            : '',
          displaySubjects: [],
          moreSubjects: 0,
          allSubjects: [subjectName],
          university: (rawTeacher.university as string) || (rawTeacher.qualification as string) || '',
          department: (rawTeacher.department as string) || '',
          experience: (rawTeacher.experience_years as string) || (rawTeacher.experience as string) || '',
          rating: typeof rawTeacher.rating === 'number' ? rawTeacher.rating : 5.0,
          totalReviews: typeof rawTeacher.total_reviews === 'number' ? rawTeacher.total_reviews : undefined,
          isVerified: Boolean(rawTeacher.is_verified ?? true),
        });
      }
    });

    const processedTeachers: Teacher[] = [];

    teacherMap.forEach((teacher) => {
      const displayCount = teacher.allSubjects.length <= 2 ? teacher.allSubjects.length : 1;
      const displaySubjects = teacher.allSubjects.slice(0, displayCount);

      teacher.displaySubjects = displaySubjects;
      teacher.moreSubjects = Math.max(0, teacher.allSubjects.length - displayCount);

      processedTeachers.push(teacher);
    });

    return processedTeachers;
  }, [teachersData]);

  /**
   * Handles chat button click for a teacher
   */
  const handleChatClick = (teacherId: number) => {
    router.push(`/student/chats?teacherId=${teacherId}`);
  };

  /**
   * Handle rating submission
   */
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingTutor) return;

    try {
      await submitReviewMutation.mutateAsync({
        tutor_id: ratingTutor.id,
        rating: selectedStars,
        comment: reviewComment.trim(),
      });

      toastUtils.success(`Thank you! Your feedback for ${ratingTutor.name} has been submitted.`);
      setRatingTutor(null);
      setReviewComment('');
      setSelectedStars(5);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit review. Please try again.';
      toastUtils.error(msg || 'Failed to submit review');
    }
  };

  return (
    <Container collapsed={collapsed}>
      {/* Breadcrumb */}
      <Breadcrumb
        title={
          isTuitionMedia
            ? (translate('myTutors') || 'My Tutors (আমার গৃহশিক্ষকগণ)')
            : translate('teachers')
        }
        items={breadcrumbItems}
      />

      {/* Tuition Media Banner Header */}
      {isTuitionMedia && (
        <div className="bg-gradient-to-r from-(--primary-color)/10 to-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-(--primary-color) text-white flex items-center justify-center font-bold shadow-xs">
              <BiUserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Assigned Home Tutors (নিযুক্ত গৃহশিক্ষকবৃন্দ)
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                আপনার গৃহশিক্ষকদের সাথে সরাসরি যোগাযোগ করুন, বার্তা বিনিময় করুন এবং রেটিং প্রদান করুন।
              </p>
            </div>
          </div>
          <Link
            href="/student/request-tutor"
            className="px-4 py-2 rounded-xl bg-(--primary-color) text-white font-semibold text-xs hover:opacity-90 transition shadow-xs text-center shrink-0"
          >
            Request Another Tutor
          </Link>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-(--primary-color) mx-auto mb-3"></div>
            <p className="text-sm">
              {isTuitionMedia ? 'Loading assigned tutors...' : translate('loadingTeachers')}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">
            {isTuitionMedia
              ? 'Failed to load assigned tutors. Please try again later.'
              : `${translate('failedToLoadTeachers')}. ${translate('pleaseTryAgainLater')}`}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && teachers.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-6">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <BiUserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {isTuitionMedia ? 'No Tutors Assigned Yet' : translate('noTeachersAssignedYet')}
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            {isTuitionMedia
              ? 'When a tutor is confirmed for your tuition request, their profile and contact details will appear here.'
              : translate('noTeachersAssignedYet')}
          </p>
          {isTuitionMedia && (
            <Link
              href="/student/request-tutor"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--primary-color) text-white font-semibold text-xs hover:opacity-90 transition shadow-sm"
            >
              Request a Tutor Now
            </Link>
          )}
        </div>
      )}

      {/* Tuition Media Tutors Grid */}
      {isTuitionMedia && !isLoading && !error && teachers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teachers.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Tutor Header with Photo & Badge */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                    <Image
                      src={tutor.image}
                      alt={tutor.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 leading-snug truncate">
                        {tutor.name}
                      </h3>
                      {tutor.isVerified && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {tutor.university && (
                      <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                        {tutor.university}
                      </p>
                    )}
                    {tutor.department && (
                      <p className="text-[11px] text-gray-500 truncate">
                        {tutor.department}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating & Experience */}
                <div className="flex items-center justify-between text-xs py-2 px-3 bg-gray-50 rounded-xl mb-3">
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <BiStar className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{tutor.rating ? Number(tutor.rating).toFixed(1) : '5.0'}</span>
                    <span className="text-gray-400 font-normal">/ 5.0</span>
                  </div>
                  {tutor.experience ? (
                    <span className="text-gray-600 font-medium">Exp: {tutor.experience}</span>
                  ) : (
                    <span className="text-gray-500">Experienced Tutor</span>
                  )}
                </div>

                {/* Subjects */}
                <div className="space-y-1 mb-3">
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                    <BiBookOpen className="w-3.5 h-3.5" /> Teaching Subjects:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tutor.allSubjects.map((sub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                {tutor.mobile && (
                  <a
                    href={`tel:${tutor.mobile.replace(/\s/g, '')}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-(--primary-color) transition mt-1"
                    dir="ltr"
                  >
                    <BiPhone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{tutor.mobile}</span>
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setRatingTutor(tutor)}
                  className="flex-1 py-2 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <BiStar className="w-3.5 h-3.5 text-amber-500" />
                  Rate Tutor
                </button>

                <button
                  type="button"
                  onClick={() => handleChatClick(tutor.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-(--primary-color) hover:opacity-90 text-white text-xs font-semibold transition flex items-center justify-center gap-1 shadow-xs"
                >
                  <BiMessageDetail className="w-3.5 h-3.5" />
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Traditional School Mode Grid (100% Preserved) */}
      {!isTuitionMedia && !isLoading && !error && teachers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-[12px] border border-gray-200 overflow-hidden p-3"
            >
              {/* Teacher Image */}
              <div className="relative h-[210px] rounded-[8px] overflow-hidden mb-3">
                <Image
                  src={teacher.image}
                  alt={teacher.name}
                  className="w-full h-full object-contain"
                  width={400}
                  height={210}
                  unoptimized
                />
              </div>

              {/* Teacher Info */}
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 text-[15px] mb-0.5 leading-tight">
                      {teacher.name}
                    </h3>

                    {/* Subjects */}
                    <div className="text-sm font-normal text-gray-500 leading-tight mb-1.5">
                      {teacher.displaySubjects.map((subject, index) => (
                        <p key={index} className="truncate mb-0.5 last:mb-0">
                          {subject}
                        </p>
                      ))}
                    </div>

                    {/* Mobile Number */}
                    {teacher.mobile && (
                      <a
                        href={`tel:${teacher.mobile.replace(/\s/g, '')}`}
                        className="flex items-center gap-1 text-sm font-normal text-gray-500 leading-tight mb-1.5 hover:text-(--primary-color)"
                        dir="ltr"
                      >
                        <BiPhone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{teacher.mobile}</span>
                      </a>
                    )}

                    {/* Additional Subjects Count with Tooltip */}
                    {teacher.moreSubjects > 0 ? (
                      <Tooltip
                        content={
                          <ul className="text-start">
                            {teacher.allSubjects.slice(1).map((subject, index) => (
                              <li key={index} className="block py-0.5">
                                {subject}
                              </li>
                            ))}
                          </ul>
                        }
                        position="top"
                      >
                        <p className="text-(--primary-color) text-sm font-normal leading-tight cursor-pointer">
                          + {teacher.moreSubjects} {translate('more')}
                        </p>
                      </Tooltip>
                    ) : (
                      <p className="text-(--primary-color) text-sm font-normal leading-tight invisible">
                        + 1 {translate('more')}
                      </p>
                    )}
                  </div>

                  {/* Chat Button */}
                  {isFeatureEnabled('Chat Module') && (
                    <button
                      onClick={() => handleChatClick(teacher.id)}
                      className="w-8 h-8 bg-(--primary-color) rounded flex items-center justify-center hover:bg-(--primary-color)/90 transition-colors shrink-0"
                      aria-label={`${translate('chatWith')} ${teacher.name}`}
                    >
                      <BiMessageDetail className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rate Tutor Modal (for Tuition Media) */}
      <Dialog
        open={Boolean(ratingTutor)}
        onOpenChange={(open) => {
          if (!open) setRatingTutor(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Rate & Review Tutor (টিউটর রেটিং ও মতামত)
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              Give your honest feedback for{' '}
              <strong className="text-gray-800">{ratingTutor?.name}</strong> to help maintain
              tuition excellence.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReviewSubmit} className="space-y-4 mt-2">
            {/* Star Selector */}
            <div className="text-center py-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Overall Teaching Rating (রেটিং দিন)
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStars(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <BiStar
                      className={`w-8 h-8 ${
                        star <= selectedStars
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-amber-700 mt-2">
                {selectedStars === 5 && 'Outstanding (অসাধারণ)'}
                {selectedStars === 4 && 'Very Good (খুব ভালো)'}
                {selectedStars === 3 && 'Good (সন্তোষজনক)'}
                {selectedStars === 2 && 'Needs Improvement (উন্নতি প্রয়োজন)'}
                {selectedStars === 1 && 'Unsatisfactory (অসন্তোষজনক)'}
              </p>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Your Feedback / Review Note (আপনার মূল্যায়ন)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="e.g. Very punctual, explains concepts clearly, student improved significantly..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRatingTutor(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitReviewMutation.isPending}
                className="px-5 py-2 rounded-xl bg-(--primary-color) text-white text-xs font-semibold hover:opacity-90 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <BiCheckCircle className="w-4 h-4" />
                {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
