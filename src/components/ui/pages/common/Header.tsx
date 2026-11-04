'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BiChevronDown, BiMenu, BiChevronRight, BiX } from 'react-icons/bi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import Container from '@/components/shared/container/Container';
import Image from 'next/image';

import { useSystemBranding } from '@/lib/api/student/queryHooks';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileLanguageDropdownOpen, setIsMobileLanguageDropdownOpen] =
    useState(false);
  const [isMobileProfileDropdownOpen, setIsMobileProfileDropdownOpen] =
    useState(false);
  const pathname = usePathname();
  const { data: systemBranding } = useSystemBranding();
  const logoUrl =
    systemBranding?.data?.horizontal_logo || '/assets/images/common/logo.png';

  // Helper function to check if a route is active
  const isActiveRoute = (href: string) => {
    // Handle home route specifically
    if (href === '/' && pathname === '/') {
      return true;
    }
    // For other routes, check if pathname starts with the href
    if (href !== '/' && pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  return (
    <header className="bg-white">
      <Container>
        <div className="grid grid-cols-12 items-center py-6 ">
          {/* Logo Section - Left side (original position) */}
          <div className="flex items-center col-span-8 xl:col-span-2">
            {/* Logo Graphic */}
            <Image
              src={logoUrl}
              alt="Logo"
              width={0}
              height={0}
              className="w-[180px] h-[60px] object-contain"
              priority
            />
          </div>

          {/* Navigation Links - Center (original position) */}
          <nav className="hidden xl:flex items-center justify-center col-span-8 gap-2">
            <Link
              href="/"
              className={`tpc hover:bg-[var(--secondary-color)] hover:text-white hover:rounded-md px-4 py-2 text-base font-normal transition-colors ${
                isActiveRoute('/')
                  ? 'bg-[var(--secondary-color)] text-white rounded-md'
                  : ''
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`tpc hover:bg-[var(--secondary-color)] hover:text-white hover:rounded-md px-4 py-2 text-base font-normal transition-colors ${
                isActiveRoute('/about')
                  ? 'bg-[var(--secondary-color)] text-white rounded-md'
                  : ''
              }`}
            >
              About Us
            </Link>
            <Link
              href="/gallery"
              className={`tpc hover:bg-[var(--secondary-color)] hover:text-white hover:rounded-md px-4 py-2 text-base font-normal transition-colors ${
                isActiveRoute('/gallery')
                  ? 'bg-[var(--secondary-color)] text-white rounded-md'
                  : ''
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/faqs"
              className={`tpc hover:bg-[var(--secondary-color)] hover:text-white hover:rounded-md px-4 py-2 text-base font-normal transition-colors ${
                isActiveRoute('/faqs')
                  ? 'bg-[var(--secondary-color)] text-white rounded-md'
                  : ''
              }`}
            >
              FAQs
            </Link>
            <Link
              href="/contact"
              className={`tpc hover:bg-[var(--secondary-color)] hover:text-white hover:rounded-md px-4 py-2 text-base font-normal transition-colors ${
                isActiveRoute('/contact')
                  ? 'bg-[var(--secondary-color)] text-white rounded-md'
                  : ''
              }`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Mobile Menu Button - Only visible on mobile, moved to right side */}
          <div className="xl:hidden flex justify-end col-span-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
                  {/* outside part is line border square */}
                  <div className="w-12 h-12 border-2 border-[#EAEAEA] rounded-md flex items-center justify-center">
                    <BiMenu className="w-6 h-6" />
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[320px] sm:w-[400px] p-0 [&>button]:hidden"
              >
                {/* Accessibility: Hidden title for screen readers */}
                <SheetTitle className="sr-only">
                  Mobile Navigation Menu
                </SheetTitle>
                <div className="flex flex-col h-full bg-white">
                  {/* Header with Logo and Custom Close Button */}
                  <div className="flex items-center justify-between px-6 py-4">
                    {/* Logo Section */}
                    <div className="flex items-center">
                      <Image
                        src={logoUrl}
                        alt="eSchool SAAS VERSION Logo"
                        width={0}
                        height={0}
                        className="w-[125px] h-[45px] object-contain"
                        priority
                      />
                    </div>

                    {/* Custom Close Button with Styling */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-[4px] bg-[var(--light-primary-color)] hover:bg-[#EAEAEA] border-2 border-[#EAEAEA] transition-all duration-200 "
                    >
                      <BiX className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Navigation Links */}
                    <div className="px-6 pt-4">
                      <nav className="space-y-0">
                        {/* Home Link */}
                        <Link
                          href="/"
                          className={`flex items-center justify-between py-4 border-b border-[#EAEAEA] text-base font-normal hover:text-[var(--primary-color)] transition-colors ${
                            isActiveRoute('/')
                              ? 'text-[var(--primary-color)]'
                              : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-base font-normal">Home</span>
                          <BiChevronRight className="w-4 h-4" />
                        </Link>

                        {/* About Us Link */}
                        <Link
                          href="/about"
                          className={`flex items-center justify-between py-4 border-b border-[#EAEAEA] text-base font-normal hover:text-[var(--primary-color)] transition-colors ${
                            isActiveRoute('/about')
                              ? 'text-[var(--primary-color)]'
                              : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-base font-normal">
                            About Us
                          </span>
                          <BiChevronRight className="w-4 h-4" />
                        </Link>

                        {/* Gallery Link */}
                        <Link
                          href="/gallery"
                          className={`flex items-center justify-between py-4 border-b border-[#EAEAEA] text-base font-normal hover:text-[var(--primary-color)] transition-colors ${
                            isActiveRoute('/gallery')
                              ? 'text-[var(--primary-color)]'
                              : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-base font-normal">Gallery</span>
                          <BiChevronRight className="w-4 h-4" />
                        </Link>

                        {/* FAQs Link */}
                        <Link
                          href="/faqs"
                          className={`flex items-center justify-between py-4 border-b border-[#EAEAEA] text-base font-normal hover:text-[var(--primary-color)] transition-colors ${
                            isActiveRoute('/faqs')
                              ? 'text-[var(--primary-color)]'
                              : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-base font-normal">FAQs</span>
                          <BiChevronRight className="w-4 h-4" />
                        </Link>

                        {/* Contact Us Link */}
                        <Link
                          href="/contact"
                          className={`flex items-center justify-between py-4 border-b border-[#EAEAEA] text-base font-normal hover:text-[var(--primary-color)] transition-colors ${
                            isActiveRoute('/contact')
                              ? 'text-[var(--primary-color)]'
                              : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-base font-normal">
                            Contact Us
                          </span>
                          <BiChevronRight className="w-4 h-4" />
                        </Link>
                      </nav>
                    </div>

                    {/* Language Selector */}
                    <div className="px-6 pt-2">
                      <DropdownMenu
                        open={isMobileLanguageDropdownOpen}
                        onOpenChange={setIsMobileLanguageDropdownOpen}
                      >
                        <DropdownMenuTrigger className="flex items-center justify-between w-full py-3 text-base font-normal hover:text-[var(--primary-color)] transition-colors">
                          <div className="flex items-center space-x-2">
                            {/* <BiGlobe className="w-4 h-4" /> */}
                            <span className="text-base font-normal">
                              English
                            </span>
                          </div>
                          <BiChevronDown className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full min-w-[200px] bg-white border border-[#EAEAEA] shadow-lg rounded-lg">
                          <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2">
                            English
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2">
                            Spanish
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2">
                            French
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2">
                            German
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* User Profile Section */}
                    <div className="px-6 py-4 border-t border-[#EAEAEA]">
                      <DropdownMenu
                        open={isMobileProfileDropdownOpen}
                        onOpenChange={setIsMobileProfileDropdownOpen}
                      >
                        <DropdownMenuTrigger
                          className="flex items-center justify-between border-1 border-[var(--primary-color)] px-4 py-2 rounded-[8px] transition-colors w-full"
                          onMouseEnter={() =>
                            setIsMobileProfileDropdownOpen(true)
                          }
                          onMouseLeave={() =>
                            setIsMobileProfileDropdownOpen(false)
                          }
                        >
                          {/* Left side - Avatar and name */}
                          <div className="flex items-center space-x-3">
                            {/* Avatar placeholder */}
                            <div className="flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full border border-[var(--primary-color)] flex items-center justify-center">
                                <div className="w-9 h-9 bg-[#EAEAEA] rounded-full border border-[var(--primary-color)]"></div>
                              </div>
                            </div>

                            {/* User name */}
                            <span className="text-[var(--primary-color)] font-medium">
                              WRTeam
                            </span>
                          </div>

                          {/* Right side - Dropdown arrow */}
                          <BiChevronDown className="w-4 h-4 text-[var(--primary-color)]" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          className="!min-w-[200px] bg-white border border-[#EAEAEA] shadow-lg rounded-lg"
                          align="center"
                          onMouseEnter={() =>
                            setIsMobileProfileDropdownOpen(true)
                          }
                          onMouseLeave={() =>
                            setIsMobileProfileDropdownOpen(false)
                          }
                        >
                          <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2">
                            Home
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2 text-red-600">
                            Log Out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* User Profile Section - Right side (original position) - Hidden on mobile */}
          <div className="hidden xl:flex items-center justify-end col-span-2">
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger
                className="flex items-center space-x-3 border-1 border-[var(--primary-color)] px-4 py-2 rounded-[8px] transition-colors"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {/* Avatar placeholder */}
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-[var(--primary-color)] flex items-center justify-center">
                    <div className="w-9 h-9 bg-[#EAEAEA] rounded-full border border-[var(--primary-color)]"></div>
                  </div>
                </div>

                {/* User name */}
                <span className="text-[var(--primary-color)] font-medium">
                  WRTeam
                </span>

                {/* Dropdown arrow */}
                <BiChevronDown className="w-4 h-4 text-[var(--primary-color)]" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-48 bg-white border border-[#EAEAEA] shadow-lg rounded-lg"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2">
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-4 py-2 text-red-600">
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </header>
  );
}
