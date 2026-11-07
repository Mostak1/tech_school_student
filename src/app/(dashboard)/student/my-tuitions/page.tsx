'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useTranslate } from '@/components/hooks/useTranslate';
import {
  useGetMyTuitionRequests,
  useGetPostApplicants,
  useSelectPostApplicant,
} from '@/lib/api/student/queryHooks';
import { TuitionPost, TuitionApplication } from '@/types/student';
import { toastUtils } from '@/components/lib/toast';
import {
  BiHomeSmile,
  BiClipboard,
  BiUserPlus,
  BiCheckCircle,
  BiTimeFive,
  BiCalendar,
  BiMoney,
  BiMapPin,
  BiUserCheck,
  BiStar,
  BiX,
  BiBookOpen,
  BiPhone,
  BiMessageDetail,
} from 'react-icons/bi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function MyTuitionPostsPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();

  const { data: responseData, isLoading, error, refetch } = useGetMyTuitionRequests();
  const selectApplicantMutation = useSelectPostApplicant();

  // Status Filter: 'all' | 'pending' | 'approved' | 'matched' | 'closed'
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Selected post for viewing applicants modal
  const [selectedPostForApplicants, setSelectedPostForApplicants] = useState<TuitionPost | null>(
    null
  );

  // Fetch applicants for selected post
  const {
    data: applicantsResponse,
    isLoading: isLoadingApplicants,
    refetch: refetchApplicants,
  } = useGetPostApplicants(
    selectedPostForApplicants?.id || 0,
    Boolean(selectedPostForApplicants)
  );

  const posts: TuitionPost[] = useMemo(() => {
    if (!responseData?.data || !Array.isArray(responseData.data)) {
      return [];
    }
    return responseData.data;
  }, [responseData]);

  // Filtered posts based on active tab
  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter((post) => {
      const status = (post.status || '').toLowerCase();
      if (activeFilter === 'approved') {
        return status === 'approved' || status === 'open';
      }
      return status === activeFilter.toLowerCase();
    });
  }, [posts, activeFilter]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: posts.length,
      pending: posts.filter((p) => (p.status || '').toLowerCase() === 'pending').length,
      approved: posts.filter((p) => {
        const s = (p.status || '').toLowerCase();
        return s === 'approved' || s === 'open';
      }).length,
      matched: posts.filter((p) => (p.status || '').toLowerCase() === 'matched').length,
      closed: posts.filter((p) => (p.status || '').toLowerCase() === 'closed').length,
    };
  }, [posts]);

  // Applicants list
  const applicants: TuitionApplication[] = useMemo(() => {
    if (!applicantsResponse?.data || !Array.isArray(applicantsResponse.data)) {
      return [];
    }
    return applicantsResponse.data;
  }, [applicantsResponse]);

  // Confirm / Select an applicant tutor
  const handleSelectApplicant = async (app: TuitionApplication) => {
    if (!selectedPostForApplicants) return;

    const confirmed = window.confirm(
      `Do you want to confirm ${app.tutor_name} as your assigned tutor for this tuition?`
    );
    if (!confirmed) return;

    try {
      await selectApplicantMutation.mutateAsync({
        postId: selectedPostForApplicants.id,
        applicationId: app.application_id || app.id || app.tutor_id,
      });

      toastUtils.success(
        `Great! ${app.tutor_name} has been selected as your tutor. Our support team will coordinate the first session.`
      );
      setSelectedPostForApplicants(null);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to confirm tutor. Please try again.';
      toastUtils.error(msg || 'Failed to confirm tutor');
    }
  };

  const breadcrumbItems = [
    {
      label: translate('home') || 'Home',
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('myTuitions') || 'My Tuition Posts',
    },
  ];

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <BiTimeFive className="w-3.5 h-3.5" />
            Under Review (পর্যালোচনাধীন)
          </span>
        );
      case 'approved':
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BiCheckCircle className="w-3.5 h-3.5" />
            Open for Tutors (আবেদন চলছে)
          </span>
        );
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <BiUserCheck className="w-3.5 h-3.5" />
            Tutor Matched (গৃহশিক্ষক নিযুক্ত)
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Closed (সম্পন্ন)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <Container collapsed={collapsed}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Breadcrumb
          title={translate('myTuitions') || 'My Tuition Posts (আমার পোস্টসমূহ)'}
          items={breadcrumbItems}
        />
        <Link
          href="/student/request-tutor"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-(--primary-color) text-white font-semibold text-sm hover:opacity-90 transition shadow-sm shrink-0"
        >
          <BiUserPlus className="w-5 h-5" />
          Request a Tutor (নতুন পোস্ট)
        </Link>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            {counts.all}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Requests</p>
            <p className="text-base font-bold text-gray-900">সর্বমোট পোস্ট</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            {counts.pending}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Review</p>
            <p className="text-base font-bold text-gray-900">যাচাইাধীন</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            {counts.approved}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Open for Tutors</p>
            <p className="text-base font-bold text-gray-900">অনুমোদিত</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            {counts.matched}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Matched / Active</p>
            <p className="text-base font-bold text-gray-900">নিযুক্ত টিউটর</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {[
          { key: 'all', label: `All Posts (${counts.all})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'approved', label: `Open (${counts.approved})` },
          { key: 'matched', label: `Matched (${counts.matched})` },
          { key: 'closed', label: `Closed (${counts.closed})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeFilter === tab.key
                ? 'bg-(--primary-color) text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-3 border-(--primary-color) border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading your tuition posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <p className="text-red-700 font-medium mb-3">Failed to load tuition posts.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPosts.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-6">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <BiClipboard className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Tuition Posts Found</h3>
          <p className="text-sm text-gray-500 mb-6">
            {activeFilter === 'all'
              ? 'You have not posted any tuition requirement yet.'
              : `No posts found under "${activeFilter}" filter.`}
          </p>
          <Link
            href="/student/request-tutor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--primary-color) text-white font-semibold text-sm hover:opacity-90 transition shadow-sm"
          >
            <BiUserPlus className="w-4 h-4" />
            Request a Tutor Now
          </Link>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !error && filteredPosts.length > 0 && (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 hover:border-gray-300 transition shadow-xs"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                      {post.job_code || `TM-${post.id}`}
                    </span>
                    {getStatusBadge(post.status)}
                    <span className="text-xs text-gray-400">
                      Posted on{' '}
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    {post.title || `Need Tutor for ${post.class_grade} (${post.medium})`}
                  </h3>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <div className="text-xs text-gray-500 font-medium">Monthly Budget</div>
                  <div className="text-xl font-bold text-(--primary-color)">
                    ৳ {Number(post.salary || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Badges / Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-3 border-y border-gray-100 text-xs text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <BiBookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    <strong className="text-gray-800 font-medium">Class:</strong>{' '}
                    {post.class_grade} ({post.medium})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BiCalendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    <strong className="text-gray-800 font-medium">Schedule:</strong>{' '}
                    {post.days_per_week}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BiMapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">
                    <strong className="text-gray-800 font-medium">Location:</strong>{' '}
                    {post.location_area}, {post.location_district}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <BiUserCheck className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    <strong className="text-gray-800 font-medium">Tutor Gender:</strong>{' '}
                    {post.preferred_tutor_gender || post.preferred_gender || 'Any'}
                  </span>
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 font-medium mb-1.5">Required Subjects:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(post.subjects || '')
                    .split(',')
                    .map((sub) => sub.trim())
                    .filter(Boolean)
                    .map((sub, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                      >
                        {sub}
                      </span>
                    ))}
                </div>
              </div>

              {/* Special Requirements if any */}
              {post.special_requirements && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mb-4 border border-gray-100">
                  <strong className="text-gray-800">Special Note: </strong>
                  {post.special_requirements}
                </div>
              )}

              {/* Assigned Tutor Card if Matched */}
              {post.assigned_tutor && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      {post.assigned_tutor.image ? (
                        <Image
                          src={post.assigned_tutor.image}
                          alt={post.assigned_tutor.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        post.assigned_tutor.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-sm">
                          {post.assigned_tutor.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                          Assigned Tutor
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {post.assigned_tutor.university} • {post.assigned_tutor.department}
                      </p>
                      {post.assigned_tutor.rating && (
                        <div className="flex items-center gap-1 text-amber-600 text-xs mt-0.5 font-semibold">
                          <BiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{post.assigned_tutor.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/student/teachers"
                      className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold transition"
                    >
                      View in My Tutors
                    </Link>
                    <Link
                      href="/student/chats"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1"
                    >
                      <BiMessageDetail className="w-3.5 h-3.5" />
                      Chat
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {post.applications_count || 0} Tutors Applied for this Post
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPostForApplicants(post)}
                    className="px-4 py-2 rounded-xl bg-(--primary-color) text-white font-semibold text-xs hover:opacity-90 transition shadow-xs flex items-center gap-1.5"
                  >
                    <BiUserCheck className="w-4 h-4" />
                    View Applicants ({post.applications_count || 0})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applicants Dialog / Modal */}
      <Dialog
        open={Boolean(selectedPostForApplicants)}
        onOpenChange={(open) => {
          if (!open) setSelectedPostForApplicants(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader className="mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Applicant Tutors (আবেদনকারী শিক্ষকগণ)
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-1">
                  Job Code: {selectedPostForApplicants?.job_code} —{' '}
                  {selectedPostForApplicants?.class_grade} ({selectedPostForApplicants?.medium})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Loading */}
          {isLoadingApplicants && (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-(--primary-color) border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Fetching applicant tutors...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingApplicants && applicants.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <BiUserPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800">No Applications Received Yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Qualified tutors from top universities (BUET, DU, DMC, etc.) will apply soon.
                Our tuition coordinator will also recommend top candidates.
              </p>
            </div>
          )}

          {/* Applicants List */}
          {!isLoadingApplicants && applicants.length > 0 && (
            <div className="space-y-4">
              {applicants.map((app) => (
                <div
                  key={app.application_id || app.id || app.tutor_id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-(--primary-color)/40 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 text-(--primary-color) flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
                        {app.image ? (
                          <Image
                            src={app.image}
                            alt={app.tutor_name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          app.tutor_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-gray-900 text-sm">{app.tutor_name}</h4>
                          {Boolean(app.is_verified) && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          {app.university}
                          {app.department ? ` • ${app.department}` : ''}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          {app.experience_years && (
                            <span>Experience: {app.experience_years}</span>
                          )}
                          {app.rating && (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <BiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {app.rating} {app.total_reviews ? `(${app.total_reviews})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[11px] text-gray-500">Expected Salary</div>
                      <div className="text-base font-bold text-(--primary-color)">
                        ৳ {Number(app.expected_salary || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {app.cover_note && (
                    <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 mb-3 border border-gray-100 italic">
                      &quot;{app.cover_note}&quot;
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    {app.phone ? (
                      <a
                        href={`tel:${app.phone}`}
                        className="text-xs font-semibold text-gray-600 hover:text-(--primary-color) flex items-center gap-1"
                      >
                        <BiPhone className="w-3.5 h-3.5" />
                        Call Tutor
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Phone verified by admin</span>
                    )}

                    <button
                      onClick={() => handleSelectApplicant(app)}
                      disabled={selectApplicantMutation.isPending}
                      className="px-4 py-1.5 rounded-lg bg-(--primary-color) text-white font-semibold text-xs hover:opacity-90 transition shadow-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      <BiCheckCircle className="w-3.5 h-3.5" />
                      Confirm Tutor (গৃহশিক্ষক নির্বাচন)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

