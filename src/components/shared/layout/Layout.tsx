'use client';
import React from 'react';
import TopHeader from '@/components/ui/pages/common/TopHeader';
import Header from '@/components/ui/pages/common/Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopHeader />
      <Header />
      {children}
    </>
  );
}
