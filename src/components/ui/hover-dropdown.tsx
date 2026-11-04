'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/components/lib/utils';

interface HoverDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  delay?: number; // Delay in milliseconds before showing dropdown
}

export function HoverDropdown({
  trigger,
  children,
  align = 'end',
  className,
  delay = 150,
}: HoverDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      // Small delay to ensure smooth animation
      setTimeout(() => setIsVisible(true), 10);
    }, delay);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsVisible(false);
    // Wait for animation to complete before hiding
    setTimeout(() => setIsOpen(false), 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get alignment classes
  const getAlignmentClasses = () => {
    switch (align) {
      case 'start':
        return 'left-0';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2';
      case 'end':
        return 'right-0';
      default:
        return 'right-0';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element */}
      <div className="cursor-pointer">{trigger}</div>

      {/* Dropdown content */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md',
            'transition-all duration-200 ease-in-out',
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1',
            getAlignmentClasses(),
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Dropdown item component
interface HoverDropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function HoverDropdownItem({
  children,
  onClick,
  className,
  disabled = false,
}: HoverDropdownItemProps) {
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-gray-100 focus:bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </div>
  );
}

// Dropdown separator component
export function HoverDropdownSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-gray-200", className)} />;
}

// Dropdown label component
interface HoverDropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverDropdownLabel({
  children,
  className,
}: HoverDropdownLabelProps) {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-sm font-semibold text-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
}
