import React from 'react';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterSelectProps {
  label: string;
  value: string;
  onValueChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minWidth?: string;
  children: React.ReactNode;
}

export function FilterSelect({
  label,
  value,
  onValueChange,
  disabled,
  placeholder,
  minWidth = 'min-w-30',
  children,
}: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-sm sm:text-base font-normal text-gray-700 whitespace-nowrap">
        {label}
      </span>
      <div className={`flex items-center bg-white rounded-[6px] border border-gray-300 px-3 h-9 sm:h-10 md:h-11 shrink-0 ${minWidth}`}>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger className="w-full border-none shadow-none focus:ring-0 p-0 h-auto gap-2 [&>span]:text-start">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
