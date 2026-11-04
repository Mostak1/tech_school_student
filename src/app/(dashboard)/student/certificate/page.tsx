'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/components/store';
import { BiAward, BiDownload, BiHomeSmile, BiShow } from 'react-icons/bi';
import { useTranslate } from '@/components/hooks/useTranslate';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useRouter } from 'next/navigation';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';

import {
  getAssignedCertificates,
  type GetAssignedCertificatesResponse,
  type AssignedCertificate,
  generateCertificate
} from '@/lib/api/student/functions';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';

export default function StudentCertificatePage() {
  const translate = useTranslate();
  const router = useRouter();

  const schoolCode = useSelector(
    (state: RootState) => state.studentAuth.schoolCode
  );
  const { collapsed } = useSidebar();

  const { data: schoolSettings, isLoading: isLoadingSettings } = useGetSchoolSettings();

  useEffect(() => {
    if (isLoadingSettings || !schoolSettings?.data) return;
    const enabledFeatures = schoolSettings.data.features || {};
    const isFeatureEnabled = (name: string) => {
      if (!enabledFeatures || Object.keys(enabledFeatures).length === 0) return true;
      return Object.values(enabledFeatures).some(
        (f) => typeof f === 'string' && f.toLowerCase() === name.toLowerCase()
      );
    };
    if (!isFeatureEnabled('ID Card - Certificate Generation')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  const [certificates, setCertificates] = useState<AssignedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbItems = useMemo(() => [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('certificate'),
    },
  ], [translate]);

  // Fetch Assigned Certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: GetAssignedCertificatesResponse =
          await getAssignedCertificates();

        if (response.success) {
          setCertificates(response.data ?? []);
        } else {
          setError(response.message ?? 'Failed to fetch certificates');
        }
      } catch (err: unknown) {
        console.error('Certificate fetch error:', err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load certificates. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleCertificateAction = async (cert: AssignedCertificate, shouldPrint: boolean = false) => {
    if (!schoolCode) {
      alert('School code not found. Please try logging in again.');
      return;
    }

    try {
      const htmlContent = await generateCertificate(
        cert.id,
        schoolCode
      );

      if (shouldPrint) {
        // Direct Download / Print
        // Since the API returns HTML, we trigger a download of the HTML file
        // Or we can open it in a hidden iframe and print it. 
        // But "direct download" usually means saving the file.
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Certificate_${cert.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // View in new tab
        const newWindow = window.open('', '_blank');

        if (!newWindow) {
          throw new Error('Failed to open preview window');
        }

        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    } catch (err: unknown) {
      console.error('Failed to generate certificate:', err);

      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to process certificate. Please try again.');
      }
    }
  };

  return (
    <Container collapsed={collapsed}>
      {/* Header */}
      <Breadcrumb title={translate('certificate')} items={breadcrumbItems} />

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-4 space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg px-4 py-3">
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-48" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-16 bg-gray-200 rounded-md" />
                <div className="h-7 w-20 bg-gray-200 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center">
          {error}
        </div>
      )}

      {/* Certificates Grid */}
      {!loading && !error && (
        <>
          {certificates.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <BiAward className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700">
                {translate('noCertificatesAvailable')}
              </h3>
              <p className="text-gray-500 mt-2">
                {translate('noCertificatesAvailableMessage')}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-4 space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg px-4 py-3"
                >
                  {/* Left Content */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {cert.certificate_template?.name ?? `Certificate #${cert.certificate_template_id}`}
                      </h3>
                      {/* {cert.certificate_template?.type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--light-primary-color) text-(--primary-color)">
                          {cert.certificate_template.type}
                        </span>
                      )} */}
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                      {cert.exam?.name ? (
                        <span>
                          <span className="font-medium">{translate('exam_name')}:</span> {cert.exam.name}
                        </span>
                      ) : cert.issued_at ? (
                        <span>
                          <span className="font-medium">{translate('issued_date')}:</span> {cert.issued_at}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCertificateAction(cert, false)}
                      className="flex items-center gap-1 text-xs font-medium text-[#22577A] bg-white border border-[#22577A] hover:bg-[#f0f7ff] px-3 py-1.5 rounded-md transition"
                    >
                      <BiShow className="text-sm" />
                      {translate('view')}
                    </button>
                    <button
                      onClick={() => handleCertificateAction(cert, true)}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-[#22577A] hover:bg-[#1b4561] px-3 py-1.5 rounded-md transition"
                    >
                      <BiDownload className="text-sm" />
                      {translate('download')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
}