'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Tab item interface
interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

// Custom Tabs Props
interface CustomTabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  isActiveClassName?: string;
  buttonClassName?: string;
}

/**
 * Custom Tabs Component
 *
 * A modern tab component with dark slate background, icons, and border indicators
 * Features clean styling with hover effects and disabled state handling
 */
export function CustomTabs({
  items,
  activeTab,
  onTabChange,
  className,
  isActiveClassName = '',
  buttonClassName = '',
}: CustomTabsProps) {
  return (
    <div className={cn('w-full bg-slate-800', className)}>
      {/* Tab Navigation */}
      <nav className="flex gap-4">
        {items.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onTabChange(item.id)}
              disabled={item.disabled}
              className={cn(
                `${'flex items-left justify-left text-left gap-2 px-6 py-4 text-base font-normal transition-colors duration-200'} ${buttonClassName}`,
                isActive
                  ? `${'text-black bg-slate-700 border-b-2 border-black font-medium'} ${isActiveClassName}`
                  : item.disabled
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-black'
              )}
            >
              {/* Icon */}
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}

              {/* Label */}
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Tab Content Props
interface TabContentProps {
  value: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

/**
 * Tab Content Component
 *
 * Wraps content for each tab with conditional rendering
 */
export function TabContent({
  value,
  activeTab,
  children,
  className,
}: TabContentProps) {
  if (value !== activeTab) return null;

  return <div className={cn('mt-4', className)}>{children}</div>;
}
