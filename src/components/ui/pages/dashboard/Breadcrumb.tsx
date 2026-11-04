'use client';

import React from 'react';
import Link from 'next/link';
import { BiChevronRight } from 'react-icons/bi';
import { useSelector } from 'react-redux';
import { RootState } from '@/components/store';

// Define the structure for breadcrumb items
interface BreadcrumbItem {
  label: string;
  href?: string; // Optional href for clickable items
  icon?: React.ReactNode; // Optional icon for the item
}

// Props for the Breadcrumb component
interface BreadcrumbProps {
  title: string; // Main title on the left
  items: BreadcrumbItem[]; // Navigation items on the right
  className?: string; // Custom styling
}

/**
 * Simple Breadcrumb Component
 *
 * Layout: Title on left, navigation on right
 * No icons, clean text-based design
 * Matches the provided design pattern
 */
export default function Breadcrumb({
  title,
  items,
  className = '',
}: BreadcrumbProps) {
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const isRtl = currentLanguage === 'ar';

  return (
    <div
      className={`flex flex-wrap sm:items-center justify-between mb-6 gap-2 sm:gap-0 ${className}`}
    >
      {/* Left side - Title */}
      <h1 className="text-xl font-medium text-gray-900">{title}</h1>

      {/* Right side - Navigation */}
      <nav
        className="flex items-center gap-x-1 sm:gap-x-2 text-sm sm:text-base font-normal flex-wrap"
        aria-label="Breadcrumb"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              {item.href && !isLast ? (
                // Clickable navigation item with icon
                <Link
                  href={item.href}
                  className="flex items-center gap-x-1 text-gray-500"
                >
                  {item.icon && (
                    <span className="flex items-center">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                // Current page (non-clickable) with icon
                <span className="flex items-center gap-x-1 text-gray-500">
                  {item.icon && (
                    <span className="flex items-center">{item.icon}</span>
                  )}
                  <span className="text-[var(--primary-color)] text-base font-normal">
                    {item.label}
                  </span>
                </span>
              )}

              {/* Simple separator */}
              {!isLast && (
                <span className="text-gray-800">
                  <BiChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}

// Export the types for use in other components
export type { BreadcrumbItem, BreadcrumbProps };
