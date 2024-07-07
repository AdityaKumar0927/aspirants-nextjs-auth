"use client"

import Card from "@/components/home/card";
import { DEPLOY_URL } from "@/lib/constants";
import { Github, Twitter } from "@/components/shared/icons";
import WebVitals from "@/components/home/web-vitals";
import ComponentGrid from "@/components/home/component-grid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faChartLine,
  faTools,
  faUserCog,
  faClipboardList,
  faUsers,
  faBullseye,
  faLightbulb
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import MainContent from "@/components/home/MainContent";
import ModalWrapper from "@/components/layout/ModalWrapper";
import FAQ from "@/components/shared/FAQ";
import { cubicBezier, motion, useInView } from "framer-motion";
import { Clock, Download, MessageCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import { BorderBeam } from "@/components/magicui/border-beam";

const texts = [
  {
    id: 1,
    header: "New Feature Release.",
    subheader: "Experience our latest features now.",
    icon: <Star />,
  },
  {
    id: 2,
    header: "App Update Available.",
    subheader:
      "A new update is available for download. Get the latest version!",
    icon: <Download />,
  },
  {
    id: 3,
    header: "Scheduled Maintenance.",
    subheader:
      "Our app will be temporarily unavailable due to scheduled maintenance.",
    icon: <Clock />,
  },
  {
    id: 4,
    header: "Feedback Appreciated.",
    subheader:
      "We would love to hear your thoughts on our app. Share your feedback!",
    icon: <MessageCircle />,
  },
];

interface FeatureCardProps {
  icon: JSX.Element;
  title: string;
  tags: string[];
  description: string;
  learnMoreText: string;
}

interface UserCardProps {
  user: string;
  color: string;
}

const FeatureCard = ({ icon, title, tags, description, learnMoreText }: FeatureCardProps) => (
  <div className="bg-white rounded-3xl p-6 flex flex-col h-full shadow-lg">
    <div className="text-3xl mb-4">{icon}</div>
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div className="flex gap-2 mb-4">
      {tags.map((tag, index) => (
        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{tag}</span>
      ))}
    </div>
    <p className="text-gray-600 mb-6 flex-grow">{description}</p>
    <a href="#" className="text-black font-medium flex items-center">
      {learnMoreText}
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
      </svg>
    </a>
  </div>
);

const UserCard = ({ user, color }: UserCardProps) => (
  <div className={`bg-gray-800 rounded-lg p-6 w-80 mx-4 border-2 border-${color}-500`}>
    <div className="flex items-center justify-between mb-4">
      <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
      <span className="text-white font-semibold">{user}</span>
    </div>
    <div className="space-y-3 mb-4">
      <div className="h-2 bg-gray-700 rounded"></div>
      <div className="h-2 bg-gray-700 rounded w-5/6"></div>
    </div>
    <div className={`h-2 bg-${color}-500 rounded w-3/4 mb-6`}></div>
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="relative">
        <svg viewBox="0 0 100 20" className="w-full">
          <path d="M0,10 Q25,20 50,10 T100,10" fill="none" stroke={color === 'green' ? '#4ade80' : '#9ca3af'} strokeWidth="2" />
        </svg>
        {color !== 'green' && (
          <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-green-500 border-2 border-gray-800 -mt-2 -ml-2"></div>
        )}
        {color === 'green' && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center -mt-2 -mr-2">
            <i className="fas fa-pen text-xs text-gray-800"></i>
          </div>
        )}
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-2 bg-gray-700 rounded"></div>
      <div className="h-2 bg-gray-700 rounded w-5/6"></div>
    </div>
    <div className="mt-4 relative">
      <div className={`h-2 ${color === 'blue' ? 'bg-blue-500' : 'bg-gray-700'} rounded`}></div>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
        <div className="w-4 h-4 bg-blue-500 rotate-45 transform origin-center"></div>
      </div>
    </div>
  </div>
);


const variant1 = {
  initial: {
    scale: 0.87,
    transition: {
      delay: 0.05,
      duration: 0.2,
      ease: "linear",
    },
  },
  whileHover: {
    scale: 0.8,
    boxShadow:
      "rgba(245,40,145,0.35) 0px 20px 70px -10px, rgba(36,42,66,0.04) 0px 10px 24px -8px, rgba(36,42,66,0.06) 0px 1px 4px -1px",
    transition: {
      delay: 0.05,
      duration: 0.2,
      ease: "linear",
    },
  },
};

const variant2 = {
  initial: {
    y: -27,
    scale: 0.95,
    transition: {
      delay: 0,
      duration: 0.2,
      ease: "linear",
    },
  },
  whileHover: {
    y: -55,
    scale: 0.87,
    boxShadow:
      "rgba(39,127,245,0.15) 0px 20px 70px -10px, rgba(36,42,66,0.04) 0px 10px 24px -8px, rgba(36,42,66,0.06) 0px 1px 4px -1px",
    transition: {
      delay: 0,
      duration: 0.2,
      ease: "linear",
    },
  },
};

const variant3 = {
  initial: {
    y: -25,
    opacity: 0,
    scale: 1,
    transition: {
      delay: 0.05,
      duration: 0.2,
      ease: "linear",
    },
  },
  whileHover: {
    y: -45,
    opacity: 1,
    scale: 1,
    boxShadow:
      "rgba(39,245,76,0.15) 10px 20px 70px -20px, rgba(36,42,66,0.04) 0px 10px 24px -8px, rgba(36,42,66,0.06) 0px 1px 4px -1px",
    transition: {
      delay: 0.05,
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

const itemVariants = {
  initial: (index: number) => ({
    y: 0,
    scale: index === 3 ? 0.85 : 1,
    transition: {
      delay: 0.05,
      duration: 0.3,
      ease: cubicBezier(0.22, 1, 0.36, 1),
    },
  }),
  whileHover: (index: number) => ({
    y: -110,
    opacity: 1,
    scale: index === 0 ? 0.85 : index === 3 ? 1 : 1,
    transition: {
      delay: 0.05,
      duration: 0.3,
      ease: cubicBezier(0.22, 1, 0.36, 1),
    },
  }),
};

const containerVariants = {
  initial: {},
  whileHover: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};


const FeatureCard1 = () => {
  return (
    <>
      <ModalWrapper />
      <div className="z-10 w-full max-w-xl px-5 xl:px-0 bg-[linear-gradient(to_right,#60606012_1px,transparent_1px),linear-gradient(to_bottom,#60606012_1px,transparent_1px)] bg-[size:48px_48px]">
        <div className="text-center px-4">
          <div className="relative">
            <div className="absolute top-0 right-20 h-full w-full bg-gradient-to-br from-green-300 via-violet-300 to-red-500 blur-3xl transform translate-x-1/2"></div>
            <div className="relative rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6"></div>
                <h1
                  className="animate-fade-up bg-gradient-to-br from-black to-black bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm sm:text-5xl sm:leading-[5rem]"
                  style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
                >
                  Study for your exams with <div className="text-white text-gradient-to-br from-cyan-300 to-white">Aspirants</div>
                </h1>
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
          <Link
            className="group flex max-w-fit items-center justify-center space-x-2 rounded-full border bg-black px-5 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
            href="CUET"
          >
            <p>Try Now</p>
          </Link>
          <Link
            className="flex items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-md transition-colors hover:border-gray-800 sm:px-5 sm:py-2"
            href="BrowseResources"
          >
            <p className="text-center">
              <span className="sm:hidden">Resources</span>
              <span className="hidden sm:inline-block">Browse Resources</span>
            </p>
          </Link>
        </div>
      </div>
      <div className="flex justify-between items-center">
      <BorderBeam
            size={200}
            duration={12}
            delay={11}
            colorFrom="var(--color-one)"
            colorTo="var(--color-two)"
          />
        <MainContent />
      </div>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-center text-gray-600 text-sm mb-4">aspirants X ChatGPT 4o</h1>
        <h2 className="text-center text-6xl font-bold mb-2">Supercharge your</h2>
        <h2 className="text-center text-6xl font-normal mb-6">learning experience</h2>
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-16">
          Essentially a headless open source editor, Aspirants has a wide range
          of paid features that give developers exactly the kind of experience
          they&apos;re looking for - fully customizable to build their product needs.
        </p>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-purple-100 to-blue-100 opacity-50 rounded-3xl transform scale-110 z-[-10]"></div>
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<FontAwesomeIcon icon={faBookOpen} />}
                title="Question Banks"
                tags={["Open source core"]}
                description="Access and create comprehensive question banks for various exams, tailored to enhance your study sessions."
                learnMoreText="Learn more"
              />
              <FeatureCard
                icon={<FontAwesomeIcon icon={faChartLine} />}
                title="Mock Exams"
                tags={["Cloud", "Try for free"]}
                description="Simulate real exam conditions with our mock exams. Get instant feedback and improve your performance."
                learnMoreText="Learn more"
              />
              <FeatureCard
                icon={<FontAwesomeIcon icon={faTools} />}
                title="Productivity Extensions"
                tags={["Cloud", "Paid feature"]}
                description="Boost your productivity with our custom extensions designed to streamline your study process."
                learnMoreText="Learn more"
              />
              <FeatureCard
                icon={<FontAwesomeIcon icon={faClipboardList} />}
                title="Note Taking"
                tags={["Cloud", "Try for free"]}
                description="Organize your notes efficiently with our advanced note-taking features, integrated with AI for smarter suggestions."
                learnMoreText="Learn more"
              />
            </div>
          </div>
        </div>
      </div>
   
    
    
      <FAQ />
    </>
  );
}

export default FeatureCard1;
