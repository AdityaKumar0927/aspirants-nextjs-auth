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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-6xl font-bold mb-2">Embed comments</h1>
        <h2 className="text-5xl font-normal mb-6">into your workflows</h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Transform your comments into Emails, Zapier workflows or Slack notifications by developing on top of our Webhook notification system.
        </p>
        <div className="flex justify-between items-center space-x-8">
          <div className="bg-white rounded-lg shadow-lg p-6 flex-1">
            <div className="mb-4">
              <p className="font-semibold">Traci via Aspirants</p>
              <p className="text-gray-500 text-sm">To: &lt;aspirants.contacus@gmail.com&gt;</p>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-2 bg-gray-200 rounded w-full"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="https://placehold.co/32x32" alt="User avatar" className="rounded-full" />
              <div className="space-y-1 flex-1">
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <button className="bg-black text-white rounded-full px-4 py-2 text-sm font-semibold">View comment</button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 border-4 border-dashed border-gray-300 rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full p-4">
                  <i className="fas fa-comment-alt text-3xl"></i>
                </div>
              </div>
              <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2">
                <span className="text-sm font-semibold">Emails</span>
              </div>
              <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2">
                <span className="text-sm font-semibold">Notifications</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 flex-1">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="https://placehold.co/32x32" alt="User avatar" className="rounded-full" />
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mt-1"></div>
                </div>
                <span className="text-sm text-gray-500">Just now</span>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
              <div className="flex items-center space-x-2">
                <img src="https://placehold.co/32x32" alt="User avatar" className="rounded-full" />
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mt-1"></div>
                </div>
                <span className="text-sm text-gray-500">12 min ago</span>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
              <div className="flex items-center space-x-2">
                <img src="https://placehold.co/32x32" alt="User avatar" className="rounded-full" />
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mt-1"></div>
                </div>
                <span className="text-sm text-gray-500">2 days ago</span>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      //animated feature card 2
      <div className="relative h-full w-full max-w-[32rem] transform-gpu rounded-lg border bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] md:max-h-[500px]">
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileHover="whileHover"
        className="flex h-full w-full cursor-pointer flex-col justify-between"
      >
        <div className="flex h-full w-full items-center justify-center rounded-t-xl">
          <motion.div className="flex h-[310px] w-full cursor-pointer flex-col gap-y-5 overflow-hidden rounded-t-md p-5">
            {texts.map((text, index) => (
              <motion.div
                key={text.id}
                className="w-full origin-right rounded-md  border border-slate-300/50 p-4 shadow-[0px_0px_40px_-25px_rgba(0,0,0,0.25)] dark:border-neutral-800 dark:bg-neutral-900"
                custom={index}
                variants={itemVariants}
              >
                <div className="flex flex-row gap-2">
                  {text.icon}
                  <p className="text-black dark:text-white">{text.header}</p>
                </div>
                <p className="text-gray-400 dark:text-gray-400">
                  {text.subheader}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <div className="flex w-full flex-col items-start border-t border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-base font-normal text-neutral-500 dark:text-neutral-400">
            Instantly get notified about events
          </p>
        </div>
      </motion.div>
    </div>

  //animated feature pop up card

  <div className="relative h-full w-full max-w-[32rem] transform-gpu rounded-lg border bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] md:max-h-[500px]">
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileHover="whileHover"
        className="flex h-full w-full cursor-pointer flex-col justify-between"
      >
        <motion.div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-y-2 overflow-hidden rounded-t-xl p-8">
          <motion.p
            variants={variant1}
            className="w-fit rounded-full border px-2 text-[15px]"
          >
            Make it Pop ✨
          </motion.p>
          <motion.div
            variants={variant2}
            className="flex max-w-[300px] items-start gap-x-2 rounded-lg border border-neutral-300 border-neutral-400/20 bg-white p-4 shadow-[0px_0px_40px_-25px_rgba(0,0,0,0.25)] dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex h-6 w-6 shrink-0 rounded-full bg-blue-500">
              <img
                className="h-full w-full rounded-full object-cover"
                src="https://avatar.vercel.sh/jane"
                alt="jane"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold">Josh</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
          </motion.div>
        </motion.div>
        <div className="flex w-full flex-col items-start border-t border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-xl font-semibold">AI Co-Pilot</h2>
          <p className="text-base font-normal text-neutral-500 dark:text-neutral-400">
            Use AI to make your writing stand out
          </p>
        </div>
      </motion.div>
    </div>


      <div className="container mx-auto px-4 py-12">
        <h1 className="text-6xl font-bold mb-2 text-center">Improve your</h1>
        <h2 className="text-5xl mb-8 text-center font-serif">rich text editor with AI</h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Allow your users to create and manipulate text, generate images,
          and transform documents with Content AI.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h3 className="text-4xl font-bold mb-4">Manipulate and<br />auto-complete<br /><span className="font-serif font-normal">inline text</span></h3>
            <p className="text-lg mb-6 max-w-md">
              Provide your users with predefined commands and
              prompts to optimize their content. Or let them
              auto-complete their text as if by magic.
            </p>
            <a href="#" className="text-blue-600 font-semibold flex items-center">
              Show docs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gradient-to-br from-purple-300 to-pink-400 rounded-3xl p-8 shadow-lg">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">🍓</span>
                    Adjust tone
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✏️</span>
                    Fix spelling & grammar
                  </li>
                  <li className="flex items-center">
                    <span className="text-purple-500 mr-2">☰</span>
                    Extend text
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">▼</span>
                    Reduce text
                  </li>
                  <li className="flex items-center">
                    <span className="text-indigo-500 mr-2">↺</span>
                    Simplify
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-500 mr-2">😊</span>
                    Emojify
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">⇥</span>
                    Complete sentence
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-500 mr-2">)≡</span>
                    Summarize
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">🌐</span>
                    Translate
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="min-h-screen bg-gradient-to-brb round-3x1 from-purple-300 via-pink-200 to-red-200 flex items-center justify-center">
        <div className="text-center max-w-3xl px-4">
          <h1 className="text-6xl font-bold mb-4">Rich Text Editor</h1>
          <h2 className="text-5xl font-normal mb-6">Write your notes with ease and convenience.</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
          Take notes for specific questions to learn from your mistakes and realign your approach towards questions
          </p>
          <div className="flex justify-center space-x-6 mb-12">
            <button className="px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm">LaTex Mathematics Equations</button>
            <button className="px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm">Neat writing</button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-300 opacity-50 blur-3xl"></div>
            <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                <div className="text-lg font-semibold">Paragraph</div>
              </div>
              <p className="text-gray-600 mb-4">This is an excerpt of the text t...</p>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <img src="https://placehold.co/32x32" alt="User avatar" className="w-8 h-8 rounded-full mr-2" />
                  <div className="flex-grow">
                    <div className="h-2 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-2 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      //events card

      <div className="relative h-full w-full max-w-[32rem] transform-gpu rounded-lg border bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] md:max-h-[500px]">
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileHover="whileHover"
        className="flex h-full w-full cursor-pointer flex-col justify-between"
      >
        <div className="flex h-full w-full items-center justify-center rounded-t-xl">
          <div className="relative flex flex-col items-center justify-center gap-y-2 p-10">
            <motion.div
              variants={variant1}
              className="z-[1] flex h-full w-full items-center justify-between gap-x-2 rounded-md border bg-white p-5 px-2.5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="h-8 w-8 rounded-full bg-pink-300">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src="https://avatar.vercel.sh/jack"
                  alt="jack"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <div className="h-2 w-32 rounded-full bg-neutral-800/50 dark:bg-neutral-200/80"></div>
 
                <div className="h-2 w-48 rounded-full bg-slate-400/50"></div>
              </div>
            </motion.div>
            <motion.div
              variants={variant2}
              className="z-[2] flex h-full w-full items-center justify-between gap-x-2 rounded-md border bg-white p-5 px-2.5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="h-8 w-8 rounded-full bg-pink-300">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src="https://avatar.vercel.sh/jane"
                  alt="jane"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <div className="h-2 w-32 rounded-full bg-neutral-800/50 dark:bg-neutral-200/80"></div>
                <div className="h-2 w-48 rounded-full bg-slate-400/50"></div>
                <div className="h-2 w-20 rounded-full bg-slate-400/50"></div>
              </div>
            </motion.div>
            <motion.div
              variants={variant3}
              className="absolute bottom-0 z-[3] m-auto flex h-fit w-fit items-center justify-between gap-x-2 rounded-md border bg-white p-5 px-2.5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="h-8 w-8 rounded-full bg-pink-300">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src="https://avatar.vercel.sh/jill"
                  alt="jill"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <div className="h-2 w-32 rounded-full bg-neutral-800/50 dark:bg-neutral-200/80"></div>
                <div className="h-2 w-48 rounded-full bg-slate-400/50"></div>
                <div className="h-2 w-20 rounded-full bg-slate-400/50"></div>
                <div className="h-2 w-48 rounded-full bg-slate-400/50"></div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="flex w-full flex-col items-start border-t border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-base font-normal text-neutral-500 dark:text-neutral-400">
            Instantly get notified about events
          </p>
        </div>
      </motion.div>
    </div>

      <div className="flex items-center justify-center p-10 bg-black border rounded-3xl">
        <div className="container mx-auto px-4 py-12">
          <p className="text-xl text-gray-300 mb-8">Discover the key benefits of Aspirants and how to integrate it.</p>
          <div className="flex justify-between items-start">
            <div className="bg-gray-900 rounded-lg p-6 shadow-lg max-w-3xl mx-auto">
              <div className="flex justify-between text-purple-400 mb-4">
                <div className="flex space-x-4">
                  <span>H</span>
                  <span><i className="fas fa-list"></i></span>
                  <span><i className="fas fa-exchange-alt"></i></span>
                </div>
                <div className="flex space-x-4">
                  <span>B</span>
                  <span>I</span>
                  <span>S</span>
                  <span><i className="fas fa-pencil-alt"></i></span>
                  <span><i className="fas fa-link"></i></span>
                  <span>&lt;/&gt;</span>
                </div>
                <div className="flex space-x-4">
                  <span><i className="fas fa-align-left"></i></span>
                  <span><i className="fas fa-align-center"></i></span>
                  <span><i className="fas fa-align-right"></i></span>
                </div>
                <div className="flex space-x-4">
                  <span><i className="fas fa-subscript"></i></span>
                  <span><i className="fas fa-superscript"></i></span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-800 h-4 w-1/3 rounded"></div>
                <div className="bg-gray-800 h-4 w-full rounded"></div>
                <div className="bg-gray-800 h-4 w-5/6 rounded"></div>
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 w-full rounded"></div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-800 h-2 w-2 rounded-full"></div>
                  <div className="bg-gray-800 h-4 w-1/4 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-800 h-2 w-2 rounded-full"></div>
                  <div className="bg-gray-800 h-4 w-1/3 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-800 h-2 w-2 rounded-full"></div>
                  <div className="bg-gray-800 h-4 w-1/5 rounded"></div>
                </div>
              </div>
            </div>
            <div className="w-1/2">
              <div className="mb-6">
                <span className="text-green-400 mr-2">Collaboration</span>
                <span className="bg-white text-black px-2 py-1 text-xs rounded mr-2">Cloud</span>
                <span className="bg-gray-700 text-white px-2 py-1 text-xs rounded">On-premises</span>
              </div>
              <h1 className="text-6xl font-bold mb-4 text-white">
                Exam Based Personalized<br />
                Analysis<br />
                <span className="font-normal">in seconds...</span>
              </h1>
              <p className="text-gray-400 mb-8 max-w-md">
                Allow your users to collaborate in any document and media. Integrate live carets and cursors to show who is typing, support offline editing and sync content without any headaches.
              </p>
              <div className="flex space-x-4">
                <button className="bg-white text-black px-6 py-3 rounded-full font-medium flex items-center">
                  Get started
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="border border-white text-white px-6 py-3 rounded-full font-medium">
                  Try it live
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FAQ />
    </>
  );
}

export default FeatureCard1;
