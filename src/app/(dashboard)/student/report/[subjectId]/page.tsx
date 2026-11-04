import ReportSubjectPage from './client';

export async function generateStaticParams() {
  return [
    { subjectId: '1' }
  ];
}

export default function Page() {
  return <ReportSubjectPage />;
}
