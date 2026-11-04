/**
 * Tooltip Component
 *
 * A reusable tooltip component that displays additional information on hover.
 * Uses CSS and Tailwind for styling with a clean, modern appearance.
 *
 * Features:
 * - Appears on hover
 * - Positioned above the trigger element
 * - Dark background with white text
 * - Includes arrow pointing to trigger
 * - Supports text wrapping for long content
 * - Fully accessible with keyboard support
 */

import React, { useState } from 'react';

interface TooltipProps {
  /**
   * The content to display in the tooltip
   * Can be a string or React element
   */
  content: string | React.ReactNode;

  /**
   * The element that triggers the tooltip (usually text or button)
   */
  children: React.ReactNode;

  /**
   * Optional: Position of the tooltip relative to the trigger
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Optional: Additional CSS classes for the trigger container
   */
  className?: string;

  /**
   * Optional: Custom width for the tooltip
   * @default 'min-w-[200px] max-w-[280px]'
   */
  width?: string;
}

/**
 * Tooltip Component
 *
 * Usage example:
 * ```tsx
 * <Tooltip content="This is helpful information">
 *   <span>Hover over me</span>
 * </Tooltip>
 * ```
 */
export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  width = 'min-w-[200px] max-w-[280px]',
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Position classes based on tooltip position prop
  // Using logical properties (start/end) for RTL support
  // start = left in LTR, right in RTL
  // end = right in LTR, left in RTL
  const positionClasses = {
    top: 'bottom-full mb-2 start-0',
    bottom: 'top-full mt-2 start-0',
    left: 'end-full me-2 top-0', // Changed: right-full -> end-full, mr-2 -> me-2
    right: 'start-full ms-2 top-0', // Changed: left-full -> start-full, ml-2 -> ms-2
  };

  // Arrow classes based on position
  // Using logical properties for RTL support
  const arrowClasses = {
    top: 'start-4 top-full border-s-4 border-e-4 border-t-4 border-s-transparent border-e-transparent border-t-gray-900',
    bottom:
      'start-4 bottom-full border-s-4 border-e-4 border-b-4 border-s-transparent border-e-transparent border-b-gray-900',
    left: 'top-4 start-full border-t-4 border-b-4 border-s-4 border-t-transparent border-b-transparent border-s-gray-900',
    right:
      'top-4 end-full border-t-4 border-b-4 border-e-4 border-t-transparent border-b-transparent border-e-gray-900',
  };

  return (
    <div
      className={`relative group inline-block ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger element */}
      {children}

      {/* Tooltip */}
      <div
        className={`absolute ${positionClasses[position]} ${
          isOpen ? 'block' : 'hidden group-hover:block'
        } z-50 ${width}`}
      >
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-normal wrap-break-word leading-relaxed">
          {content}
        </div>

        {/* Arrow */}
        <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}></div>
      </div>
    </div>
  );
}
