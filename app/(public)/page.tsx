"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Dashboard from "@/components/home/DashboardContent";
import NoteApp from "@/components/shared/NoteApp";
import Link from "next/link";
import MainContent from "@/components/home/MainContent";
import { motion, useInView } from "framer-motion";
import { CheckIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import Image from "next/image";
import ShinyButton from "@/components/magicui/shiny-button";
import ShimmerButton from "@/components/magicui/shimmer-button";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import Chat from "@/components/shared/Chat";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { RadioGroupItem, RadioGroup } from "@radix-ui/react-radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/administrator-ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import Blog from "@/app/components/sections/blog";
import CTA from "@/app/components/sections/cta";
import Features from "@/app/components/sections/features";
import Footer from "@/app/components/sections/footer";
import Header from "@/app/components/sections/header";
import Hero from "@/app/components/sections/hero";
import HowItWorks from "@/app/components/sections/how-it-works";
import Logos from "@/app/components/sections/logos";
import Pricing from "@/app/components/sections/pricing";
import Problem from "@/app/components/sections/problem";
import Solution from "@/app/components/sections/solution";
import Testimonials from "@/app/components/sections/testimonials";
import TestimonialsCarousel from "@/app/components/sections/testimonials-carousel";
import CtaSection from "@/app/components/sections/cta";
import { FAQ } from "@/components/shared/FAQ";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";


// Projects array used in HoverEffect
const projects = [
  {
    title: "JEE",
    description:
      "The Joint Entrance Examination is an engineering entrance assessment conducted for admission to various engineering colleges in India.",
    link: "https://jeemain.nta.nic.in/",
  },
  {
    title: "CUET",
    description:
      "The Common University Entrance Test is conducted for admission to various undergraduate programs in central universities across India.",
    link: "https://cuet.samarth.ac.in/",
  },
  {
    title: "CBSE",
    description:
      "The Central Board of Secondary Education is a national level board of education in India for public and private schools, controlled and managed by the Government of India.",
    link: "https://cbse.nic.in/",
  },
  {
    title: "A levels",
    description:
      "Advanced Level qualifications are subject-based school leaving qualifications offered by educational bodies in the United Kingdom and the educational authorities in many Commonwealth countries.",
    link: "https://www.cambridgeinternational.org/",
  },
  {
    title: "CLAT",
    description:
      "The Common Law Admission Test is a centralized national level entrance test for admissions to National Law Universities in India.",
    link: "https://consortiumofnlus.ac.in/clat-2024/",
  },
  {
    title: "CAT",
    description:
      "The Common Admission Test is a computer-based test for admission in a graduate management program in various colleges across India.",
    link: "https://iimcat.ac.in/",
  },
];

// Variants used in motion components
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

const Page = () => {
  const fadeInRef = useRef(null);
  const fadeInInView = useInView(fadeInRef, {
    once: true,
  });

  return (
    <>
      <div className="z-10 w-full px-5 xl:px-0">
        <div className="text-center px-4">
          <div className="flex flex-col items-center gap-6 pb-8 text-center">
            <AnimatedGradientText
              className="bg-white text-black font-light flex items-center space-x-2"
            >
              <span>Now enhanced by ChatGPT 4o</span>
            </AnimatedGradientText>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
                 Study Smart With Aspirants
              </h1>
              <p
              className="mt-6 animate-fade-up text-center text-gray-500 opacity-0 sm:text-xl"
              style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
            >
              Thousands of practice questions, study notes, and flashcards, all in one place.
            </p>

            <div
              className="mx-auto mt-6 flex flex-col sm:flex-row animate-fade-up items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5 opacity-0"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
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
            <div className="mt-16 flow-root sm:mt-24">
              <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <img
                  alt="App screenshot"
                  src="https://i.imghippo.com/files/Zm2044GO.png"
                  width={2432}
                  height={1442}
                  className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>

        <h4 className="text-3xl mt-8 lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black">
        Review Your Performance
      </h4>

      <p className="text-sm mb-8 lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal">
        Understand your strengths and weaknesses questions by exam, topic, sub-topic, year, difficulty, completed, or marked for review to save time.
      </p>

    
      <div className="flex justify-between items-center bg-background-image bg-border mt-10 bg-cover bg-center">
        <ContainerScroll titleComponent={<></>}>
          <Dashboard />
        </ContainerScroll>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-center text-gray-600 text-sm mb-4">aspirants X ChatGPT 4o</h1>
        <h2 className="text-3xl mt-8 lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black">
          Supercharge your
        </h2>
        <h2 className="text-sm mb-8 lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal">
          learning experience
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

      <h4 className="text-3xl mt-8 lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black">
        Quality Question Banks
      </h4>

      <p className="text-sm mb-8 lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal">
        Filter questions by exam, topic, sub-topic, year, difficulty, completed, or marked for review to save time.
      </p>

      <div className="relative w-11/12 h-[1300px] border-4 rounded-2xl overflow-hidden">
        <Image
          src="/imac.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 blur-md hidden sm:block"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[1300px] bg-white bg-opacity-60 rounded-2xl overflow-auto p-4">
            <MainContent />
          </div>
        </div>
      </div>

      <div className="mb-20">
        <h4 className="text-3xl mt-8 lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black">
          Never Forget Anything
        </h4>

        <p className="text-sm lg:text-base mb-12 max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal">
          View your notes at a glance and save yourself from endless flipping of your notebooks running out of pages to fill.
        </p>

        <div className="relative z-20 p-4">
          <NoteApp />
        </div>
      </div>

      <div className="mb-20">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black">
          A Plethora of Exams
        </h4>

        <div className="max-w-5xl mx-auto px-8">
          <HoverEffect items={projects} />
        </div>

        <motion.div
          ref={fadeInRef}
          animate={fadeInInView ? "animate" : "initial"}
          variants={fadeUpVariants}
          className="flex flex-col gap-4 lg:flex-row"
          initial={false}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: [0.21, 0.47, 0.32, 0.98],
            type: "spring",
          }}
        >
          <a
            href="#"
            className={cn(
              // colors
              "bg-black text-white shadow hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
              // layout
              "group relative inline-flex h-9 w-full items-center justify-center gap-2 overflow-hidden whitespace-pre rounded-md px-4 py-2 text-base font-semibold tracking-tighter focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 md:flex",
              // animation
              "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-2"
            )}
          >
            Get Started
            <ChevronRight className="size-4 translate-x-0 transition-all duration-300 ease-out group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
            

    </>
  );
};

export default Page;
