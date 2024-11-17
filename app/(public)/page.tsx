'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import Dashboard from '@/components/home/DashboardContent';
import NoteApp from '@/components/shared/NoteApp';
import MainContent from '@/components/home/MainContent';
import ShinyButton from '@/components/magicui/shiny-button';
import ShimmerButton from '@/components/magicui/shimmer-button';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import Chat from '@/components/shared/Chat';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';
import Ripple from '../components/magicui/ripple';
import { SmileIcon } from 'lucide-react';

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

  return (
    <div className="z-10 w-full px-5 xl:px-0">
      <div className="text-center px-4">
        <div className="flex flex-col items-center gap-6 pb-8 text-center">
          <Ripple className="hidden sm:block -z-50 bottom-20" />
          <AnimatedGradientText className="bg-white text-black font-light flex items-center space-x-2">
            <span>Now enhanced by ChatGPT 4o</span>
          </AnimatedGradientText>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="container w-full mx-auto">
                <h1 className="text-3xl font-light sm:text-4xl md:text-5xl lg:text-6xl tracking-[-0.04em] drop-shadow-sm leading-tight sm:leading-[1.2] md:leading-[1.1] lg:leading-[1.1] text-center">
                  Study Smart with Aspirants
                </h1>
              </div>
              <p
                className="mt-6 animate-fade-up text-center text-gray-500 opacity-0 sm:text-xl"
                style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}
              >
                Thousands of practice questions, study notes, and flashcards, all in one place.
              </p>
              <div className="flex items-center justify-center mt-5">
      <p className="text-xl font-light">
        PS: It's free. 😊
      </p>
    </div>
              <div
                className="mx-auto mt-6 flex flex-col sm:flex-row animate-fade-up items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5 opacity-0"
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                <Link className="group flex max-w-fit items-center" href="QuestionBank">
                  <ShimmerButton className="shadow-2xl">
                    <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                      Try Now
                    </span>
                  </ShimmerButton>
                </Link>
                <Link className="flex items-center justify-center space-x-2" href="BrowseResources">
                  <ShinyButton text="Browse Resources" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-11/12 h-[800px] border-4 rounded-2xl overflow-hidden flex items-center justify-center my-8 mx-auto">
        <div className="absolute inset-0 hidden sm:block">
          <Image
            src="/imac.jpg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="blur-md"
          />
        </div>
        <div className="relative w-full h-full mt-auto bg-white bg-opacity-60 rounded-2xl overflow-hidden flex flex-col">
          <MainContent />
        </div>
      </div>

      <h4 className="text-center font-light lg:text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
        Review Your Performance
      </h4>

      <p className="text-sm mb-8 lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal">
        Understand your strengths and weaknesses questions by exam, topic, sub-topic, year, difficulty, completed, or marked for review to save time.
      </p>

      <div className="flex justify-center items-center min-h-screen bg-background-image bg-border bg-cover bg-center">
      <div className="w-full max-w-7xl">
        <ContainerScroll titleComponent={<></>}>
          <Dashboard />
        </ContainerScroll>
      </div>
    </div>
    
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-center text-gray-600 text-sm mb-4">aspirants X ChatGPT 4o</h1>
        <h2 className="text-center mb-10 font-light lg:text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-2xl sm:leading-[4rem]">
          Supercharge Your Learning Experience
        </h2>

        <div className="relative w-full h-96 border-4 rounded-2xl overflow-hidden">
          <Image src="/ventura.jpg" alt="Background" layout="fill" objectFit="cover" />
          <div className="absolute inset-0 bg-opacity-100 p-6 rounded-2xl flex items-center justify-center overflow-auto">
            <div className="w-full h-full overflow-auto p-4 bg-white bg-opacity-80 rounded-2xl">
              <Chat questionText="" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-20">
      <h4 className="text-center font-light lg:text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
        Never Forget Anything
      </h4>

      <p className="text-sm lg:text-base mb-12 max-w-2xl mx-auto text-neutral-500 text-center font-normal">
        View your notes at a glance and save yourself from endless flipping of your notebooks running out of pages to fill.
      </p>

      <div className="flex justify-center">
        <div className="relative z-20 p-4 w-full max-w-4xl">
          <NoteApp />
        </div>
      </div>
    </div>

      <div className="mb-20">
        <h4 className="text-center font-light lg:text-5xl tracking-[-0.02em] drop-shadow-sm sm:text-2xl sm:leading-[4rem]">
          A Plethora of Exams
        </h4>

        <div className="max-w-5xl mx-auto px-8">
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
      </div>
    </div>
  );
}