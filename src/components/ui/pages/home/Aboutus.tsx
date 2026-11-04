'use client';
import React from 'react';
import Image from 'next/image';
import Container from '@/components/shared/container/Container';
import Title from '@/components/shared/common/Title';

export default function Aboutus() {
  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Images */}
          <div className="relative">
            {/* Main large image */}
            <div className="relative w-full h-full">
              <Image
                src="/assets/images/aboutus/aboutus.png"
                alt="Students studying and collaborating"
                width={0}
                height={0}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            {/* About Us tag */}

            <Title
              title="About Us"
              bgColor="#E6ECF0"
              textColor="var(--primary-color)"
              dotColor="var(--primary-color)"
            />

            {/* Main heading */}
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
              Inspiring Young Minds, Building Bright Futures
            </h2>

            {/* Content paragraphs */}
            <div className="space-y-4 text-base font-normal text-gray-700 leading-relaxed">
              <p>
                At our school, education goes beyond the classroom. We believe
                in nurturing every child&apos;s potential through a balanced
                blend of academics, creativity, and character-building. Our
                dedicated educators foster a supportive and inclusive
                environment where students feel empowered to explore, learn, and
                grow every day.
              </p>

              <p>
                With modern facilities, innovative teaching methods, and a focus
                on holistic development, we aim to shape confident individuals
                who are ready to take on tomorrow&apos;s challenges with
                curiosity and compassion.
              </p>

              <p>
                Whether it&apos;s academics, sports, arts, or leadership, we
                provide opportunities that help students discover their passions
                and realize their fullest potential.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
