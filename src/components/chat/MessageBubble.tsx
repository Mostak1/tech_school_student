'use client';
// app/components/chat/MessageBubble.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/components/store';
import {
  FileText,
  Download,
  CheckCheck,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { SharedMediaModal } from './SharedMediaModal';
import { ImageLightbox } from './ImageLightbox';
import { useDeleteMessage } from '@/lib/api/student/queryHooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Message type definition
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

type MessageBubbleProps = {
  message: Message;
  receiverId?: number | null;
};

// Receiver message content component (left-aligned, gray background)
const MessageContent: React.FC<{
  content: string;
  attachment?: { name: string; size?: string; url?: string };
  images?: string[];
}> = ({ content, attachment, images }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDownloadFile = async (
    imageUrl: string,
    fileName?: string,
    index?: number,
  ) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `image-${(index ?? 0) + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 items-start">
      {/* Text content */}
      {content && content.trim() !== '' && (
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 bg-[#EAEAEA] rounded-xl rounded-tl-none max-w-[calc(100vw-120px)] xs:max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] break-words">
          <p className="text-[13px] sm:text-sm md:text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>
      )}

      {/* File Attachments */}
      {attachment && (
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 bg-[#EAEAEA] rounded-xl rounded-tl-none max-w-[calc(100vw-120px)] xs:max-w-[280px] sm:max-w-[400px] md:max-w-[500px]">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-2 sm:p-2.5 md:p-3 gap-2 sm:gap-2.5 md:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 bg-[#D1F4E0] rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-gray-700" />
            </div>
            <div className="grow min-w-0">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 truncate">
                {attachment.name}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                {attachment.size}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (attachment?.url) {
                  handleDownloadFile(attachment.url, attachment.name);
                }
              }}
              className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* Image Attachments */}
      {images && images.length > 0 && (
        <div className="px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-3.5 md:py-3 bg-[#EAEAEA] rounded-xl rounded-tl-none max-w-[calc(100vw-120px)] xs:max-w-[300px] sm:max-w-[380px] md:max-w-[450px]">
          <div
            className={`grid ${
              images.length === 1
                ? 'grid-cols-1 max-w-[200px] sm:max-w-[250px]'
                : 'grid-cols-2'
            } gap-1.5 sm:gap-2 md:gap-2.5`}
          >
            {images.slice(0, 3).map((src, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 cursor-pointer"
                onClick={() => setPreviewIndex(index)}
              >
                <Image
                  width={300}
                  height={300}
                  src={src}
                  alt={`attachment ${index + 1}`}
                  className="w-full h-full object-cover"
                  priority
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(src, undefined, index);
                  }}
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/95 hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-md shadow-lg transition-all opacity-0 group-hover:opacity-100 touch:opacity-100"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            ))}
            {images.length > 3 && (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  width={300}
                  height={300}
                  src={images[3]}
                  alt="more images"
                  className="w-full h-full object-cover"
                  priority
                />
                <button
                  onClick={handleOpenModal}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg hover:bg-black/70 transition-colors cursor-pointer"
                >
                  <span className="text-gray-900 font-semibold text-xs sm:text-sm md:text-base bg-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 shadow-md">
                    +{images.length - 3} More
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Media Modal */}
      {images && images.length > 3 && (
        <SharedMediaModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          images={images}
        />
      )}

      {/* Image Lightbox */}
      {previewIndex !== null && images && (
        <ImageLightbox
          images={images}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
};

// Sender message content component (right-aligned, green background)
const MessageContentSender: React.FC<{
  content: string;
  attachment?: { name: string; size?: string; url?: string };
  images?: string[];
}> = ({ content, attachment, images }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDownloadFile = async (
    imageUrl: string,
    fileName?: string,
    index?: number,
  ) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `image-${(index ?? 0) + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 items-end">
      {/* Text content */}
      {content && content.trim() !== '' && (
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 bg-[#CEF0E0] rounded-xl rounded-tr-none max-w-[calc(100vw-120px)] xs:max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] break-words">
          <p className="text-[13px] sm:text-sm md:text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed text-left">
            {content}
          </p>
        </div>
      )}

      {/* File Attachments */}
      {attachment && (
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 bg-[#CEF0E0] rounded-xl rounded-tr-none max-w-[calc(100vw-120px)] xs:max-w-[280px] sm:max-w-[400px] md:max-w-[500px]">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-2 sm:p-2.5 md:p-3 gap-2 sm:gap-2.5 md:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 bg-[#CEF0E0] rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-gray-700" />
            </div>
            <div className="grow min-w-0">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 truncate">
                {attachment.name}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                {attachment.size}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (attachment?.url) {
                  handleDownloadFile(attachment.url, attachment.name);
                }
              }}
              className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* Image Attachments */}
      {images && images.length > 0 && (
        <div className="px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-3.5 md:py-3 bg-[#CEF0E0] rounded-xl rounded-tr-none max-w-[calc(100vw-120px)] xs:max-w-[300px] sm:max-w-[380px] md:max-w-[450px]">
          <div
            className={`grid ${
              images.length === 1
                ? 'grid-cols-1 max-w-[200px] sm:max-w-[250px]'
                : 'grid-cols-2'
            } gap-1.5 sm:gap-2 md:gap-2.5`}
          >
            {images.slice(0, 3).map((src, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 cursor-pointer"
                onClick={() => setPreviewIndex(index)}
              >
                <Image
                  width={300}
                  height={300}
                  src={src}
                  alt={`attachment ${index + 1}`}
                  className="w-full h-full object-cover"
                  priority
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(src, undefined, index);
                  }}
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/95 hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-md shadow-lg transition-all opacity-0 group-hover:opacity-100 touch:opacity-100"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            ))}
            {images.length > 3 && (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  width={300}
                  height={300}
                  src={images[3]}
                  alt="more images"
                  className="w-full h-full object-cover"
                  priority
                />
                <button
                  onClick={handleOpenModal}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg hover:bg-black/70 transition-colors cursor-pointer"
                >
                  <span className="text-gray-900 font-semibold text-xs sm:text-sm md:text-base bg-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 shadow-md">
                    +{images.length - 3} More
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Media Modal */}
      {images && images.length > 3 && (
        <SharedMediaModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          images={images}
        />
      )}

      {/* Image Lightbox */}
      {previewIndex !== null && images && (
        <ImageLightbox
          images={images}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
};

// Sender message component (right-aligned, green background)
const SenderMessage: React.FC<{
  messageId: number;
  content: string;
  time: string;
  status: 'sent' | 'read';
  attachment?: { name: string; size?: string; url?: string };
  images?: string[];
  avatar?: string;
  receiverId?: number | null;
}> = ({ messageId, content, time, attachment, images, receiverId }) => {
  const deleteMessageMutation = useDeleteMessage(receiverId || null);
  const studentImage = useSelector((state: RootState) => state.studentAuth.user?.image);

  const handleDeleteMessage = () => {
    deleteMessageMutation.mutate({ id: [messageId] });
  };

  return (
    <div className="flex justify-end items-start gap-1.5 sm:gap-2 md:gap-2.5 mb-2.5 sm:mb-3 md:mb-4 px-2 sm:px-3 group">
      {/* Message content */}
      <div className="flex flex-col items-end flex-1 min-w-0">
        <MessageContentSender
          content={content}
          attachment={attachment}
          images={images}
        />
        {/* Time and status */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] sm:text-xs text-gray-500">{time}</span>
          <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-(--primary-color)" />
        </div>
      </div>

      {/* Avatar and menu */}
      <div className="flex items-start gap-0.5 sm:gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-0.5 sm:p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-100"
              aria-label="Message options"
            >
              <MoreVertical className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem
              variant="destructive"
              onClick={handleDeleteMessage}
              disabled={deleteMessageMutation.isPending}
              className="cursor-pointer gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gray-200 overflow-hidden shrink-0">
          <Image
            src={studentImage || '/assets/images/common/user.png'}
            alt="avatar"
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

// Non-sender message component (left-aligned, gray background)
const NonSenderMessage: React.FC<{
  content: string;
  time: string;
  avatar?: string;
  attachment?: { name: string; size?: string; url?: string };
  images?: string[];
}> = ({ content, time, avatar, attachment, images }) => {
  return (
    <div className="flex justify-start items-start gap-1.5 sm:gap-2 md:gap-2.5 mb-2.5 sm:mb-3 md:mb-4 px-2 sm:px-3 group">
      {/* Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gray-200 overflow-hidden shrink-0">
        <Image
          src={avatar || '/assets/images/common/user.png'}
          alt="avatar"
          width={36}
          height={36}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Message content */}
      <div className="flex flex-col items-start flex-1 min-w-0">
        <MessageContent
          content={content}
          attachment={attachment}
          images={images}
        />
        {/* Time */}
        <div className="flex items-center mt-1 px-1">
          <span className="text-[10px] sm:text-xs text-gray-500">{time}</span>
        </div>
      </div>
    </div>
  );
};

// Main MessageBubble component
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  receiverId,
}) => {
  const { id, isSender, content, time, status, attachment, images, avatar } =
    message;

  if (isSender) {
    return (
      <SenderMessage
        messageId={id}
        content={content}
        time={time}
        status={status}
        attachment={attachment}
        images={images}
        avatar={avatar}
        receiverId={receiverId}
      />
    );
  }

  return (
    <NonSenderMessage
      content={content}
      time={time}
      avatar={avatar}
      attachment={attachment}
      images={images}
    />
  );
};
