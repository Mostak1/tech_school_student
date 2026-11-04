'use client';
import TopSection from '@/components/shared/common/TopSection';
import Container from '@/components/shared/container/Container';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Image from 'next/image';
import React from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';

// Educational program data structure
const educationalPrograms = [
  {
    id: 1,
    title: 'Pre-Primary / Kindergarten',
    description:
      'A playful and nurturing start that builds curiosity, confidence, and essential early skills.',
    image: '/assets/images/eduProgram/ep1.png',
    alt: 'Young children playing with building blocks',
  },
  {
    id: 2,
    title: 'Primary Years',
    description:
      'Strong academic foundations with a focus on creativity, curiosity, and joyful learning.',
    image: '/assets/images/eduProgram/ep2.png',
    alt: 'Elementary school children with books',
  },
  {
    id: 3,
    title: 'Middle School',
    description:
      'Encouraging independent thinking, collaboration, and deeper subject exploration.',
    image: '/assets/images/eduProgram/ep3.png',
    alt: 'Middle school students in school hallway',
  },
  {
    id: 4,
    title: 'High School',
    description:
      'Preparing students for college, careers, and life with focus, growth, and leadership.',
    image: '/assets/images/eduProgram/ep4.png',
    alt: 'High school students walking on campus',
  },
  {
    id: 5,
    title: 'High School',
    description:
      'Preparing students for college, careers, and life with focus, growth, and leadership.',
    image: '/assets/images/eduProgram/ep4.png',
    alt: 'High school students walking on campus',
  },
  {
    id: 6,
    title: 'High School',
    description:
      'Preparing students for college, careers, and life with focus, growth, and leadership.',
    image: '/assets/images/eduProgram/ep4.png',
    alt: 'High school students walking on campus',
  },
  {
    id: 7,
    title: 'High School',
    description:
      'Preparing students for college, careers, and life with focus, growth, and leadership.',
    image: '/assets/images/eduProgram/ep4.png',
    alt: 'High school students walking on campus',
  },
  {
    id: 8,
    title: 'High School',
    description:
      'Preparing students for college, careers, and life with focus, growth, and leadership.',
    image: '/assets/images/eduProgram/ep4.png',
    alt: 'High school students walking on campus',
  },
];

export default function EduProgram() {
  // State to manage carousel API and navigation
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  // Update navigation state when carousel changes
  React.useEffect(() => {
    if (!api) return;

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });
  }, [api]);

  // Navigation functions
  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  return (
    <section className="py-16 bg-gray-100">
      <Container>
        <TopSection
          title="Learning That Grows With Every Stage"
          description="Our educational programs are built to guide students through every phase — nurturing curiosity, confidence, and a love for learning."
          tag="Educational Programs"
          tagBgColor="#E6ECF0"
          tagTextColor="var(--primary-color)"
          tagDotColor="var(--primary-color)"
        />

        {/* Carousel container */}
        <div className="relative">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
            setApi={setApi}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {educationalPrograms.map((program) => (
                <CarouselItem
                  key={program.id}
                  className="pl-2 basis-[83.33%] md:pl-4 md:basis-1/2 lg:basis-1/4"
                >
                  <div className="bg-white rounded-[12px] p-4 h-full text-center">
                    {/* Program image */}
                    <div className="relative w-full h-48 mb-4 rounded-[12px] overflow-hidden">
                      <Image
                        src={program.image}
                        alt={program.alt}
                        width={0}
                        height={0}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Program title */}
                    <h3 className="text-xl font-bold text-black mb-3">
                      {program.title}
                    </h3>

                    {/* Program description */}
                    <p className="text-gray-600 text-sm font-normal leading-relaxed">
                      {program.description}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Custom Navigation buttons with BiChevron icons */}
            <div className="flex justify-center gap-2 mt-12">
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="cursor-pointer relative left-0 top-0 translate-y-0 bg-(--primary-color) hover:bg-black hover:text-white hover:scale-110 text-white border-0 rounded-[4px] w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Previous slide"
              >
                <BiChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="cursor-pointer relative right-0 top-0 translate-y-0 bg-(--primary-color) hover:bg-black hover:text-white hover:scale-110 text-white border-0 rounded-[4px] w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Next slide"
              >
                <BiChevronRight size={20} />
              </button>
            </div>
          </Carousel>
        </div>
      </Container>
    </section>
  );
}
