'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { type Slider } from '@/lib/api/student/functions';
import { useGetSliders } from '@/lib/api/student/queryHooks';
import { useTranslate } from '@/components/hooks/useTranslate';
import { RootState } from '@/components/store';

export default function MyProfileBanner() {
  const translate = useTranslate();
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const isRtl = currentLanguage === 'ar';
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  const { data: response, isLoading: loading } = useGetSliders();
  const sliders: Slider[] = response?.data || [];

  // Update current slide when carousel changes
  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);



  // Handle pagination dot click
  const scrollTo = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="rounded-[4px] mb-6 relative overflow-hidden">
        <div className="w-full aspect-[2/1] md:aspect-[3/1] lg:aspect-auto lg:h-[400px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-gray-500">{translate('loadingBanner')}</div>
        </div>
      </div>
    );
  }

  // Show message when no sliders are available
  if (!loading && sliders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[4px] mb-6 relative overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: true,
          direction: isRtl ? 'rtl' : 'ltr',
        }}
        plugins={[
          Autoplay({
            delay: 4000, // Auto-slide every 4 seconds
            stopOnInteraction: false, // Continue autoplay after user interaction
            stopOnMouseEnter: true, // Pause autoplay when hovering over carousel
            stopOnFocusIn: true, // Pause autoplay when focusing on carousel
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {sliders.map((slider) => (
            <CarouselItem key={slider.id}>
              <div className="relative w-full aspect-[2/1] md:aspect-[3/1] lg:aspect-auto lg:h-[400px]">
                {slider.link ? (
                  <a
                    href={slider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <Image
                      src={slider.image}
                      alt={`Banner Image ${slider.id}`}
                      fill
                      className="object-cover rounded-lg hover:opacity-90 transition-opacity"
                      priority={slider.id === sliders[0]?.id}
                    />
                  </a>
                ) : (
                  <Image
                    src={slider.image}
                    alt={`Banner Image ${slider.id}`}
                    fill
                    className="object-cover rounded-lg"
                    priority={slider.id === sliders[0]?.id}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Interactive Pagination Dots */}
      <div className="flex justify-center space-x-2 my-8">
        {sliders.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${current === index
              ? 'bg-[var(--secondary-color)] scale-110 w-[40px]'
              : 'bg-gray-200 hover:bg-[var(--secondary-color)]'
              }`}
            aria-label={`${translate('goToSlide')} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
