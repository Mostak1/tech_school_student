'use client';
import Container from '@/components/shared/container/Container';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);

  // Hero slide data
  const heroSlides = [
    {
      id: 1,
      badge: "Where Every Child's Journey Begins",
      title: 'EMPOWERING YOUNG MINDS FOR A BRIGHTER FUTURE',
      description:
        'Empowering young minds through meaningful learning and lifelong values —from early years to graduation.',
      image: '/assets/images/hero/slide1.png',
      underline: '/assets/images/hero/underline.svg',
    },
    {
      id: 2,
      badge: 'Excellence in Education',
      title: "BUILDING TOMORROW'S LEADERS TODAY",
      description:
        'Nurturing critical thinking, creativity, and character development to prepare students for success in an ever-changing world.',
      image: '/assets/images/hero/slide1.png',
      underline: '/assets/images/hero/underline.svg',
    },
    {
      id: 3,
      badge: 'Innovation in Learning',
      title: 'INSPIRING LIFELONG LEARNING AND GROWTH',
      description:
        'Creating an environment where curiosity thrives, knowledge expands, and every student discovers their unique potential.',
      image: '/assets/images/hero/slide1.png',
      underline: '/assets/images/hero/underline.svg',
    },
  ];

  // Update current slide when carousel changes
  useEffect(() => {
    if (!api) return;

    setCurrentSlide(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  // Autoplay functionality
  useEffect(() => {
    if (!api) return;

    const autoplay = setInterval(() => {
      api.scrollNext();
    }, 10000); // 10 seconds between slides

    return () => clearInterval(autoplay);
  }, [api]);

  return (
    <section className="bg-[var(--light-primary-color)] py-8 md:py-16 relative">
      <Container>
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: 'start',
            loop: true,
            duration: 25, // Smooth transition duration
            dragFree: true, // Enables smooth momentum scrolling
          }}
        >
          <CarouselContent>
            {heroSlides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="grid grid-cols-12 gap-4 md:gap-8 items-center min-h-[400px] md:min-h-[500px]">
                  {/* Left side - Content */}
                  <div className="col-span-12 lg:col-span-6 flex flex-col justify-center space-y-3 md:space-y-4 order-2 lg:order-1 px-4 md:px-0">
                    {/* Badge */}
                    <div className="inline-block">
                      <span className="bg-[var(--tertiary-color)] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium">
                        {slide.badge}
                      </span>
                    </div>

                    {/* Main Title */}
                    <div className="space-y-4">
                      <h1 className="text-xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-black leading-tight">
                        {slide.title.split(' ').map((word, index) => (
                          <span key={index}>
                            {word === 'BRIGHTER' ? (
                              <span className="relative inline-block">
                                <span className="relative z-10">{word}</span>
                                <Image
                                  src={slide.underline}
                                  alt="underline"
                                  width={0}
                                  height={0}
                                  className="hidden md:block absolute -bottom-12 left-0 z-0 w-full h-full object-cover"
                                />
                              </span>
                            ) : (
                              word
                            )}
                            {index < slide.title.split(' ').length - 1 && ' '}
                          </span>
                        ))}
                      </h1>
                    </div>

                    {/* Description */}
                    <p className="text-base md:text-lg lg:text-xl font-normal text-gray-700 leading-relaxed max-w-2xl">
                      {slide.description}
                    </p>
                  </div>

                  {/* Right side - Image */}
                  <div className="col-span-12 lg:col-span-6 relative order-1 lg:order-2 px-4 md:px-0">
                    <div className="relative">
                      {/* Main image */}
                      <div className="relative z-10">
                        <Image
                          src={slide.image}
                          alt="Hero Image"
                          width={0}
                          height={0}
                          className="w-full h-[300px] sm:h-[400px] md:h-[650px] object-contain"
                          priority
                        />
                      </div>

                      {/* Decorative elements */}
                      <div className="absolute top-4 right-4 md:top-10 md:right-10">
                        <div className="w-4 h-4 md:w-8 md:h-8 bg-[var(--secondary-color)] rounded-full opacity-60"></div>
                      </div>
                      <div className="absolute bottom-10 left-4 md:bottom-20 md:left-10">
                        <div className="w-3 h-3 md:w-6 md:h-6 bg-[var(--tertiary-color)] rounded-full opacity-60"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-6 md:mt-8 space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? 'w-[40px] bg-[var(--secondary-color)]'
                  : 'w-3 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Container>

      {/* Custom Navigation Buttons - Outside Container */}
      <button
        onClick={() => api?.scrollPrev()}
        className="hidden lg:flex absolute left-16 top-1/2 cursor-pointer -translate-y-1/2 bg-[var(--secondary-color)]  border-0  z-10 w-10 h-10 rounded-[4px]  items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4 text-white" />
      </button>
      <button
        onClick={() => api?.scrollNext()}
        className="hidden lg:flex absolute right-16 top-1/2 cursor-pointer -translate-y-1/2 bg-[var(--secondary-color)] border-0  z-10 w-10 h-10 rounded-[4px] items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4 text-white" />
      </button>
    </section>
  );
}
