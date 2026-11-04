// app/components/chat/ContactItem.tsx
import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';

type ContactItemProps = {
  name: string;
  lastMessage: string;
  time: string;
  avatar: string; // Can be an image URL or initials
  unread: number;
  active: boolean;
  subject?: string;
  isSelected?: boolean;
  onClick?: () => void;
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

export const ContactItem: React.FC<ContactItemProps> = ({
  name,
  lastMessage,
  time,
  avatar,
  active,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      className={clsx(
        'flex items-center p-2 md:p-3 cursor-pointer transition-colors duration-200',
        {
          'bg-[#F2F5F7]': isSelected || active,
          'hover:bg-gray-50': !isSelected && !active,
        },
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 me-2 md:me-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-sm md:text-base overflow-hidden">
          {/* Check if avatar is URL or text/initials */}
          {isValidUrl(avatar) ? (
            // Show image if avatar is a valid URL
            <Image
              src={avatar}
              alt={name}
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            // Show initials if avatar is text or empty
            <span className="text-sm md:text-base font-bold text-gray-700">
              {avatar}
            </span>
          )}
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">
          {name}
        </h3>
        <p className="text-xs md:text-sm text-gray-500 truncate">
          {lastMessage}
        </p>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 ms-1 md:ms-2">
        <span className="text-xs text-gray-400 mb-1">{time}</span>
        {/* {unread > 0 && (
          <span className="bg-[var(--secondary-color)] text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
            {unread}
          </span>
        )} */}
      </div>
    </div>
  );
};
