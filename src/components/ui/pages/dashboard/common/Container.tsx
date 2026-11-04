'use client';
import React from 'react';
import { cn } from '@/components/lib/utils';

export default function Container({
  children,
  className,
  collapsed = false,
}: {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <div
      className={cn(
        'mx-auto max-w-full',
        // Add more space when sidebar is collapsed
        collapsed ? '' : '',
        className
      )}
    >
      {children}
    </div>
  );
}
