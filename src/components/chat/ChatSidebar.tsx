'use client';
// app/components/chat/ChatSidebar.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChatSidebarItem } from './ChatSidebarItem';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BiMessageAdd, BiSearch } from 'react-icons/bi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  useGetChatUsersInfinite,
  useGetChatHistoryInfinite,
} from '@/lib/api/student/queryHooks';
import type { RootState } from '../store';
import Image from 'next/image';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useLanguage } from '@/components/hooks/useLanguage';

/**
 * Utility function to extract time from date-time string
 * Input format: "26/09/2025 11:52"
 * Output format: "11:52"
 */
const extractTime = (dateTimeString: string): string => {
  // Split the string by space to separate date and time
  const parts = dateTimeString.split(' ');
  // Return the time part (second element)
  return parts.length > 1 ? parts[1] : dateTimeString;
};

// Define the contact type
type Contact = {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
  active: boolean;
  subject?: string;
};

// Props for ChatSidebar
type ChatSidebarProps = {
  onContactSelect: (contact: Contact) => void;
  selectedContact: Contact | null;
  initialSelectedId?: number;
};

export const ChatSidebar = ({
  onContactSelect,
  selectedContact,
  initialSelectedId,
}: ChatSidebarProps) => {
  const translate = useTranslate();
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';

  // State to manage search input value
  // This will be used to filter chat history by contact name or message content
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get the logged-in student's ID from Redux store for the API
  const user = useSelector((state: RootState) => state.studentAuth.user);

  // Fetch chat users (teachers/staff) using Infinite Query
  // We use the new /users endpoint which supports pagination
  const {
    data: usersData,
    fetchNextPage: fetchNextUsersPage,
    hasNextPage: hasNextUsersPage,
    isFetchingNextPage: isFetchingNextUsersPage,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useGetChatUsersInfinite('Staff', user?.id || null);

  // Fetch chat history using Infinite Query
  const {
    data: chatHistoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingChatHistory,
    error: chatHistoryError,
  } = useGetChatHistoryInfinite('Staff', searchTerm);

  // Flatten the paginated users data
  const teachers =
    usersData?.pages.flatMap((page) =>
      Array.isArray(page.data?.data) ? page.data.data : [],
    ) || [];

  // Flatten the paginated data
  const chatHistory =
    chatHistoryData?.pages.flatMap((page) =>
      Array.isArray(page.data?.data) ? page.data.data : [],
    ) || [];

  // Transform chat history to Contact format for ContactItem component
  const contacts: Contact[] = chatHistory.map((chat) => {
    // Determine the name to display
    const displayName = chat.user.full_name;

    // Determine the avatar to display
    const displayAvatar = chat.user.image || '';

    const contact: Contact = {
      id: chat.user.id,
      name: displayName,
      lastMessage: chat?.last_message || '', // Use exact message as per requirement, handle missing messages
      time: chat?.updated_at ? extractTime(chat.updated_at) : '',
      avatar: displayAvatar,
      unread: chat?.unread_count,
      active: selectedContact?.id === chat.user.id,
      subject:
        chat.user.subject_teachers && chat.user.subject_teachers.length > 0
          ? chat.user.subject_teachers[0].subject_with_name
          : undefined,
    };
    return contact;
  });

  // Handle contact selection
  const handleContactClick = (contact: Contact) => {
    onContactSelect(contact);
  };

  // Handle teacher selection
  const handleTeacherSelect = (teacher: (typeof teachers)[0]) => {
    // Create a contact object for the selected teacher
    const newContact: Contact = {
      id: teacher.id,
      name: teacher.full_name,
      lastMessage: translate('startConversation'),
      time: 'now',
      avatar: teacher.image || '',
      unread: 0,
      active: true,
      subject:
        teacher.subject_teachers && teacher.subject_teachers.length > 0
          ? teacher.subject_teachers[0].subject_with_name
          : undefined,
    };
    onContactSelect(newContact);
  };

  // Auto-select contact if initialSelectedId is present and not already selected
  useEffect(() => {
    if (initialSelectedId && contacts.length > 0 && !selectedContact) {
      const foundContact = contacts.find((c) => c.id === initialSelectedId);
      if (foundContact) {
        onContactSelect(foundContact);
      }
    }
  }, [initialSelectedId, contacts, selectedContact, onContactSelect]);

  return (
    <aside className="w-full lg:w-[360px] bg-white border-e border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Search Input - Responsive width */}
          <div className="relative flex-1 bg-(--light-primary-color)">
            <Input
              type="text"
              placeholder={translate('searchContact')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pe-10 rounded-[4px] h-[40px] md:h-[44px] shadow-none text-sm"
            />
            <Button className="absolute end-[6px] top-1/2 transform -translate-y-1/2 h-6 w-6 md:h-7 md:w-7 bg-transparent hover:bg-transparent p-0">
              <BiSearch className="text-lg md:text-xl text-gray-500" />
            </Button>
          </div>
          {/* Teacher Selection Dropdown - Responsive button */}
          <DropdownMenu dir={isRTL ? 'rtl' : 'ltr'}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-(--primary-color) rounded-[4px] hover:bg-(--primary-color)/90 transition-colors h-[40px] w-[40px] md:h-[44px] md:w-[44px] p-0 flex items-center justify-center">
                <BiMessageAdd className="w-6 h-6 md:w-6 md:h-6 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? 'start' : 'end'}
              className="w-72 max-h-96 overflow-y-auto p-1"
            >
              {/* Show loading state while fetching teachers */}
              {isLoadingUsers && (
                <div className="p-4 text-center text-sm text-gray-500">
                  {translate('loadingTeachers')}
                </div>
              )}

              {/* Show error message if API call fails */}
              {usersError && (
                <div className="p-4 text-center text-sm text-red-500">
                  {translate('failedToLoadTeachers')}
                </div>
              )}

              {/* Show teachers list when data is available */}
              {!isLoadingUsers && !usersError && teachers.length > 0 && (
                <>
                  {teachers.map((teacher, index) => (
                    <div key={teacher.id}>
                      <DropdownMenuItem
                        onClick={() => handleTeacherSelect(teacher)}
                        className="flex items-center p-2 cursor-pointer"
                      >
                        {/* Avatar - show image if available, otherwise show initials */}
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 me-2 md:me-3">
                          {teacher.image ? (
                            <Image
                              src={teacher.image}
                              alt={teacher.full_name}
                              width={32}
                              height={32}
                              className="rounded-full w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold">
                              {teacher.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Teacher info */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-xs md:text-sm">
                            {teacher.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {teacher.role}
                          </div>
                        </div>
                      </DropdownMenuItem>
                      {/* Only show separator if not the last item */}
                      {index < teachers.length - 1 && <DropdownMenuSeparator />}
                    </div>
                  ))}

                  {/* Load More Button for Teachers */}
                  {hasNextUsersPage && (
                    <div className="p-2 text-center border-t border-gray-100">
                      <Button
                        onClick={(e) => {
                          e.preventDefault(); // Prevent dropdown closing
                          fetchNextUsersPage();
                        }}
                        disabled={isFetchingNextUsersPage}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-8 text-primary hover:text-primary/80 hover:bg-primary/5"
                      >
                        {isFetchingNextUsersPage
                          ? translate('loadingMore')
                          : translate('loadMore')}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Show empty state when no teachers found */}
              {!isLoadingUsers && !usersError && teachers.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  {translate('noTeachersAvailable')}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grow overflow-y-auto">
        <nav>
          {/* Show contacts list when data is available */}
          {!isLoadingChatHistory &&
            !chatHistoryError &&
            contacts.length > 0 && (
              <>
                {contacts.map((contact) => (
                  <ChatSidebarItem
                    key={contact.id}
                    {...contact}
                    isSelected={selectedContact?.id === contact.id}
                    onClick={() => handleContactClick(contact)}
                  />
                ))}

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="p-4 text-center w-full">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="w-full text-xs h-8 text-primary border-primary hover:bg-primary/10"
                    >
                      {isFetchingNextPage
                        ? translate('loadingMore') + '...'
                        : translate('loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}

          {/* Show loading state while fetching initial data */}
          {isLoadingChatHistory && (
            <div className="p-4 text-center text-sm text-gray-500">
              {translate('loadingContacts')}
            </div>
          )}

          {/* Show error message if API call fails */}
          {chatHistoryError && (
            <div className="p-4 text-center text-sm text-red-500">
              {translate('failedToLoadContacts')}
            </div>
          )}

          {/* Show empty state when no contacts found */}
          {!isLoadingChatHistory &&
            !chatHistoryError &&
            contacts.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                {translate('noContactsAvailable')}
              </div>
            )}
        </nav>
      </div>
    </aside>
  );
};
