'use client';
import MyProfile from '@/components/ui/pages/dashboard/MyProfile';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { BiHomeSmile } from 'react-icons/bi';
import Container from '@/components/ui/pages/dashboard/common/Container';
import { useSidebar } from '@/components/contexts/SidebarContext';
import { useTranslate } from '@/components/hooks/useTranslate';

// My Profile Page Component
export default function MyProfilePage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('myProfile'),
      href: '/student/profile',
    },
  ];

  return (
    <>
      <Container collapsed={collapsed}>
        {/* Breadcrumb */}
        <Breadcrumb title={translate('myProfile')} items={breadcrumbItems} />

        {/* My Profile Component */}
        <MyProfile />
      </Container>
    </>
  );
}
