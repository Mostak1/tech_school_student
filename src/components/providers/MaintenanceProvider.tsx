'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSystemBranding } from '@/lib/api/student/queryHooks';

interface MaintenanceProviderProps {
  children: React.ReactNode;
}

export default function MaintenanceProvider({
  children,
}: MaintenanceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: brandingData, isLoading } = useSystemBranding();

  const maintenanceMode = brandingData?.data?.student_web_maintenance;

  useEffect(() => {
    // Skip check if loading
    if (isLoading) return;

    // Check if maintenance mode is enabled ("0") - As per specific user request
    const isMaintenance = maintenanceMode === '1';

    if (isMaintenance) {
      // If enabled and not on maintenance page, redirect to maintenance
      if (pathname !== '/maintenance') {
        router.replace('/maintenance');
      }
    } else {
      // If disabled and currently on maintenance page, redirect to home
      if (pathname === '/maintenance') {
        router.replace('/');
      }
    }
  }, [maintenanceMode, isLoading, pathname, router]);

  return <>{children}</>;
}
