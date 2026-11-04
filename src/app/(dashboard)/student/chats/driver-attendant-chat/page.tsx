'use client';
import DriverAttendantChatPage from '@/components/chat/DriverAttendantChatPage';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';

export default function DriverAttendantChatsPage() {
  const { collapsed } = useSidebar();

  return (
    <Container collapsed={collapsed}>
      <DriverAttendantChatPage />
    </Container>
  );
}
