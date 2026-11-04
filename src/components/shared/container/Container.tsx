'use client';
import { cn } from '@/components/lib/utils';
import React from 'react';

export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('container mx-auto px-4', className)}>{children}</div>;
}
