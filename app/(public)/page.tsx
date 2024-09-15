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
import Blog from "@/app/components/sections/blog";
import CTA from "@/app/components/sections/cta";
import FAQ from "@/app/components/sections/faq";
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
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="text-center px-4">
          <div className="flex flex-col items-center gap-6 pb-8 text-center">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="button"
              className="bg-white text-black flex items-center space-x-2"
            >
              <span>Now enhanced by ChatGPT 4o</span>
            </HoverBorderGradient>

            <div className="z-10 w-full max-w-xl px-5 xl:px-0 bg-[linear-gradient(to_right,#60606012_1px,transparent_1px),linear-gradient(to_bottom,#60606012_1px,transparent_1px)] bg-[size:48px_48px]">
              <div className="text-center px-4">
                <div className="relative">
                  <div className="absolute top-0 right-20 h-full w-full bg-gradient-to-br from-green-300 via-yellow-200 to-red-500 blur-3xl transform translate-x-1/2"></div>
                  <div className="relative rounded-lg p-6 max-w-md mx-auto">
                    <div className="flex items-center mb-4">
                      <div className="w-6 h-6"></div>
                      <h1
                        className="animate-fade-up bg-gradient-to-br from-black to-black bg-clip-text text-center text-3xl tracking-tighter text-transparent opacity-0 drop-shadow-sm sm:text-6xl sm:leading-[5rem]"
                        style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
                      >
                        Study For Your Exams With{" "}
                        <div className="text-white text-gradient-to-br from-cyan-300 to-white">aspirants</div>
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
        </div>
      </div>

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
            
          
            <Problem />
            
            <Solution />

            <HowItWorks />

            <CtaSection />

            <TestimonialsCarousel />

            <Testimonials />

            <FAQ />

      <div className="flex min-h-[100dvh] flex-col bg-background">
        <main className="container mx-auto flex-1 px-4 py-12 md:px-6 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Support Our Cause</h1>
              <p className="text-muted-foreground md:text-xl">
                Your donation will make a real difference in the lives of those we serve. Help us continue our important
                work.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Donation Options</h2>
                  <p className="text-muted-foreground">Choose how you&apos;d like to support our cause.</p>
                </div>
                <RadioGroup defaultValue="one-time" className="grid gap-4">
                  <div>
                    <RadioGroupItem value="one-time" id="one-time" className="peer sr-only" />
                    <Label
                      htmlFor="one-time"
                      className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary"
                    >
                      <div>
                        <h3 className="text-lg font-medium">One-Time Donation</h3>
                        <p className="text-muted-foreground">Make a single donation.</p>
                      </div>
                      <CheckIcon className="h-6 w-6 text-primary" />
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="recurring" id="recurring" className="peer sr-only" />
                    <Label
                      htmlFor="recurring"
                      className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary"
                    >
                      <div>
                        <h3 className="text-lg font-medium">Recurring Donation</h3>
                        <p className="text-muted-foreground">Make a monthly donation.</p>
                      </div>
                      <CheckIcon className="h-6 w-6 text-primary" />
                    </Label>
                  </div>
                </RadioGroup>
                <div>
                  <h2 className="text-2xl font-bold">Donation Amount</h2>
                  <p className="text-muted-foreground">Select the amount you&apos;d like to donate.</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <Button
                      variant="outline"
                      className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      $25
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      $50
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      $100
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      $250
                    </Button>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Information</h2>
                  <p className="text-muted-foreground">Please provide your contact details.</p>
                  <form className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="First Last" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea id="address" placeholder="123 Main St, Anytown USA" />
                    </div>
                  </form>
                </div>
                <div className="flex justify-end">
                  <Button className="w-full max-w-[200px]">Donate Now</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="flex flex-col min-h-[100dvh]">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-500 border rounded-md">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4 text-primary-foreground">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Support Our Cause</h1>
                  <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
                    Your donation can make a real difference in the lives of those in need. Help us continue our mission
                    to provide essential services to the community.
                  </p>
                </div>
                <Link
                  href="#"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary-foreground px-8 text-sm font-medium text-primary shadow transition-colors hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Donate Now
                </Link>
              </div>
              <img
                src="/placeholder.svg"
                width="550"
                height="550"
                alt="Donation"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Mission</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Helping Those in Need</h2>
                <p className="text-muted-foreground md:text-xl lg:text-base xl:text-xl">
                  Your donation will help us provide essential services and resources to families and individuals
                  struggling with poverty, homelessness, and other challenges. We are committed to making a lasting impact
                  in our community.
                </p>
              </div>
              <div>
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">How We Use Donations</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Transparent Allocation</h2>
                <p className="text-muted-foreground md:text-xl lg:text-base xl:text-xl">
                  We are committed to using your donations responsibly and transparently. 80% of all donations go directly
                  to our programs and services, with the remaining 20% used for operational expenses and administrative
                  costs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Page;
