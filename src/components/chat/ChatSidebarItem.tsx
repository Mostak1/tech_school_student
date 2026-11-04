'use client';
import React from 'react';
import { ContactItem } from './ContactItem';
import { useGetMessages } from '@/lib/api/student/queryHooks';

/**
 * Utility function to extract time from date-time string
 * Input format: "26/09/2025 11:52"
 * Output format: "11:52"
 */
const extractTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  // Split the string by space to separate date and time
  const parts = dateTimeString.split(' ');
  // Return the time part (second element) + AM/PM if available
  // The API returns "2026-01-05 03:35 PM", so split gives ["2026-01-05", "03:35", "PM"]
  if (parts.length >= 3) {
    return `${parts[1]} ${parts[2]}`;
  }
  return parts.length > 1 ? parts[1] : dateTimeString;
};

// Define the contact type (duplicated from ChatSidebar for now, or import if possible)
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

type ChatSidebarItemProps = Contact & {
  isSelected?: boolean;
  onClick?: () => void;
};

export const ChatSidebarItem: React.FC<ChatSidebarItemProps> = (props) => {
  // Fetch only the latest message (we don't need the whole history, just the last one)
  // detailed fetching is handled by the hook
  const { data: messagesData } = useGetMessages(props.id);

  // Extract time from the latest message if available
  // The API returns most recent messages first?
  // Based on the curl output: "data":[{"id":98... "created_at":"2026-01-07 04:53 PM"}]
  // It seems the array is sorted by latest first? The curl output for receiver_id=328 showed id:98 first.
  let displayTime = props.time;

  if (messagesData?.data && messagesData.data.length > 0) {
    const lastMessage = messagesData.data[0];
    if (lastMessage.created_at) {
      // Use updated_at or created_at checking which one is newer/available,
      // but user asked for "message last time", usually created_at for the message itself is correct.
      // The previous issue was the chat CONVERSATION created_at vs updated_at.
      // For a specific MESSAGE, created_at is the time it was sent.
      displayTime = extractTime(lastMessage.created_at);
    }
  }

  return <ContactItem {...props} time={displayTime} />;
};
