'use client';

import React from 'react';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useLanguage } from '@/components/hooks/useLanguage';
import Image from 'next/image';

const MaintenanceMode = () => {
  const { loading } = useLanguage();
  const translate = useTranslate();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="relative mb-8">
        {/* Simple CSS illustration of maintenance */}
        <Image
          src="/assets/images/common/Group.png"
          alt="Maintenance"
          width={400}
          height={400}
          className="w-48 h-auto sm:w-64"
        />
      </div>

      <h1 className="text-[32px] font-medium text-gray-900 text-center mb-4 max-w-[533px] px-4 leading-lg">
        {translate('maintenanceTitle')}
      </h1>

      <p className="text-lg font-normal text-gray-500 text-center max-w-[715px] leading-base px-4">
        {translate('maintenanceMessage')}
      </p>
    </div>
  );
};

export default MaintenanceMode;
