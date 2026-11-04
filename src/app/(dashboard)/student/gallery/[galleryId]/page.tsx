import GalleryDetails from './client';

export async function generateStaticParams() {
  return [
    { galleryId: '1' }
  ];
}

export default function Page() {
  return <GalleryDetails />;
}
