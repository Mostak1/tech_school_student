'use client';
import { useState } from 'react';
import Container from '@/components/shared/container/Container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  BiMap,
  BiPhoneCall,
  BiEnvelope,
  BiGlobe,
  BiChevronDown,
} from 'react-icons/bi';

export default function TopHeader() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  return (
    <section className="hidden xl:block pbg py-2">
      <Container>
        <div className="flex items-center justify-between text-white text-sm">
          {/* Left side - Contact information */}
          <div className="flex items-center space-x-6">
            {/* Address with map pin icon */}
            <div className="flex items-center space-x-2">
              <BiMap className="w-6 h-6" />
              <span className="text-sm font-normal">
                {process.env.NEXT_PUBLIC_ADDRESS}
              </span>
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-white/40"></div>

            {/* Phone with phone icon */}
            <div className="flex items-center space-x-2">
              <BiPhoneCall className="w-6 h-6" />
              <Link
                href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}
                className="text-sm font-normal"
              >
                <span className="text-sm font-normal">
                  {process.env.NEXT_PUBLIC_PHONE}
                </span>
              </Link>
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-white/40"></div>

            {/* Email with envelope icon */}
            <div className="flex items-center space-x-2">
              <BiEnvelope className="w-6 h-6" />
              <Link
                href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}
                className="text-sm font-normal"
              >
                <span className="text-sm font-normal">
                  {process.env.NEXT_PUBLIC_EMAIL}
                </span>
              </Link>
            </div>
          </div>

          {/* Right side - Language dropdown */}
          <div className="flex items-center">
            <DropdownMenu
              open={isLanguageDropdownOpen}
              onOpenChange={setIsLanguageDropdownOpen}
            >
              <DropdownMenuTrigger
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                onMouseEnter={() => setIsLanguageDropdownOpen(true)}
                onMouseLeave={() => setIsLanguageDropdownOpen(false)}
              >
                <BiGlobe className="w-6 h-6" />
                <span>English</span>
                <BiChevronDown className="w-6 h-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white border border-gray-200 shadow-lg"
                onMouseEnter={() => setIsLanguageDropdownOpen(true)}
                onMouseLeave={() => setIsLanguageDropdownOpen(false)}
              >
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  English
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  Spanish
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  French
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  German
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </section>
  );
}
