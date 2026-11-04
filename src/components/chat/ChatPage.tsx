'use client';
// app/components/chat/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import Breadcrumb from '../ui/pages/dashboard/Breadcrumb';
import { BiHomeSmile } from 'react-icons/bi';
import { useGetClassSectionTeachers } from '@/lib/api/student/queryHooks';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useTranslate } from '@/components/hooks/useTranslate';
import { useNotification } from '@/lib/firebase/NotificationContext';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { ChatMessage, GetMessagesResponse } from '@/lib/api/student/functions';

// Define the contact type
type Contact = {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
  active: boolean;
};

// Props for ChatPage
type ChatPageProps = {
  initialTeacherId?: number; // Optional teacher ID to auto-open chat
};

const ChatPage = ({ initialTeacherId }: ChatPageProps) => {
  const translate = useTranslate();
  const queryClient = useQueryClient();
  // State for managing selected contact and mobile view
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const { lastNotification } = useNotification();

  // Get the logged-in student's class section ID from Redux store
  // This is needed to fetch the teacher's data if initialTeacherId is provided
  const user = useSelector((state: RootState) => state.studentAuth.user);
  const classSectionId = user?.class_section?.id?.toString() || null;

  // Fetch teachers for the student's class section
  // This is only needed if initialTeacherId is provided
  const { data: teachersResponse, isLoading: isLoadingTeachers } =
    useGetClassSectionTeachers(classSectionId);

  // Effect to auto-select teacher chat when initialTeacherId is provided
  // This runs when the component mounts or when initialTeacherId changes
  useEffect(() => {
    // Only proceed if we have an initialTeacherId and teachers data is loaded
    if (initialTeacherId && teachersResponse?.data && !isLoadingTeachers) {
      const teachers = teachersResponse.data;

      // Find the teacher with the matching ID
      const selectedTeacher = teachers.find((t) => t.id === initialTeacherId);

      if (selectedTeacher) {
        // Create a contact object for the selected teacher
        const teacherContact: Contact = {
          id: selectedTeacher.id,
          name: selectedTeacher.full_name,
          lastMessage: translate('startConversation'),
          time: 'now',
          // Use teacher image if available, otherwise use initials
          avatar:
            selectedTeacher.image ||
            selectedTeacher.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
          unread: 0,
          active: true,
        };

        // Set the selected contact to open the chat automatically
        setSelectedContact(teacherContact);
        setShowChatWindow(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTeacherId, teachersResponse, isLoadingTeachers]);

  // WebSocket refs — declared here so both effects below can access them
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  // Activate FCM fallback after this many WS failures (~21 s: 3+6+12 s backoff)
  const fcmFallbackAfterAttempts = 3;
  // true once WS has failed enough times — FCM becomes the live-chat fallback
  const wsFailedRef = useRef(false);

  // Effect to handle incoming chat notifications
  useEffect(() => {
    if (lastNotification?.data) {
      const data = lastNotification.data;

      // Check if it's a chat notification and has a sender_id
      // Field names might vary, checking common ones: sender_id, user_id
      const rawSenderId = data.sender_id || data.user_id;
      const senderId = rawSenderId ? parseInt(rawSenderId) : null;

      if (senderId) {
        // WS is down — FCM is the fallback; invalidate so ChatWindow refetches.
        // Must run before the early-return below so it fires even when already in this chat.
        if (wsFailedRef.current) {
          queryClient.invalidateQueries({ queryKey: ['chat', 'messages', 'infinite', senderId] });
          queryClient.invalidateQueries({ queryKey: ['chat', 'history', 'infinite'] });
          queryClient.invalidateQueries({ queryKey: ['chat', 'users', 'infinite'] });
        }

        // Already chatting with this person — no need to switch contact
        if (selectedContact?.id === senderId) return;

        // Try to find the sender in the loaded teachers list first
        let senderContact: Contact | null = null;

        if (teachersResponse?.data) {
          const teacher = teachersResponse.data.find((t) => t.id === senderId);
          if (teacher) {
            senderContact = {
              id: teacher.id,
              name: teacher.full_name,
              lastMessage: data.message || translate('newMessage'),
              time: 'now',
              avatar: teacher.image || '',
              unread: 0,
              active: true,
            };
          }
        }

        // If not found in teachers list, try using data from notification directly
        if (!senderContact && data.sender_name) {
          senderContact = {
            id: senderId,
            name: data.sender_name,
            lastMessage: data.message || translate('newMessage'),
            time: 'now',
            avatar: data.sender_image || '',
            unread: 0,
            active: true,
          };
        }

        if (senderContact) {
          setSelectedContact(senderContact);
          setShowChatWindow(true);
        }
      }
    }
  }, [lastNotification, teachersResponse, selectedContact?.id, translate, queryClient]);

  // Effect to handle Reverb WebSocket connection
  useEffect(() => {
    const userId = user?.id;

    if (!userId) return;

    let isSubscribed = true;

    const connect = () => {
      if (!isSubscribed) return;

      try {
        const reverbUrl = process.env.NEXT_PUBLIC_REVERB_URL || '';
        console.log('[Reverb] Connecting to:', reverbUrl, '| User ID:', userId);

        const ws = new WebSocket(reverbUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[Reverb] WebSocket open — waiting for connection_established...');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const eventName = data.event;

            console.log('[Reverb] Raw event received:', eventName, data);

            if (eventName === 'pusher:error') {
              console.error('[Reverb] Server error:', data.data);
              return;
            }

            if (eventName === 'pusher:connection_established') {
              const connData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
              console.log('[Reverb] ✅ Connection established | socket_id:', connData?.socket_id);
              reconnectAttemptsRef.current = 0;
              wsFailedRef.current = false;

              const channel = `user.${userId}`;
              console.log('[Reverb] Subscribing to channel:', channel);
              ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { channel } }));
              return;
            }

            if (eventName === 'pusher_internal:subscription_succeeded') {
              console.log('[Reverb] ✅ Subscribed to channel:', data.channel || `user.${userId}`);
              return;
            }

            if (eventName === 'pusher_internal:subscription_error') {
              console.error('[Reverb] Subscription error:', data);
              return;
            }

            if (eventName === 'pusher:ping') {
              ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
              return;
            }

            if (
              eventName === 'NewMessage' ||
              eventName === 'App\\Events\\NewMessage'
            ) {
              console.log('[Reverb] 💬 NewMessage received | raw data:', data.data);

              const payload =
                typeof data.data === 'string'
                  ? JSON.parse(data.data)
                  : data.data;
              const messageData: ChatMessage | undefined = payload.message;

              console.log('[Reverb] Parsed payload:', payload);
              console.log('[Reverb] messageData:', messageData);

              if (messageData) {
                const rawSenderId = messageData.sender_id;
                const senderId = rawSenderId ? parseInt(String(rawSenderId), 10) : null;

                console.log('[Reverb] senderId:', senderId);

                if (senderId) {
                  // Append directly to cache — no API refetch
                  queryClient.setQueryData(
                    ['chat', 'messages', 'infinite', senderId],
                    (old: InfiniteData<GetMessagesResponse> | undefined) => {
                      if (!old) return old;
                      const [firstPage, ...rest] = old.pages;
                      const ids = new Set((firstPage.data || []).map((m) => m.id));
                      if (ids.has(messageData.id)) return old;
                      return {
                        ...old,
                        pages: [
                          { ...firstPage, data: [messageData, ...(firstPage.data || [])] },
                          ...rest,
                        ],
                      };
                    },
                  );
                  queryClient.invalidateQueries({ queryKey: ['chat', 'history', 'infinite'] });
                  queryClient.invalidateQueries({ queryKey: ['chat', 'users', 'infinite'] });
                } else {
                  console.warn('[Reverb] No senderId in messageData — skipping cache update');
                }
              } else {
                console.warn('[Reverb] messageData missing from payload:', payload);
              }
            } else {
              console.log('[Reverb] Unhandled event (ignored):', eventName);
            }
          } catch (e) {
            console.error('[Reverb] Error parsing event:', e, '| raw:', event.data);
          }
        };

        ws.onclose = (closeEvent) => {
          if (!isSubscribed) return;
          console.log('[Reverb] Connection closed | code:', closeEvent.code, '| reason:', closeEvent.reason || '(none)', '| clean:', closeEvent.wasClean);
          reconnect();
        };

        ws.onerror = (error) => {
          if (!isSubscribed) return;
          console.error('[Reverb] Connection error:', error);
        };
      } catch (e) {
        console.error('[Reverb] Connection exception:', e);
        if (isSubscribed) reconnect();
      }
    };

    const reconnect = () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent multiple reconnect calls
        wsRef.current.close();
        wsRef.current = null;
      }

      reconnectAttemptsRef.current++;

      // Activate FCM fallback early (after fcmFallbackAfterAttempts failures)
      if (reconnectAttemptsRef.current >= fcmFallbackAfterAttempts && !wsFailedRef.current) {
        console.log(`[Reverb] ${reconnectAttemptsRef.current} failures — activating FCM fallback.`);
        wsFailedRef.current = true;
      }

      if (reconnectAttemptsRef.current > maxReconnectAttempts) {
        console.log(`[Reverb] Max reconnection attempts (${maxReconnectAttempts}) reached. Giving up.`);
        return;
      }

      // Exponential backoff: 3s, 6s, 12s, 24s ... capped at 60s
      const baseDelay = 3000;
      const delay = Math.min(
        baseDelay * (1 << (reconnectAttemptsRef.current - 1)),
        60000,
      );

      console.log(
        `[Reverb] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
      );

      setTimeout(() => {
        if (isSubscribed) {
          connect();
        }
      }, delay);
    };

    connect();

    return () => {
      isSubscribed = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.id, queryClient]);

  const breadcrumbItems = [
    {
      label: translate('home'),
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('chats'),
    },
  ];

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowChatWindow(true);
  };

  // Handle back to contact list on mobile
  const handleBackToContacts = () => {
    setShowChatWindow(false);
  };

  return (
    <>
      <Breadcrumb title={translate('chats')} items={breadcrumbItems} />

      {/* Desktop Layout - Always show both sidebar and chat */}
      <div className="hidden lg:flex h-[calc(100vh-140px)] font-sans text-gray-800 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
        <ChatSidebar
          onContactSelect={handleContactSelect}
          selectedContact={selectedContact}
        />
        <ChatWindow selectedContact={selectedContact} />
      </div>

      {/* Mobile Layout - Toggle between sidebar and chat */}
      <div className="lg:hidden flex h-[calc(100vh-120px)] font-sans text-gray-800 bg-white border border-gray-200 rounded-[12px] overflow-hidden">
        {!showChatWindow ? (
          <ChatSidebar
            onContactSelect={handleContactSelect}
            selectedContact={selectedContact}
          />
        ) : (
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

export default ChatPage;
