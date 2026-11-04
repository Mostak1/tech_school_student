import StudentNotFound from './client';

export function generateStaticParams() {
  return [
    { not_found: ['page-not-found'] }
  ];
}

export default function Page() {
  return <StudentNotFound />;
}
