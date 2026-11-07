'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useCreateTuitionRequest } from '@/lib/api/student/queryHooks';
import { toastUtils } from '@/components/lib/toast';
import {
  BiHomeSmile,
  BiUserPlus,
  BiBookOpen,
  BiMoney,
  BiMapPin,
  BiCalendar,
  BiMaleFemale,
  BiNote,
  BiX,
  BiCheckCircle,
} from 'react-icons/bi';
import Link from 'next/link';

const CLASS_OPTIONS = [
  'Play / Nursery / KG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5 (PSC)',
  'Class 6',
  'Class 7',
  'Class 8 (JSC)',
  'Class 9',
  'Class 10 (SSC)',
  'HSC 1st Year',
  'HSC 2nd Year',
  'University / Admission Test',
  'O Level / A Level',
  'Language Learning / Other',
];

const MEDIUM_OPTIONS = [
  'Bangla Medium',
  'English Version',
  'English Medium',
  'Madrasah',
  'Religious / Quran Studies',
];

const DAYS_OPTIONS = [
  '2 Days / Week',
  '3 Days / Week',
  '4 Days / Week',
  '5 Days / Week',
  '6 Days / Week',
];

const SUGGESTED_SUBJECTS = [
  'General Math',
  'Higher Math',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Bangla',
  'ICT',
  'General Science',
  'Accounting',
  'Economics',
];

export default function RequestTutorPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();
  const router = useRouter();

  const createTuitionMutation = useCreateTuitionRequest();

  // Form states
  const [classGrade, setClassGrade] = useState('');
  const [medium, setMedium] = useState('Bangla Medium');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('3 Days / Week');
  const [preferredGender, setPreferredGender] = useState<'any' | 'male' | 'female'>('any');
  const [studentGender, setStudentGender] = useState<'male' | 'female'>('male');
  const [salary, setSalary] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('Dhaka');
  const [locationArea, setLocationArea] = useState('');
  const [address, setAddress] = useState('');
  const [studentInstitute, setStudentInstitute] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [submittedPostCode, setSubmittedPostCode] = useState<string | null>(null);

  // Subject tag management
  const handleAddSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed) return;
    if (!selectedSubjects.includes(trimmed)) {
      setSelectedSubjects((prev) => [...prev, trimmed]);
    }
    setCustomSubjectInput('');
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== subjectToRemove));
  };

  const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSubject(customSubjectInput);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classGrade) {
      toastUtils.error(translate('selectClassGrade') || 'Please select a Class / Grade');
      return;
    }

    if (selectedSubjects.length === 0) {
      toastUtils.error(translate('specifySubjects') || 'Please add at least one subject');
      return;
    }

    if (!salary || Number(salary) <= 0) {
      toastUtils.error(translate('enterValidSalary') || 'Please enter an expected budget/salary (৳)');
      return;
    }

    if (!locationArea.trim()) {
      toastUtils.error(translate('specifyArea') || 'Please enter your Area (e.g. Mirpur-10, Dhanmondi)');
      return;
    }

    const title = `Need ${
      preferredGender === 'any' ? '' : preferredGender === 'female' ? 'Female ' : 'Male '
    }Tutor for ${classGrade} (${medium})`;

    const payload = {
      title,
      class_grade: classGrade,
      medium,
      subjects: selectedSubjects.join(', '),
      days_per_week: daysPerWeek,
      preferred_gender: preferredGender,
      preferred_tutor_gender: preferredGender,
      student_gender: studentGender,
      salary: Number(salary),
      location_district: locationDistrict.trim() || 'Dhaka',
      location_area: locationArea.trim(),
      address: address.trim(),
      student_institute: studentInstitute.trim(),
      special_requirements: specialRequirements.trim(),
    };

    try {
      const response = await createTuitionMutation.mutateAsync(payload);
      const jobCode = response?.data?.job_code || 'TM-' + Math.floor(1000 + Math.random() * 9000);
      setSubmittedPostCode(jobCode);
      toastUtils.success(
        response?.message || 'Tuition request submitted successfully! Our team and tutors will review it.'
      );
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit tuition request. Please try again.';
      toastUtils.error(errorMsg || 'Failed to submit tuition request');
    }
  };

  const breadcrumbItems = [
    {
      label: translate('home') || 'Home',
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('requestTutor') || 'Request a Tutor',
    },
  ];

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb
        title={translate('requestTutor') || 'Request a Tutor (গৃহশিক্ষক রিকোয়েস্ট)'}
        items={breadcrumbItems}
      />

      {submittedPostCode ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center max-w-2xl mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BiCheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tuition Request Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            আপনার গৃহশিক্ষক রিকোয়ারমেন্ট পোস্ট তৈরি হয়েছে। অ্যাডমিন ভেরিফিকেশন শেষে উপযুক্ত টিউটররা আবেদন করতে পারবেন।
          </p>
          <div className="inline-block bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg font-mono font-semibold text-emerald-800 mb-6">
            Job Code: {submittedPostCode}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedPostCode(null);
                setSelectedSubjects([]);
                setSalary('');
                setLocationArea('');
                setSpecialRequirements('');
              }}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition"
            >
              Post Another Request
            </button>
            <Link
              href="/student/my-tuitions"
              className="px-5 py-2.5 rounded-xl bg-(--primary-color) text-white font-medium text-sm hover:opacity-90 transition shadow-sm"
            >
              View My Tuition Posts
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-(--primary-color)/10 to-teal-500/10 p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-(--primary-color) text-white flex items-center justify-center shadow">
                  <BiUserPlus className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Find the Perfect Home Tutor (গৃহশিক্ষক খুঁজুন)
                  </h2>
                  <p className="text-sm text-gray-600">
                    আপনার সন্তানের জন্য সেরা গৃহশিক্ষক নিশ্চিত করতে নিচের ফরমটি পূরণ করুন।
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* Class & Medium */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Class / Grade (শ্রেণী) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                    required
                  >
                    <option value="">-- Select Class / Grade --</option>
                    {CLASS_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Curriculum / Medium (মাধ্যম) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                    required
                  >
                    {MEDIUM_OPTIONS.map((med) => (
                      <option key={med} value={med}>
                        {med}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subjects Required */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <BiBookOpen className="w-4 h-4 text-(--primary-color)" />
                  Subjects Required (বিষয়সমূহ) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  নিচের সাজেশনের উপর ক্লিক করুন অথবা লিখে Enter চাপুন।
                </p>

                {/* Selected Subject Badges */}
                {selectedSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {selectedSubjects.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-(--primary-color) text-white shadow-xs"
                      >
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub)}
                          className="hover:text-red-200 focus:outline-none"
                        >
                          <BiX className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    onKeyDown={handleSubjectKeyDown}
                    placeholder="Type subject and press Enter (e.g. Higher Math, Chemistry)..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubject(customSubjectInput)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm transition"
                  >
                    Add
                  </button>
                </div>

                {/* Quick Subject Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {SUGGESTED_SUBJECTS.filter((s) => !selectedSubjects.includes(s)).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleAddSubject(sub)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-gray-100 hover:bg-(--primary-color)/15 hover:text-(--primary-color) text-gray-700 font-medium transition"
                    >
                      + {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days Per Week & Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <BiCalendar className="w-4 h-4 text-(--primary-color)" />
                    Days Per Week (সপ্তাহে কয়দিন) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                    required
                  >
                    {DAYS_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <BiMoney className="w-4 h-4 text-(--primary-color)" />
                    Monthly Salary / Budget (সম্মানী ৳) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. 8000"
                      min="500"
                      step="100"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tutor Gender & Student Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <BiMaleFemale className="w-4 h-4 text-(--primary-color)" />
                    Preferred Tutor Gender (টিউটরের জেন্ডার)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'any', label: 'Any / যে কেউ' },
                      { id: 'male', label: 'Male (পুরুষ)' },
                      { id: 'female', label: 'Female (মহিলা)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPreferredGender(item.id as 'any' | 'male' | 'female')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                          preferredGender === item.id
                            ? 'bg-(--primary-color) text-white border-(--primary-color)'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Student Gender (শিক্ষার্থীর জেন্ডার)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'male', label: 'Male Student (ছাত্র)' },
                      { id: 'female', label: 'Female Student (ছাত্রী)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStudentGender(item.id as 'male' | 'female')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                          studentGender === item.id
                            ? 'bg-(--primary-color) text-white border-(--primary-color)'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <BiMapPin className="w-4 h-4 text-(--primary-color)" />
                    District (জেলা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationDistrict}
                    onChange={(e) => setLocationDistrict(e.target.value)}
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <BiMapPin className="w-4 h-4 text-(--primary-color)" />
                    Area / Thana (এলাকা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    placeholder="e.g. Mirpur-10, Dhanmondi, Uttara Sector-4"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              {/* Student School / College & Full Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Student Institute / School (বর্তমান শিক্ষা প্রতিষ্ঠান)
                  </label>
                  <input
                    type="text"
                    value={studentInstitute}
                    onChange={(e) => setStudentInstitute(e.target.value)}
                    placeholder="e.g. Monipur High School & College"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Detailed Address (বাসা/রোড নম্বর)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House 14, Road 5, Block B"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <BiNote className="w-4 h-4 text-(--primary-color)" />
                  Special Requirements / Note (বিশেষ নির্দেশনা বা পছন্দ)
                </label>
                <textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  rows={3}
                  placeholder="e.g. Prefer BUET, DU or Medical student. Need tutor in the evening (around 6:30 PM). Must be punctual."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--primary-color) focus:border-transparent text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <Link
                  href="/student/my-tuitions"
                  className="text-sm font-medium text-gray-600 hover:text-(--primary-color) transition"
                >
                  View My Previous Posts
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTuitionMutation.isPending}
                    className="px-6 py-2.5 rounded-xl bg-(--primary-color) hover:opacity-90 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {createTuitionMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Post Tuition Request (পোস্ট করুন)'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  );
}

