'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import StatsWithSession from '@/components/layout/StatsWithSession';
import { PERFORMANCE_DEMO } from '@/components/dashboard/performance-demo-data';
import MainContent from '@/components/dashboard/MainContent';
import ShimmerButton from '@/components/magicui/shimmer-button';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import Chat from '@/components/shared/Chat';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';
import { FAQ } from '@/components/shared/FAQ';
import { useSiteName } from '@/components/i18n/i18n';
import QuestionStatistics from '@/components/dashboard/question-statistics';
import QuestionStatisticsLoading from '@/components/dashboard/question-statistics-loading';
import { Suspense } from 'react';

const projects = [
  {
    title: "JEE",
    description: "The Joint Entrance Examination is an engineering entrance assessment conducted for admission to various engineering colleges in India.",
    link: "https://jeemain.nta.nic.in/",
  },
  {
    title: "CUET",
    description: "The Common University Entrance Test is conducted for admission to various undergraduate programs in central universities across India.",
    link: "https://cuet.samarth.ac.in/",
  },
  {
    title: "CBSE",
    description: "The Central Board of Secondary Education is a national level board of education in India for public and private schools, controlled and managed by the Government of India.",
    link: "https://cbse.nic.in/",
  },
  {
    title: "A levels",
    description: "Advanced Level qualifications are subject-based school leaving qualifications offered by educational bodies in the United Kingdom and the educational authorities in many Commonwealth countries.",
    link: "https://www.cambridgeinternational.org/",
  },
  {
    title: "CLAT",
    description: "The Common Law Admission Test is a centralized national level entrance test for admissions to National Law Universities in India.",
    link: "https://consortiumofnlus.ac.in/clat-2024/",
  },
  {
    title: "CAT",
    description: "The Common Admission Test is a computer-based test for admission in a graduate management program in various colleges across India.",
    link: "https://iimcat.ac.in/",
  },
];

const fadeUpVariants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export default function Page() {
  const fadeInRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(fadeInRef as React.RefObject<HTMLDivElement>, { once: true });
  const siteName = useSiteName();

  return (
    <div className="z-10 w-full px-5 xl:px-0">
      <div className="text-center px-4">
        <div className="flex flex-col items-center gap-6 pb-8 text-center">
          <AnimatedGradientText className="bg-white dark:bg-gray-500 dark:text-white text-black font-light flex items-center space-x-2">
            <span>40k questions</span>
          </AnimatedGradientText>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="container w-full mx-auto">
                <h1 className="text-3xl font-light sm:text-4xl md:text-5xl lg:text-6xl tracking-[-0.04em] drop-shadow-sm leading-tight sm:leading-[1.2] md:leading-[1.1] lg:leading-[1.1] text-center">
                  Study Smart with {siteName}
                </h1>
              </div>
              <p
                className="mt-6 animate-fade-up text-center text-gray-600 dark:text-gray-300 opacity-0 sm:text-xl"
                style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}
              >
                Thousands of practice questions, study notes, and flashcards, all in one place.
              </p>
              <div className="flex items-center justify-center mt-5">
                <p className="text-xl font-light">
                  P.S. It&apos;s free. 😊
                </p>
              </div>
              <div
                className="mx-auto mt-6 flex flex-col sm:flex-row animate-fade-up items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5 opacity-0"
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                <Link className="group flex w-full max-w-xs sm:max-w-fit items-center" href="QuestionBank/guest">
                  <ShimmerButton className="w-full min-h-11 shadow-2xl sm:w-auto">
                    <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:text-dark-background lg:text-lg">
                      Try Now
                    </span>
                  </ShimmerButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full sm:w-11/12 h-[70vh] sm:h-[800px] border-4 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden flex items-center justify-center my-8 mx-auto">
        <div className="absolute inset-0 hidden sm:block">
          <Image
            src="/imac.jpg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="blur-md opacity-50 dark:opacity-30"
          />
        </div>
        <div className="relative w-full h-full mt-auto bg-white/60 dark:bg-dark-surface/60 rounded-2xl overflow-hidden flex flex-col">
          <MainContent />
        </div>
      </div>

      <h4 className="text-center font-light text-2xl leading-tight lg:text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
        Review Your Performance
      </h4>

      <p className="text-sm mb-8 lg:text-base max-w-2xl my-4 mx-auto px-4 text-gray-600 dark:text-gray-300 text-center font-normal">
        Understand your strengths and weaknesses questions by exam, topic, sub-topic, year, difficulty, completed, or marked for review to save time.
      </p>

      <div className="flex justify-center items-center min-h-screen bg-background-image bg-border bg-cover bg-center px-2 py-10 sm:px-4">
        <div className="w-full max-w-7xl">
          <ContainerScroll titleComponent={<></>}>
            <div className="theme-desk h-full w-full overflow-auto rounded-xl bg-paper">
              <StatsWithSession demo={PERFORMANCE_DEMO} />
            </div>
          </ContainerScroll>
        </div>
      </div>

      <div className="mb-20">
        <h4 className="text-center font-light text-2xl leading-tight lg:text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-2xl sm:leading-[4rem]">
          A Plethora of Exams
        </h4>

        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <HoverEffect items={projects} />
        </div>

        <div ref={fadeInRef}>
          <motion.div
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            variants={fadeUpVariants}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
          >
          </motion.div>
        </div>

        <FAQ />

        <div className="h-full w-full sm:w-3/4 border border-gray-200 dark:border-gray-700 justify-self-center rounded-3xl bg-gray-100 dark:bg-gray-900 relative overflow-hidden mx-auto">
          {/* Gradient overlay */}
          <div className="absolute bottom-0 w-full h-[40vh] bg-gradient-to-r from-orange-400/20 via-white/10 to-blue-400/20 dark:from-orange-600/20 dark:via-gray-800/10 dark:to-blue-600/20 blur-3xl" />
        
          <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
            {/* Main content */}
            <div className="max-w-3xl mx-auto mt-12 sm:mt-24 text-center space-y-6 sm:space-y-8">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal text-gray-800 dark:text-white tracking-tight">
                Join {siteName} today{' '}
                <span className="block italic font-light">
                  save time
                </span>
              </h1>

              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                High-quality question banks, mock exams, progress tracking, and much more. 
              </p>
            
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

