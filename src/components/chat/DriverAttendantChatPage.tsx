'use client';
// components/chat/DriverAttendantChatPage.tsx
import React, { useState, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import Breadcrumb from '../ui/pages/dashboard/Breadcrumb';
import { BiHomeSmile, BiBus } from 'react-icons/bi';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  useGetTransportationDashboard,
  useGetChatHistory,
} from '@/lib/api/student/queryHooks';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslate } from '@/components/hooks/useTranslate';

// Define the contact type (same as in ChatPage)
type Contact = {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
  active: boolean;
};

const DriverAttendantChatPage = () => {
  const translate = useTranslate();
  // State for managing selected contact and mobile view
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Get search params and router to manage URL parameters
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactType = searchParams.get('contact'); // '1' for driver, '2' for attendant

  // Get user data from Redux store
  const { user } = useSelector((state: RootState) => state.studentAuth);
  const userId = user?.id;

  // Fetch transportation dashboard data to get driver and attender information
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useGetTransportationDashboard(
    userId ? { user_id: userId, pickup_drop: 0 } : null
  );

  // Fetch chat history for Driver and Attendant roles
  const { data: driverChatHistoryResponse, isLoading: isLoadingDriverChat } =
    useGetChatHistory('Driver');

  const {
    data: attendantChatHistoryResponse,
    isLoading: isLoadingAttendantChat,
  } = useGetChatHistory('Attendant');

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('transportation'),
      href: '/student/transportation',
      icon: <BiBus className="w-5 h-5" />,
    },
    {
      label: translate('driverAttenderChat'),
    },
  ];

  // Handle contact selection with URL update
  const handleContactSelect = (
    contact: Contact,
    contactTypeParam: '1' | '2'
  ) => {
    setSelectedContact(contact);
    setShowChatWindow(true);

    // Update URL parameter based on selected contact
    router.replace(
      `/student/chats/driver-attendant-chat?contact=${contactTypeParam}`
    );
  };

  // Handle back to contact list on mobile
  const handleBackToContacts = () => {
    setShowChatWindow(false);
    setSelectedContact(null);
  };

  // Utility function to extract time from date-time string
  // This function matches the exact implementation from ChatSidebar.tsx
  const extractTime = (dateTimeString: string): string => {
    // Handle null, undefined, or empty strings
    if (!dateTimeString || dateTimeString.trim() === '') {
      return 'now';
    }

    try {
      // First, try the original ChatSidebar logic for "DD/MM/YYYY HH:MM" format
      const parts = dateTimeString.split(' ');
      if (parts.length > 1 && parts[1].includes(':')) {
        // This handles "26/09/2025 11:52" format
        return parts[1];
      }

      // If that doesn't work, try parsing as ISO date
      const date = new Date(dateTimeString);
      if (!isNaN(date.getTime())) {
        // If it's a valid ISO date, format it as HH:MM
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }

      // Last fallback
      return 'now';
    } catch (error) {
      console.warn('Error parsing date:', dateTimeString, error);
      return 'now';
    }
  };

  // Create contact objects from chat history data
  const createDriverContact = (): Contact | null => {
    // First try to get from chat history (actual chat users) - but only if not loading
    if (!isLoadingDriverChat) {
      // API now returns paginated object, so we need to access .data property
      const driverChatHistoryData = driverChatHistoryResponse?.data;
      const driverChatHistory =
        driverChatHistoryData && Array.isArray(driverChatHistoryData.data)
          ? driverChatHistoryData.data
          : [];

      if (driverChatHistory.length > 0) {
        // Use the first driver from chat history
        const driverChat = driverChatHistory[0];

        // Debug: Log the actual date format from API
        console.log('Driver chat updated_at:', driverChat.updated_at);

        return {
          id: driverChat.user.id,
          name: driverChat.user.full_name,
          lastMessage:
            driverChat.last_message || translate('startConversation'),
          time: extractTime(driverChat.updated_at || ''),
          avatar:
            driverChat.user.image ||
            driverChat.user.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
          unread: driverChat.unread_count,
          active: false,
        };
      }
    }

    // Fallback to transportation data if no chat history found or still loading
    if (!dashboardData?.data?.bus_info?.driver) return null;

    const driver = dashboardData.data.bus_info.driver;
    return {
      id: driver.id,
      name: driver.name,
      lastMessage: translate('startConversation'),
      time: 'now',
      avatar:
        driver.avtar ||
        driver.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      unread: 0,
      active: false,
    };
  };

  const createAttenderContact = (): Contact | null => {
    // First try to get from chat history (actual chat users) - but only if not loading
    if (!isLoadingAttendantChat) {
      // API now returns paginated object, so we need to access .data property
      const attendantChatHistoryData = attendantChatHistoryResponse?.data;
      const attendantChatHistory =
        attendantChatHistoryData && Array.isArray(attendantChatHistoryData.data)
          ? attendantChatHistoryData.data
          : [];

      if (attendantChatHistory.length > 0) {
        // Use the first attendant from chat history
        const attendantChat = attendantChatHistory[0];

        // Debug: Log the actual date format from API
        console.log('Attendant chat updated_at:', attendantChat.updated_at);

        return {
          id: attendantChat.user.id,
          name: attendantChat.user.full_name,
          lastMessage:
            attendantChat.last_message || translate('startConversation'),
          time: extractTime(attendantChat.updated_at || ''),
          avatar:
            attendantChat.user.image ||
            attendantChat.user.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
          unread: attendantChat.unread_count,
          active: false,
        };
      }
    }

    // Fallback to transportation data if no chat history found or still loading
    if (!dashboardData?.data?.bus_info?.attender) return null;

    const attender = dashboardData.data.bus_info.attender;
    return {
      id: attender.id,
      name: attender.name,
      lastMessage: translate('startConversation'),
      time: 'now',
      avatar:
        attender.avtar ||
        attender.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      unread: 0,
      active: false,
    };
  };

  const driverContact = createDriverContact();
  const attenderContact = createAttenderContact();

  // Set contact based on URL parameter or default to driver
  useEffect(() => {
    if (!driverContact || !attenderContact) return;

    if (contactType === '2') {
      // URL parameter is '2' - select attendant
      if (selectedContact?.id !== attenderContact.id) {
        setSelectedContact(attenderContact);
      }
    } else if (contactType === '1') {
      // URL parameter is '1' - select driver
      if (selectedContact?.id !== driverContact.id) {
        setSelectedContact(driverContact);
      }
    } else if (!selectedContact) {
      // No URL parameter - default to driver
      setSelectedContact(driverContact);
    }
  }, [driverContact, attenderContact, contactType, selectedContact]);

  // Show loading state only on initial load (when we don't have any data yet)
  if (isDashboardLoading && !dashboardData) {
    return (
      <>
        <Breadcrumb
          title={translate('driverAttenderChat')}
          items={breadcrumbItems}
        />
        <div className="flex h-screen font-sans text-gray-800 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500">
              {translate('loadingTransportationData')}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show error state if API calls fail or no contacts available
  if (dashboardError || (!driverContact && !attenderContact)) {
    return (
      <>
        <Breadcrumb
          title={translate('driverAttenderChat')}
          items={breadcrumbItems}
        />
        <div className="flex h-screen font-sans text-gray-800 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-center w-full">
            <div className="text-center">
              <p className="text-red-500 mb-2">
                {translate('noDriverOrAttendantAvailable')}
              </p>
              <p className="text-gray-500 text-sm">
                {translate('checkTransportationAssignment')}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        title={translate('driverAttenderChat')}
        items={breadcrumbItems}
      />

      {/* Desktop Layout - Show contact list and chat side by side */}
      <div className="hidden md:flex h-[calc(100vh-120px)] font-sans text-gray-800 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
        {/* Contact List Sidebar - Simple UI */}
        <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">
              {translate('transportationStaff')}
            </h2>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {/* Driver Contact */}
              {driverContact && (
                <div
                  onClick={() => handleContactSelect(driverContact, '1')}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedContact?.id === driverContact.id
                      ? 'bg-blue-50 border border-(--primary-color)'
                      : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-(--primary-color) mr-3 shrink-0">
                    {driverContact.avatar.startsWith('http') ? (
                      <Image
                        src={driverContact.avatar}
                        alt="Driver"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {driverContact.avatar}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {driverContact.name}
                    </h3>
                    <p className="text-sm text-(--primary-color)">
                      {translate('driver')}
                    </p>
                  </div>
                </div>
              )}

              {/* Attender Contact */}
              {attenderContact && (
                <div
                  onClick={() => handleContactSelect(attenderContact, '2')}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedContact?.id === attenderContact.id
                      ? 'bg-blue-50 border border-(--primary-color)'
                      : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-(--primary-color) flex items-center justify-center font-bold text-white mr-3 shrink-0">
                    {attenderContact.avatar.startsWith('http') ? (
                      <Image
                        src={attenderContact.avatar}
                        alt="Attender"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {attenderContact.avatar}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {attenderContact.name}
                    </h3>
                    <p className="text-sm text-(--primary-color)">
                      {translate('attender')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Chat Window */}
        <ChatWindow selectedContact={selectedContact} />
      </div>

      {/* Mobile Layout - Toggle between contact list and chat */}
      <div className="md:hidden flex h-[calc(100vh-120px)] font-sans text-gray-800 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
        {!showChatWindow ? (
          /* Mobile Contact List */
          <div className="w-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">
                {translate('transportationStaff')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {translate('selectContactToStartChatting')}
              </p>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Driver Contact */}
              {driverContact && (
                <div
                  onClick={() => handleContactSelect(driverContact, '1')}
                  className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-(--primary-color) mr-3 shrink-0">
                    {driverContact.avatar.startsWith('http') ? (
                      <Image
                        src={driverContact.avatar}
                        alt="Driver"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {driverContact.avatar}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {driverContact.name}
                    </h3>
                    <p className="text-sm text-(--primary-color)">
                      {translate('driver')}
                    </p>
                  </div>
                </div>
              )}

              {/* Attender Contact */}
              {attenderContact && (
                <div
                  onClick={() => handleContactSelect(attenderContact, '2')}
                  className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="w-12 h-12 rounded-full bg-(--primary-color) flex items-center justify-center font-bold text-white mr-3 shrink-0">
                    {attenderContact.avatar.startsWith('http') ? (
                      <Image
                        src={attenderContact.avatar}
                        alt="Attender"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {attenderContact.avatar}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {attenderContact.name}
                    </h3>
                    <p className="text-sm text-(--primary-color)">
                      {translate('attender')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile Chat Window */
          <ChatWindow
            selectedContact={selectedContact}
            onBackToContacts={handleBackToContacts}
            isMobile={true}
          />
        )}
      </div>
    </>
  );
};

export default DriverAttendantChatPage;
