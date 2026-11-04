'use client';
import ChatPage from '@/components/chat/ChatPage';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useGetSchoolSettings } from '@/lib/api/student/queryHooks';

/**
 * Chats Page Component
 *
 * Displays the chat interface for students.
 * Can open a specific teacher's chat if teacherId is provided in URL query params
 */
// Create a client wrapper to safe-guard useSearchParams usage in static export
const ChatPageContent = () => {
  const searchParams = useSearchParams();

  // Get teacher ID from URL query params if provided
  // Example: /student/chats?teacherId=123 or /student/chats?receiver_id=123
  const teacherId =
    searchParams.get('teacherId') || searchParams.get('receiver_id');
  const initialTeacherId = teacherId ? parseInt(teacherId, 10) : undefined;

  return <ChatPage initialTeacherId={initialTeacherId} />;
};

export default function ChatsPage() {
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

    if (!isFeatureEnabled('Chat Module')) {
      router.push('/student/dashboard');
    }
  }, [schoolSettings, isLoadingSettings, router]);

  return (
    <Container collapsed={collapsed}>
      <React.Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <ChatPageContent />
      </React.Suspense>
    </Container>
  );
}
