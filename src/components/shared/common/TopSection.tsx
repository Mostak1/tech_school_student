'use client';
import { cn } from '@/components/lib/utils';
import React from 'react';
import Title from './Title';

export default function TopSection({
  title,
  description,
  tag,
  tagClassName,
  tagBgColor,
  tagTextColor,
  tagDotColor,
}: {
  title: string;
  description: string;
  tag: string;
  tagClassName?: string;
  tagBgColor?: string;
  tagTextColor?: string;
  tagDotColor?: string;
}) {
  return (
    <div className="text-center mb-12">
      {/* Educational Programs tag */}
      <Title
        title={tag}
        bgColor={tagBgColor}
        textColor={tagTextColor}
        dotColor={tagDotColor}
        className={cn(
          'flex justify-center items-center w-fit mx-auto',
          tagClassName
        )}
      />

      {/* Main heading */}
      <h2 className="md:text-4xl text-2xl font-bold text-black my-4 max-w-md mx-auto">
        {title}
      </h2>

      {/* Description */}
      <p className="text-base font-normal text-gray-600 max-w-lg mx-auto">
        {description}
      </p>
    </div>
  );
}
