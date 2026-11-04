'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BiHomeSmile } from 'react-icons/bi';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useSearchParams } from 'next/navigation';
import { useGetStudentSubjects, useGetStudentReport } from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import {
  CardSkeleton,
  DiaryDonut, OnlineExamDonut, AssignmentDonut, RadialCircle,
  ExamPerformanceSection, OnlineExamPerformanceSection,
  CATEGORY_BAR_COLORS,
  type ExamItem, type OnlineExamItem,
} from './_components';

export default function ReportPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const isRtl = currentLanguage === 'ar';

  // ── Subjects dropdown ───────────────────────────────────────────────────────
  const { data: subjectsData } = useGetStudentSubjects();
  const allSubjects = useMemo(() => [
    ...(subjectsData?.core_subjects ?? []),
    ...(subjectsData?.elective_subjects ?? []),
  ], [subjectsData]);

  const searchParams = useSearchParams();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => searchParams.get('id') ?? ''
  );

  useEffect(() => {
    if (allSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(String(allSubjects[0].class_subject_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects]);

  const subjectIdParam = useMemo(
    () => (selectedSubjectId ? Number(selectedSubjectId) : undefined),
    [selectedSubjectId]
  );

  // ── Report data ─────────────────────────────────────────────────────────────
  const { data: reportData, isLoading } = useGetStudentReport(subjectIdParam);
  const report = reportData?.data;

  // ── Diary ───────────────────────────────────────────────────────────────────
  const diarySummary = report?.diary_report?.summary;
  const diaryPositive = diarySummary?.positive_count ?? 0;
  const diaryNegative = diarySummary?.negative_count ?? 0;
  const totalDiaryEntries = diarySummary?.total_entries ?? 0;

  const topPositiveCategories = useMemo(
    () => (report?.diary_report?.top_positive_categories ?? []).map(c => ({
      name: c.category_name, count: c.count, percentage: c.percentage,
    })),
    [report]
  );
  const topNegativeCategories = useMemo(
    () => (report?.diary_report?.top_negative_categories ?? []).map(c => ({
      name: c.category_name, count: c.count, percentage: c.percentage,
    })),
    [report]
  );

  // ── Online Exam ─────────────────────────────────────────────────────────────
  const onlineSummary = report?.online_exam_report?.summary;
  const onlineExamTotal = onlineSummary?.total_exams ?? 0;
  const onlineCompleted = onlineSummary?.completed_exams ?? 0;
  const onlineMissed = onlineSummary?.missed_exams ?? 0;

  const onlineBestExams = useMemo<OnlineExamItem[]>(
    () => (report?.online_exam_report?.best_performance ?? []).slice(0, 2).map(e => ({
      name: e.exam_name, obtained: e.obtained_marks, total: e.total_marks,
    })),
    [report]
  );
  const onlineWeakExams = useMemo<OnlineExamItem[]>(
    () => (report?.online_exam_report?.weak_performance ?? []).slice(0, 2).map(e => ({
      name: e.exam_name, obtained: e.obtained_marks, total: e.total_marks,
    })),
    [report]
  );

  // ── Offline Exam ────────────────────────────────────────────────────────────
  const offlineSummary = report?.offline_exam_report?.summary;
  const offlineAvgMarks = useMemo(() => ({

    obtained: offlineSummary?.obtained_marks ?? 0,
    total: offlineSummary?.total_marks ?? 0,
    percentage: offlineSummary?.percentage ?? 0,
    average_marks: offlineSummary?.average_marks ?? 0,
    total_exams: offlineSummary?.total_exams ?? 0,
  }), [offlineSummary]);

  const offlineBestExams = useMemo<ExamItem[]>(
    () => (report?.offline_exam_report?.best_performance ?? []).slice(0, 2).map(e => ({
      name: e.exam_name, grade: e.grade ?? '—', obtained: e.obtained_marks, total: e.total_marks, exam_date: e.exam_date ?? '—',
    })),
    [report]
  );
  const offlineWeakExams = useMemo<ExamItem[]>(
    () => (report?.offline_exam_report?.weak_performance ?? []).slice(0, 2).map(e => ({
      name: e.exam_name, grade: e.grade ?? '—', obtained: e.obtained_marks, total: e.total_marks, exam_date: e.exam_date ?? '—',
    })),
    [report]
  );

  // ── Assignments ─────────────────────────────────────────────────────────────
  const aStats = report?.assignment_report?.statistics;
  const aPoints = report?.assignment_report?.points;
  const assignmentStats = useMemo(() => ({
    total: aStats?.total_assignments ?? 0,
    accepted: aStats?.accepted ?? 0,
    submitted: aStats?.submitted ?? 0,
    pending: aStats?.pending ?? 0,
    rejected: aStats?.rejected ?? 0,
    totalPoints: aPoints?.total_points ?? 0,
    obtained: aPoints?.obtained_points ?? 0,
    percentage: aPoints?.percentage ?? 0,
  }), [aStats, aPoints]);

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  const breadcrumbItems = useMemo(() => [
    { label: translate('home'), href: '/student/dashboard', icon: <BiHomeSmile className="w-5 h-5" /> },
    { label: translate('report') },
  ], [translate]);

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb title={translate('report')} items={breadcrumbItems} />

      <div className="w-full rounded-[12px] bg-white p-6">

        {/* Subject filter */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-3 h-10 w-full max-w-99.25">
            <span className="text-sm font-normal text-black shrink-0">{translate('subjects')}</span>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} dir={isRtl ? 'rtl' : 'ltr'}>
              <SelectTrigger className="flex-1 h-10 text-sm bg-white border border-[#9B9B9B] rounded-sm gap-2 px-3 py-2">
                <SelectValue placeholder={translate('subjects')} />
              </SelectTrigger>
              <SelectContent>
                {allSubjects.map((s) => (
                  <SelectItem key={s.class_subject_id} value={String(s.class_subject_id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Row 1: Diary | Top 5 Positive | Top 5 Negative ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Diary */}
          <div className="bg-[#F7F7F7] rounded-sm border border-[#EAEAEA] p-4 flex flex-col gap-4 h-98.75">
            <div className="flex items-center justify-between h-7.25 gap-4 shrink-0">
              <h3 className="font-semibold text-gray-800 text-sm">{translate('dairyReport')}</h3>
              <Link href="/student/diary" className="text-xs font-medium text-white bg-(--primary-color) px-3 py-1.5 rounded-sm whitespace-nowrap">
                {translate('viewDairy')}
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 flex items-center flex-1">
              {isLoading ? <CardSkeleton /> : (
                <div className="flex flex-col 2xl:flex-row items-center gap-6 w-full">
                  <div className="shrink-0 w-36 h-36 2xl:w-50.5 2xl:h-50.5">
                    <DiaryDonut positive={diaryPositive} negative={diaryNegative}
                      total={totalDiaryEntries} label={translate('dairyReport')} />
                  </div>
                  <div className="flex flex-col gap-4 flex-1 w-full">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#83B807]" />
                        <span className="font-medium text-[#83B807]">{translate('positive')}</span>
                      </div>
                      <span className="font-bold text-gray-900">{String(diaryPositive).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#FF6769]" />
                        <span className="font-medium text-[#FF6769]">{translate('negative')}</span>
                      </div>
                      <span className="font-bold text-gray-900">{String(diaryNegative).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top 5 Positive */}
          <div className="bg-[#F7F7F7] rounded-sm border border-[#EAEAEA] p-4 flex flex-col gap-4 h-98.75">
            <h3 className="font-semibold text-gray-800 text-sm leading-4.75">{translate('top5PositiveCategories')}</h3>
            <div className="bg-white rounded border border-[#EAEAEA] p-4 flex flex-col gap-6 flex-1 overflow-hidden">
              {isLoading ? <CardSkeleton /> : topPositiveCategories.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{translate('noDiaryEntries')}</p>
              ) : topPositiveCategories.map((cat, idx) => (
                <div key={cat.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-1 h-6 text-xs text-gray-700">
                    <span>{cat.name} ({cat.count})</span>
                    <span className="font-semibold">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${cat.percentage}%`, backgroundColor: CATEGORY_BAR_COLORS[idx % CATEGORY_BAR_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Negative */}
          <div className="bg-[#F7F7F7] rounded-sm border border-[#EAEAEA] p-4 flex flex-col gap-4 h-98.75">
            <h3 className="font-semibold text-gray-800 text-sm leading-4.75">{translate('top5NegativeCategories')}</h3>
            <div className="bg-white rounded border border-[#EAEAEA] p-4 flex flex-col gap-6 flex-1 overflow-hidden">
              {isLoading ? <CardSkeleton /> : topNegativeCategories.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{translate('noDiaryEntries')}</p>
              ) : topNegativeCategories.map((cat, idx) => (
                <div key={cat.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-1 h-6 text-xs text-gray-700">
                    <span>{cat.name} ({cat.count})</span>
                    <span className="font-semibold">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${cat.percentage}%`, backgroundColor: CATEGORY_BAR_COLORS[idx % CATEGORY_BAR_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Offline Exam | Online Exam ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Offline Exam */}
          <div className="bg-[#F7F7F7] rounded-sm border border-[#EAEAEA] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between h-7.25 gap-4 shrink-0">
              <h3 className="font-semibold text-gray-800 text-sm">{translate('offlineExam')}</h3>
              <Link href="/student/result" className="text-xs font-medium text-white bg-(--primary-color) px-3 py-1.5 rounded-sm">
                {translate('viewExamsResults')}
              </Link>
            </div>
            <div className="bg-white rounded-lg border border-[#EAEAEA] p-4 flex flex-col gap-4 flex-1">
              {isLoading ? <CardSkeleton /> : (
                <>
                  {/* AVERAGE PERCENTAGE — h=70, p-small=8px, tiny-curve */}
                  <p className="text-sm font-medium text-gray-700 h-5.25 flex items-center">{translate('averageMarks')}</p>
                  <div className="flex items-center gap-4 bg-[#F7F7F7] border border-[#EAEAEA] rounded p-2 h-17.5 shrink-0">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-700 font-semibold">{translate('totalexam')}: {offlineAvgMarks.total_exams}</span>

                      <span className="text-xs text-gray-500"><span dir="ltr">{offlineAvgMarks.obtained}/{offlineAvgMarks.total}</span> {translate('score')}</span>
                    </div>
                    <span className="flex items-center justify-center text-xs font-bold text-white rounded shrink-0"
                      style={{ width: 49, height: 35, backgroundColor: '#57CC99' }}>
                      {offlineAvgMarks.average_marks}
                    </span>
                  </div>
                  <ExamPerformanceSection title={translate('bestExamPerformance')} items={offlineBestExams} emptyLabel={translate('noDataFound')} marksColor="#57CC99" />
                  <ExamPerformanceSection title={translate('weakExamPerformance')} items={offlineWeakExams} emptyLabel={translate('noDataFound')} marksColor="#FF6769" />
                </>
              )}
            </div>
          </div>

          {/* Online Exam */}
          <div className="bg-[#F7F7F7] rounded-sm border border-[#EAEAEA] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between h-7.25 gap-4 shrink-0">
              <h3 className="font-semibold text-gray-800 text-sm">{translate('onlineExam')}</h3>
              <Link href="/student/result" className="text-xs font-medium text-white bg-(--primary-color) px-3 py-1.5 rounded-sm">
                {translate('viewExamsResults')}
              </Link>
            </div>
            <div className="bg-white rounded-lg border border-[#EAEAEA] p-4 flex flex-col gap-4 flex-1">
              {isLoading ? <CardSkeleton /> : (
                <>
                  {/* Complete & Missed Exam — h=136.33, gap=24 */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
                    <div className="relative shrink-0 w-28 h-28 sm:w-34 sm:h-34">
                      <OnlineExamDonut total={onlineExamTotal} completed={onlineCompleted} missed={onlineMissed} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-gray-900 leading-tight">{onlineExamTotal}</span>
                        <span className="text-[10px] text-gray-900 text-center leading-tight">{translate('totalExams')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 w-full">
                      <div className="flex items-center gap-2 h-6">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#22577A]" />
                        <span className="flex-1 text-sm font-normal text-black">{translate('completed')}</span>
                        <span className="text-sm font-normal text-black">{onlineCompleted}</span>
                      </div>
                      <div className="flex items-center gap-2 h-6">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#FF6769]" />
                        <span className="flex-1 text-sm font-normal text-black">{translate('missed')}</span>
                        <span className="text-sm font-normal text-black">{onlineMissed}</span>
                      </div>
                    </div>
                  </div>
                  <OnlineExamPerformanceSection title={translate('bestExamPerformance')} items={onlineBestExams} badgeColor="#57CC99" emptyLabel={translate('noDataFound')} />
                  <OnlineExamPerformanceSection title={translate('weakExamPerformance')} items={onlineWeakExams} badgeColor="#FF6769" emptyLabel={translate('noDataFound')} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Assignments ── */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-gray-800 text-sm">{translate('assignmentsReport')}</h3>
          <div className="flex flex-col gap-6 lg:flex-row">

            {/* Assignment counts */}
            <div className="flex-[888_1_0%] min-w-0 bg-[#F7F7F7] rounded-lg border border-[#EAEAEA] p-4 flex flex-col gap-6">
              <p className="text-sm font-medium text-black">{translate('totalAssignments')}: {assignmentStats.total}</p>
              <div className="bg-white rounded-xl border border-[#EAEAEA] p-4 flex flex-col sm:flex-row items-center gap-6 flex-1">
                {isLoading ? <CardSkeleton /> : (
                  <>
                    <div className="shrink-0 w-40 h-40 sm:w-60 sm:h-60">
                      <AssignmentDonut
                        accepted={assignmentStats.accepted}
                        submitted={assignmentStats.submitted}
                        pending={assignmentStats.pending}
                        rejected={assignmentStats.rejected}
                        total={assignmentStats.total}
                      />
                    </div>
                    <div className="flex flex-col gap-4 flex-1 w-full">
                      {[
                        { label: translate('accepted'), color: '#57CC99', bg: '#EAF9F1', value: assignmentStats.accepted },
                        { label: translate('submitted'), color: '#22577A', bg: '#E8EEF2', value: assignmentStats.submitted },
                        { label: translate('pending'), color: '#DB9305', bg: '#FDF8EC', value: assignmentStats.pending },
                        { label: translate('rejected'), color: '#FF6769', bg: '#FFF3F3', value: assignmentStats.rejected },
                      ].map(({ label, color, bg, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4 border-s-2 rounded-sm p-2"
                          style={{ backgroundColor: bg, borderColor: color }}>
                          <span className="text-sm font-medium" style={{ color }}>{label}</span>
                          <span className="text-sm font-bold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Assignment points */}
            <div className="flex-[628_1_0%] min-w-0 bg-[#F7F7F7] rounded-lg border border-[#EAEAEA] p-4 flex flex-col gap-6">
              <p className="text-xs font-medium text-gray-700 text-center">{translate('totalPoints')}: {assignmentStats.totalPoints}</p>
              <div className="flex flex-col xl:flex-row gap-6 flex-1">
                <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-4">
                  <p className="text-sm font-semibold text-gray-800 text-center">{translate('obtainedPoints')}</p>
                  <div className="w-full aspect-square">
                    <RadialCircle value={assignmentStats.obtained} max={assignmentStats.totalPoints}
                      color="#07B8A0" trailColor="#AEEBE3" label={translate('obtainedPoints')}
                      displayValue={String(assignmentStats.obtained)} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-4">
                  <p className="text-sm font-semibold text-gray-800 text-center">{translate('percentage')}</p>
                  <div className="w-full aspect-square">
                    <RadialCircle value={assignmentStats.percentage} max={100}
                      color="#D26521" trailColor="#FFDFCB" label={translate('percentage')}
                      displayValue={`${assignmentStats.percentage.toFixed(2)}%`} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Container>
  );
}
