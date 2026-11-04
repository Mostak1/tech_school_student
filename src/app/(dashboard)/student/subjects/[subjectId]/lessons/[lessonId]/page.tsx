import TopicPage from './client';

export async function generateStaticParams() {
  return [
    { subjectId: '1', lessonId: '1' }
  ];
}

export default function Page() {
  return <TopicPage />;
}
