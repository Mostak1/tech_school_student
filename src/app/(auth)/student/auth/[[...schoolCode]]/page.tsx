import { Suspense } from 'react';
import StudentAuthPage from './client';

export async function generateStaticParams() {
  return [
    { schoolCode: [] }
  ];
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <StudentAuthPage />
    </Suspense>
  );
}
