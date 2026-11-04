'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';
import { useGetStudentProfile, useGetSchoolSettings } from '@/lib/api/student/queryHooks';
import { StudentProfileData } from '@/lib/api/student/functions';
import Image from 'next/image';
import { useTranslate } from '@/components/hooks/useTranslate';
import Link from 'next/link';
import { LuGraduationCap } from 'react-icons/lu';

// Type for extra field items
type ExtraFieldItem = NonNullable<StudentProfileData['extra_details']>[number];

export default function MyProfile() {
  const translate = useTranslate();
  // Get school code from Redux store
  const schoolCode = useSelector(
    (state: RootState) => state.studentAuth.schoolCode
  );

  const { data: schoolSettings } = useGetSchoolSettings();
  const enabledFeatures = schoolSettings?.data?.features || {};
  const isIdCardEnabled =
    Object.keys(enabledFeatures).length === 0
      ? false
      : Object.values(enabledFeatures).some(
        (f) => typeof f === 'string' && f.toLowerCase() === 'id card - certificate generation'
      );

  // Fetch profile data using the API hook
  const { data, isLoading, isError, error } = useGetStudentProfile(schoolCode);

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="bg-white rounded-[12px] border border-gray-200 p-8 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{translate('loadingProfileData')}</p>
        </div>
      </div>
    );
  }

  // Show error state if API call failed
  if (isError) {
    return (
      <div className="bg-white rounded-[12px] border border-gray-200 p-8">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">
            {translate('failedToLoadProfileData')}
          </p>
          <p className="text-sm text-gray-600">
            {error instanceof Error
              ? error.message
              : translate('unknownErrorOccurred')}
          </p>
        </div>
      </div>
    );
  }

  // If no data is available
  if (!data?.data) {
    return (
      <div className="bg-white rounded-[12px] border border-gray-200 p-8">
        <div className="text-gray-500 text-center">
          <p>{translate('noProfileDataAvailable')}</p>
        </div>
      </div>
    );
  }

  // Extract profile data from API response
  const profile = data.data;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const className = profile.class_section?.full_name || 'N/A';
  const mediumName = profile.class_section?.medium?.name || 'N/A';
  const schoolName = `${profile.school.name} (${profile.school.code})`;

  // Prefix mobile with country code when present (e.g. "+673 859858997")
  const mobileNumber = profile.mobile
    ? `${profile.country_code ? `+${profile.country_code} ` : ''}${profile.mobile}`
    : 'N/A';

  // Split extra fields into left and right columns
  const extraFields = profile.extra_details || [];
  const midPoint = Math.ceil(extraFields.length / 2);
  const leftExtraFields = extraFields.slice(0, midPoint);
  const rightExtraFields = extraFields.slice(midPoint);

  return (
    <div className="bg-white rounded-[12px] border border-gray-200">
      {/* Profile Header Section */}
      <div className="bg-[#F2F5F7] p-3 sm:p-4 m-2 sm:m-4 rounded-[12px]">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Profile Image */}
          <div className="flex-shrink-0 border border-gray-200 rounded-[4px] p-2">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={fullName}
                width={128}
                height={128}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-[4px] object-cover"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-300 rounded-[4px] flex items-center justify-center">
                <div className="text-gray-500 text-xs sm:text-sm text-center">
                  {translate('profileImage')
                    .split(' ')
                    .map((word, i, arr) => (
                      <React.Fragment key={i}>
                        {word}
                        {i < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Name and ID Card Link */}
          <div className="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {fullName}
            </h1>
            {isIdCardEnabled && (
              <Link
                href="/student/profile/id-card"
                className="inline-flex items-center gap-2 bg-[#22577A] text-white px-3 py-1.5 rounded-[4px] text-xs sm:text-sm font-medium hover:bg-[#1a4461] transition-colors whitespace-nowrap"
              >
                <LuGraduationCap className="w-4 h-4" />
                {translate('idCard')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="p-4 sm:p-6">
        {/* Two-column layout for profile details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 border border-[#EAEAEA] rounded-[12px] p-4 sm:p-6">
          {/* Left Column */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('grNumber')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {profile.admission_no || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('class')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {className}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('rollNumber')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {profile.roll_number || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('currentAddress')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {profile.current_address || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('gender')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {profile.gender || 'N/A'}
              </span>
            </div>

            {/* Display left column extra fields */}
            {leftExtraFields.map((field: ExtraFieldItem) => (
              <div key={field.id} className="flex flex-col space-y-1">
                <label className="text-sm sm:text-base font-normal text-gray-500">
                  {field.form_field.name}
                </label>
                {field.file_url ? (
                  <a
                    href={field.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-black hover:underline font-normal break-all"
                  >
                    {field.file_url}
                  </a>
                ) : (
                  <span
                    className="text-sm sm:text-base text-gray-900 font-normal"
                    dangerouslySetInnerHTML={{
                      __html: field.data || 'N/A',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500 ">
                {translate('school')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {schoolName}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('mobile')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal" dir="ltr">
                {mobileNumber}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('medium')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {mediumName}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('dateOfBirth')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {profile.dob}
              </span>
            </div>

            <div className="flex flex-col space-y-1 border-b border-gray-200 pb-3">
              <label className="text-sm sm:text-base font-normal text-gray-500">
                {translate('permanentAddress')}
              </label>
              <span className="text-sm sm:text-base text-gray-900 font-normal">
                {profile.permanent_address || 'N/A'}
              </span>
            </div>

            {/* Display right column extra fields */}
            {rightExtraFields.map((field: ExtraFieldItem) => (
              <div key={field.id} className="flex flex-col space-y-1">
                <label className="text-sm sm:text-base font-normal text-gray-500">
                  {field.form_field.name}
                </label>
                {field.file_url ? (
                  <a
                    href={field.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-black hover:underline font-normal break-all"
                  >
                    {field.file_url}
                  </a>
                ) : (
                  <span
                    className="text-sm sm:text-base text-gray-900 font-normal"
                    dangerouslySetInnerHTML={{
                      __html: field.data || 'N/A',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
