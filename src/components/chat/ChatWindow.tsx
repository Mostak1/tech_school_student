'use client';
// app/components/chat/ChatWindow.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MessageBubble } from './MessageBubble';
import {
  BiPaperclip,
  BiSend,
  BiArrowToLeft,
  BiX,
  BiFile,
} from 'react-icons/bi';
import {
  useGetMessagesInfinite,
  useSendMessage,
} from '@/lib/api/student/queryHooks';
import type { RootState } from '../store';
import type { ChatMessage } from '@/lib/api/student/functions';
import Image from 'next/image';
import { toastUtils } from '@/components/lib/toast';
import { useTranslate } from '@/components/hooks/useTranslate';

// Define the Message type locally to match MessageBubble expectations
type Message = {
  id: number;
  sender: string;
  isSender: boolean;
  time: string;
  status: 'sent' | 'read';
  content: string;
  attachment?: { name: string; size?: string; url?: string };
  images?: string[];
  avatar?: string;
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

// Props for ChatWindow
type ChatWindowProps = {
  selectedContact: Contact | null;
  onBackToContacts?: () => void;
  isMobile?: boolean;
};

// File type definitions for validation
// Supported file types for attachments
type FilePreview = {
  file: File;
  preview: string; // URL for preview (image URLs, or icon for documents)
  type: 'image' | 'document' | 'video';
};

// Utility function to check if avatar is a valid URL
// Returns true if avatar is a URL, false if it's text/initials
const isValidUrl = (avatar: string): boolean => {
  if (!avatar || avatar.trim() === '') return false;

  // Check if it starts with http://, https://, or /
  if (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('/')
  ) {
    return true;
  }

  return false;
};

// Utility function to extract time from date-time string
// Handles multiple formats: "DD/MM/YYYY HH:MM" and ISO 8601
// Output format: "11:52"
const extractTime = (dateTimeString: string): string => {
  try {
    // Handle null, undefined, or empty strings
    if (!dateTimeString || dateTimeString.trim() === '') {
      return 'now';
    }

    // First, try the original logic for "DD/MM/YYYY HH:MM" format
    const parts = dateTimeString.split(' ');
    if (parts.length > 1 && parts[1].includes(':')) {
      return parts[1];
    }

    // If that doesn't work, try parsing as ISO date
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    // Last fallback
    return 'now';
  } catch (error) {
    console.warn('Error extracting time:', dateTimeString, error);
    return 'now';
  }
};

// Utility function to validate file type
// Returns file category: 'image', 'document', 'video', or null if not supported
const getFileType = (file: File): 'image' | 'document' | 'video' | null => {
  const fileType = file.type.toLowerCase();

  // Check if image (jpg, jpeg, png, gif, webp)
  if (fileType.startsWith('image/')) {
    return 'image';
  }

  // Check if video (only MP4 supported)
  if (fileType === 'video/mp4') {
    return 'video';
  }

  // Check if document (pdf, doc, docx, txt, etc.)
  if (
    fileType === 'application/pdf' ||
    fileType === 'application/msword' ||
    fileType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'text/plain' ||
    fileType === 'application/vnd.ms-excel' ||
    fileType ===
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'document';
  }

  // Unsupported file type
  return null;
};

// Utility function to validate file size
// Returns true if file is valid, false otherwise
const validateFileSize = (file: File): boolean => {
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
  const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB for documents

  const fileType = getFileType(file);

  if (fileType === 'video') {
    return file.size <= MAX_VIDEO_SIZE;
  } else if (fileType === 'image') {
    return file.size <= MAX_IMAGE_SIZE;
  } else if (fileType === 'document') {
    return file.size <= MAX_DOCUMENT_SIZE;
  }

  return false;
};

// Utility function to format file size for display
// Input: bytes (number)
// Output: "1.5 MB", "500 KB", etc.
// const formatFileSize = (bytes: number): string => {
//   if (bytes < 1024) return bytes + ' B';
//   if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
//   return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
// };

// Utility function to parse date from date-time string
// Handles multiple formats: "DD/MM/YYYY HH:MM", "DD-MM-YYYY HH:MM", and ISO 8601
// Returns Date object




// Utility function to check if a file is an image based on file type/extension
const isImageFile = (fileType: string): boolean => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  return imageTypes.includes(fileType.toLowerCase());
};

// Utility function to get file name from URL
const getFileNameFromUrl = (url: string): string => {
  try {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1] || 'file';
  } catch {
    return 'file';
  }
};

// Utility function to transform API messages to MessageBubble format
const transformMessage = (
  apiMessage: ChatMessage,
  loggedInUserId: number,
  contactAvatar?: string,
): Message => {
  const isSender = apiMessage.sender_id === loggedInUserId;

  // Separate files into images and other attachments
  const images: string[] = [];
  let attachment: Message['attachment'] = undefined;

  // Process file attachments from API
  // API uses "attachment" array, not "file"
  if (apiMessage.attachment && apiMessage.attachment.length > 0) {
    apiMessage.attachment.forEach((file) => {
      // Check if file is an image based on file_type
      if (isImageFile(file.file_type)) {
        // Add to images array - use "file" field for URL
        images.push(file.file);
      } else {
        // Use the first non-image file as the attachment
        // If there are multiple non-image files, we'll show the first one
        if (!attachment) {
          attachment = {
            name: getFileNameFromUrl(file.file), // Extract filename from URL
            url: file.file,
          };
        }
      }
    });
  }

  return {
    id: apiMessage.id,
    sender: 'User', // We don't have sender name in message API, so use placeholder
    isSender, // RIGHT side if true, LEFT side if false
    time: extractTime(apiMessage.created_at),
    status: apiMessage.read_at ? 'read' : 'sent', // Check read_at field for status
    content: apiMessage.message || '', // Message text content (can be empty if only files)
    attachment,
    images: images.length > 0 ? images : undefined,
    avatar: contactAvatar, // Use avatar from selected contact
  };
};

export const ChatWindow = ({
  selectedContact,
  onBackToContacts,
  isMobile = false,
}: ChatWindowProps) => {
  const translate = useTranslate();
  // Get the logged-in user ID from Redux store
  const user = useSelector((state: RootState) => state.studentAuth.user);
  const loggedInUserId = user?.id || 0;

  // State for message input and file attachments
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);

  // Fetch messages for the selected contact using React Query with pagination support
  const {
    data: messagesInfiniteData,
    isLoading: isLoadingMessages,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetMessagesInfinite(selectedContact?.id || null);

  // Send message mutation hook
  const sendMessageMutation = useSendMessage(selectedContact?.id || null);

  // Flatten messages from all pages
  const apiMessages =
    messagesInfiniteData?.pages.flatMap((page) => page.data || []) || [];

  // Track if we should scroll to bottom (initial load or new message)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Track previous scroll height for anchoring when loading history
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  // Refs for scroll and file management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // IMPORTANT: Reverse the message order
  // API returns newest first, but we want oldest first (top) and newest last (bottom)
  const reversedApiMessages = [...apiMessages].reverse();

  const transformedMessages = reversedApiMessages.map((msg) =>
    transformMessage(msg, loggedInUserId, selectedContact?.avatar),
  );

  // Group messages by date for rendering with date separators
  // This creates a structure like: [{ date: "Today", messages: [...] }, { date: "Yesterday", messages: [...] }]
  const groupedMessages: Array<{
    dateKey: string;
    dateLabel: string;
    messages: Message[];
  }> = [];

  transformedMessages.forEach((msg, index) => {
    const apiMsg = reversedApiMessages[index];

    // Extract just the date part (e.g., "2026/11/03" from "2026/11/03 09:34")
    const dateKey = apiMsg.created_at ? apiMsg.created_at.split(' ')[0] : 'Unknown Date';
    const dateLabel = dateKey;

    // Check if we already have a group for this date
    const existingGroup = groupedMessages.find(
      (group) => group.dateKey === dateKey,
    );

    if (existingGroup) {
      // Add message to existing date group
      existingGroup.messages.push(msg);
    } else {
      // Create new date group
      groupedMessages.push({
        dateKey,
        dateLabel,
        messages: [msg],
      });
    }
  });

  // Handler for file selection
  // Validates file type and size, creates preview URL
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: FilePreview[] = [];

    // Process each selected file
    Array.from(files).forEach((file) => {
      // Validate file type
      const fileType = getFileType(file);
      if (!fileType) {
        toastUtils.error(translate('fileTypeNotSupported'));
        return;
      }

      // Validate file size
      if (!validateFileSize(file)) {
        toastUtils.error(translate('fileTooLarge'));
        return;
      }

      // Create preview URL for images and videos
      let preview = '';
      if (fileType === 'image' || fileType === 'video') {
        preview = URL.createObjectURL(file);
      }

      // Add to newFiles array
      newFiles.push({
        file,
        preview,
        type: fileType,
      });
    });

    // Add new files to selected files
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler for removing a selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      // Revoke the object URL to free memory
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Handler for sending message
  const handleSendMessage = async () => {
    // Validation: Message or files must be present
    if (!messageInput.trim() && selectedFiles.length === 0) {
      toastUtils.error(translate('pleaseEnterMessageOrSelectFile'));
      return;
    }

    // Validation: Contact must be selected
    if (!selectedContact?.id) {
      toastUtils.error(translate('pleaseSelectContactToSendMessage'));
      return;
    }

    // Prepare message data
    const messageData = {
      to: String(selectedContact.id), // API expects string format
      message: messageInput.trim(),
      files: selectedFiles.map((f) => f.file),
    };

    // Send message using mutation
    sendMessageMutation.mutate(messageData, {
      onSuccess: () => {
        // Clear input and files on success
        setMessageInput('');
        setSelectedFiles([]);

        // Enable scroll to bottom for the user's new message
        setShouldScrollToBottom(true);
      },
      onSettled: () => {
        // Revoke all preview URLs to free memory
        selectedFiles.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      },
    });
  };

  // Intersection Observer to trigger loading history when reaching the top
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Record scroll height before loading more data
          if (scrollContainerRef.current) {
            setPrevScrollHeight(scrollContainerRef.current.scrollHeight);
          }
          setShouldScrollToBottom(false);
          fetchNextPage();
        }
      },
      { threshold: 1.0, rootMargin: '100px' },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle scroll position when history is loaded to prevent jumping
  useEffect(() => {
    if (
      !isFetchingNextPage &&
      prevScrollHeight > 0 &&
      scrollContainerRef.current
    ) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      const scrollDifference = currentScrollHeight - prevScrollHeight;

      if (scrollDifference > 0) {
        scrollContainerRef.current.scrollTop = scrollDifference;
      }
      setPrevScrollHeight(0);
    }
  }, [apiMessages.length, isFetchingNextPage, prevScrollHeight]);

  // Handle initial load - scroll to bottom
  useEffect(() => {
    if (selectedContact?.id) {
      setShouldScrollToBottom(true);
    }
  }, [selectedContact?.id]);

  // Scroll to bottom when new messages arrive via WS or send (not when loading history)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const current = transformedMessages.length;
    if (current > prevMessageCountRef.current && !isFetchingNextPage) {
      setShouldScrollToBottom(true);
    }
    prevMessageCountRef.current = current;
  }, [transformedMessages.length, isFetchingNextPage]);

  // Auto-scroll logic
  useEffect(() => {
    if (
      shouldScrollToBottom &&
      messagesEndRef.current &&
      transformedMessages.length > 0
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [transformedMessages.length, shouldScrollToBottom]);

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  // Show empty state if no contact is selected
  if (!selectedContact) {
    return (
      <main className="grow flex flex-col bg-[#F2F5F7]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-2xl md:text-3xl mx-auto mb-4">
              💬
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
              {translate('selectContactToStartChatting')}
            </h3>
            <p className="text-sm md:text-base text-gray-500">
              {translate('chooseContactFromSidebar')}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grow flex flex-col bg-[#F2F5F7]">
      {/* Header - Mobile responsive with extra small screen support */}
      <header className="flex items-center justify-between p-1.5 sm:p-2 md:p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center min-w-0 flex-1">
          {/* Mobile back button */}
          {isMobile && onBackToContacts && (
            <button
              onClick={onBackToContacts}
              className="me-1.5 sm:me-2 p-0.5 sm:p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <BiArrowToLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 rtl:rotate-180" />
            </button>
          )}

          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 me-1.5 sm:me-2 md:me-3 text-xs sm:text-sm md:text-base shrink-0">
            {/* Check if avatar is URL or text/initials */}
            {isValidUrl(selectedContact.avatar) ? (
              // Show image if avatar is a valid URL
              <Image
                src={selectedContact.avatar}
                alt="avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              // Show initials if avatar is text or empty
              <span className="text-xs sm:text-sm md:text-base font-bold text-gray-700">
                {selectedContact.avatar}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm sm:text-base md:text-lg truncate">
              {selectedContact.name}
            </h2>
            {selectedContact.subject && (
              <p className="text-xs sm:text-xs md:text-sm text-gray-500 truncate">
                {selectedContact.subject}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Message Area - Mobile responsive padding with extra small screen support */}
      <div
        ref={scrollContainerRef}
        className="grow p-1.5 sm:p-3 md:p-6 overflow-y-auto scrollbar-thin"
      >
        {/* Loading history indicator at the top */}
        {hasNextPage && (
          <div ref={loaderRef} className="flex justify-center p-4">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-(--primary-color) border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500">
                  {translate('loadingHistory')}
                </p>
              </div>
            ) : (
              <p className="text-xs text-transparent">Scroll to load more</p>
            )}
          </div>
        )}

        {/* Show loading state while fetching initial messages */}
        {isLoadingMessages && !isFetchingNextPage && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">
              {translate('loadingMessages')}
            </p>
          </div>
        )}

        {/* Show error state if API call fails */}
        {messagesError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-red-500">
              {translate('failedToLoadMessages')}
            </p>
          </div>
        )}

        {/* Show messages when data is available - grouped by date */}
        {!isLoadingMessages && !messagesError && groupedMessages.length > 0 && (
          <>
            {groupedMessages.map((group) => (
              <div key={group.dateKey}>
                {/* Date separator - WhatsApp style */}
                <div className="text-center my-3 md:my-4">
                  <div className=" text-gray-600 text-sm font-normal flex items-center justify-center">
                    <span className="w-[15%] h-[2px] bg-gray-200 hidden sm:block"></span>
                    <span className="text-gray-600 text-sm font-normal mx-4">
                      {group.dateLabel}
                    </span>
                    <span className="w-[15%] h-[2px] bg-gray-200 hidden sm:block"></span>
                  </div>
                </div>

                {/* Messages for this date */}
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    receiverId={selectedContact?.id || null}
                  />
                ))}
              </div>
            ))}
            {/* Invisible div at the end for auto-scroll */}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Show empty state when no messages found */}
        {!isLoadingMessages &&
          !messagesError &&
          groupedMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  {translate('noMessagesYet')}
                </p>
                <p className="text-xs text-gray-400">
                  {translate('startConversationBySendingMessage')}
                </p>
              </div>
            </div>
          )}
      </div>

      {/* File Preview Area - Screenshot matched UI */}
      {selectedFiles.length > 0 && (
        <div className="mx-3 mb-3 p-4 bg-white rounded-[4px] border border-gray-200">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[13px] font-semibold text-gray-500">
              {translate('selectedFiles')} ({selectedFiles.length})
            </p>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            {selectedFiles.map((filePreview, index) => (
              <div
                key={index}
                className="relative shrink-0 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] bg-white rounded-lg overflow-hidden border border-gray-100 group transition-all"
              >
                {/* Image Preview */}
                {filePreview.type === 'image' && (
                  <div className="w-full h-full relative">
                    <Image
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Video Preview */}
                {filePreview.type === 'video' && (
                  <div className="w-full h-full relative bg-black flex items-center justify-center">
                    <div className="text-white">
                      <span className="text-lg">▶</span>
                    </div>
                  </div>
                )}

                {/* Document Preview */}
                {filePreview.type === 'document' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-gray-50/30">
                    <BiFile className="w-7 h-7 text-[#245070]" />
                    <span className="text-[10px] font-bold text-[#245070] uppercase mt-1">
                      {filePreview.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <BiX className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,video/mp4"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Input Area - Replicated from screenshot */}
      <div className="relative mb-4 mx-3 shrink-0">
        <div className="flex items-end bg-white rounded-lg border border-gray-200 shadow-sm p-1.5 min-h-14">
          <textarea
            rows={1}
            placeholder={translate('typeAMessage')}
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sendMessageMutation.isPending}
            className="flex-1 px-3 bg-transparent text-sm md:text-base outline-none disabled:cursor-not-allowed resize-none overflow-y-auto leading-5 py-2 scrollbar-thin"
            style={{ maxHeight: '120px' }}
          />
          <div className="flex items-center gap-2">
            {/* File attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessageMutation.isPending}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <BiPaperclip className="w-5 h-5 rotate-270" />
            </button>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="bg-[#245070] text-white rounded-lg px-4 py-2.5 flex items-center justify-center text-sm font-bold hover:bg-[#1a3a51] transition-all disabled:opacity-50"
            >
              <span className="hidden sm:inline me-2 font-semibold">
                {sendMessageMutation.isPending
                  ? translate('sending')
                  : translate('send')}
              </span>
              <BiSend className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
