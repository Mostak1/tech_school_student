import SubjectDetailsPage from './client';

export async function generateStaticParams() {
  return [
    { subjectId: '1' }
  ];
}

export default function Page() {
  return <SubjectDetailsPage />;
}
