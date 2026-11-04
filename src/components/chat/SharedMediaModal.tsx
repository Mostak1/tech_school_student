'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BiX } from 'react-icons/bi';

// Props interface for the SharedMediaModal component
interface SharedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
}

// SharedMediaModal component for displaying shared media in a modal
export const SharedMediaModal: React.FC<SharedMediaModalProps> = ({
  isOpen,
  onClose,
  images,
}) => {
  // State for managing image pagination
  const [visibleImagesCount, setVisibleImagesCount] = useState(6);

  // Calculate how many images to show (minimum 6, or all if less than 6)
  const imagesToShow = Math.min(visibleImagesCount, images.length);
  const hasMoreImages = images.length > visibleImagesCount;
  const handleDownload = async (imageSrc: string, index: number) => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = imageSrc.split('.').pop()?.split('?')[0] || 'jpg';
      link.download = `shared-media-${index + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageSrc, '_blank');
    }
  };

  // Handle loading more images
  const handleLoadMore = () => {
    setVisibleImagesCount((prev) => Math.min(prev + 6, images.length));
  };

  // Reset visible images count when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setVisibleImagesCount(6);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!max-h-[700px] overflow-y-auto p-0 w-[95vw] md:w-[650px] max-w-[95vw] md:max-w-[650px] min-w-[95vw] md:min-w-[650px]"
        showCloseButton={false}
      >
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-200 p-3 md:p-6">
          <DialogTitle className="text-lg md:text-xl font-bold text-gray-800">
            Shared Media
          </DialogTitle>
          <DialogClose>
            <BiX className="w-6 h-6 md:w-8 md:h-8 cursor-pointer text-gray-400 bg-[var(--light-primary-color)] border border-gray-200 rounded-[4px] p-1 flex-shrink-0" />
          </DialogClose>
        </DialogHeader>

        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mt-4 p-3 md:px-6">
          {images.slice(0, imagesToShow).map((imageSrc, index) => (
            <div key={index} className="relative group">
              {/* Image Container */}
              <div className="relative w-full h-32 md:h-48 rounded-lg overflow-hidden bg-white border border-gray-200">
                <Image
                  src={imageSrc}
                  alt={`Shared media ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index < 6} // Prioritize first 6 images for better performance
                />

                {/* Download Button - appears on hover */}
                <button
                  onClick={() => handleDownload(imageSrc, index)}
                  className="absolute top-1 end-1 md:top-2 md:end-2 bg-[var(--secondary-color)] text-white p-1.5 md:p-2 rounded-[4px] transition-opacity duration-200"
                  aria-label={`Download image ${index + 1}`}
                >
                  <Download size={14} className="md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 mb-4 md:mb-6">
          {/* Load More Button - only show if there are more images */}
          {hasMoreImages && (
            <button
              onClick={handleLoadMore}
              className="bg-(--primary-color) text-white px-4 md:px-6 py-2 md:py-3 rounded-[4px] font-medium transition-colors duration-200 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Load More Images
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
