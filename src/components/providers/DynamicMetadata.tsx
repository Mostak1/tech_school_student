'use client';

import { useEffect } from 'react';
import {
  useGetSchoolSettings,
  useGetSystemBranding,
} from '@/lib/api/student/queryHooks';
import { Loader2 } from 'lucide-react';

export default function DynamicMetadata() {
  const { data: schoolSettings, isLoading: isSettingsLoading } =
    useGetSchoolSettings();
  const { data: systemBranding, isLoading: isBrandingLoading } =
    useGetSystemBranding();

  const isLoading = isSettingsLoading || isBrandingLoading;

  useEffect(() => {
    // Process School Settings (Title & Description)
    if (schoolSettings?.data?.settings) {
      const { school_name, school_tagline } = schoolSettings.data.settings;

      // Update Title
      if (school_name) {
        document.title = school_name as string;
      }

      // Update Description
      if (school_tagline) {
        const metaDescription = document.querySelector(
          'meta[name="description"]',
        );
        if (metaDescription) {
          metaDescription.setAttribute('content', school_tagline as string);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = school_tagline as string;
          document.head.appendChild(meta);
        }
      }
    }

    // Process System Branding (Favicon)
    if (systemBranding?.data?.favicon) {
      const favicon = systemBranding.data.favicon;
      const link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = favicon;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = favicon;
        document.head.appendChild(newLink);
      }
    } else if (schoolSettings?.data?.settings?.favicon) {
      // Fallback to school settings favicon if system branding not available
      const favicon = schoolSettings.data.settings.favicon;
      const link: HTMLLinkElement | null =
        document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = favicon as string;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = favicon as string;
        document.head.appendChild(newLink);
      }
    }
  }, [schoolSettings, systemBranding]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--primary-color)]" />
      </div>
    );
  }

  return null;
}
