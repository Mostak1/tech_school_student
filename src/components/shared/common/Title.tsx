'use client';
import React from 'react';
import { cn } from '@/components/lib/utils';

export default function Title({
  title,
  className,
  bgColor,
  textColor,
  dotColor,
}: {
  title: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
  dotColor?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-normal',
        className
      )}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div
        className={cn('w-2 h-2 rounded-full')}
        style={{ backgroundColor: dotColor }}
      ></div>
      {title}
      <div
        className={cn('w-2 h-2 rounded-full')}
        style={{ backgroundColor: dotColor }}
      ></div>
    </div>
  );
}
