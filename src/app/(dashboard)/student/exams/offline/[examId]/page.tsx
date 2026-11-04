import ViewTimetablePage from './client';

export async function generateStaticParams() {
  return [
    { examId: '1' }
  ];
}

export default function Page() {
  return <ViewTimetablePage />;
}
