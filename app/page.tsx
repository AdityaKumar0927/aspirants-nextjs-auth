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

export default async function Home() {
  const { stargazers_count: stars } = await fetch(
    "https://api.github.com/repos/steven-tey/precedent",
    {
      ...(process.env.GITHUB_OAUTH_TOKEN && {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_OAUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }),
      next: { revalidate: 86400 },
    }
  )
    .then((res) => res.json())
    .catch((e) => console.log(e));

  return (
    <>
      <ModalWrapper />
      <div className="z-10 w-full max-w-xl px-5 xl:px-0">
        <h1
          className="animate-fade-up bg-gradient-to-br from-black to-blue-300 bg-clip-text text-center font-display text-4xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm sm:text-5xl sm:leading-[5rem]"
          style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
        >
          Study for your exams with Aspirants
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
      <MainContent />
      <div className="my-10 grid w-full max-w-screen-xl animate-fade-up grid-cols-1 gap-5 px-5 md:grid-cols-3 xl:px-0">
        {features.map(({ title, description, demo, large, icon }) => (
          <Card
            key={title}
            title={title}
            description={description}
            demo={demo}
            large={large}
            icon={icon}
          />
        ))}
      </div>
    </>
  );
}

const features = [
  {
    title: "Extensive Question Bank",
    description:
      "Access thousands of practice questions across various subjects and difficulty levels to help you prepare effectively.",
    icon: faBookOpen,
    large: true,
  },
  {
    title: "Performance Analytics",
    description:
      "Track your performance with detailed analytics to understand your strengths and areas for improvement.",
    demo: <WebVitals />,
    icon: faChartLine,
  },
  {
    title: "Useful Study Tools",
    description:
      "Utilize a range of study tools including flashcards, notes, and reminders to optimize your learning experience.",
    demo: (
      <div className="grid grid-flow-col grid-rows-3 gap-10 p-10">
        <span className="font-mono font-semibold">Flashcards</span>
        <span className="font-mono font-semibold">Study Notes</span>
        <span className="font-mono font-semibold">Reminders</span>
      </div>
    ),
    icon: faTools,
  },
  {
    title: "Personalized Study Plans",
    description:
      "Get customized study plans based on your goals and progress to ensure you're on the right track.",
    icon: faUserCog,
    demo: <div className="flex items-center justify-center"><FontAwesomeIcon icon={faUserCog} size="3x" /></div>,
  },
  {
    title: "Interactive Quizzes",
    description:
      "Engage in interactive quizzes to test your knowledge and prepare for exams in a fun way.",
    icon: faClipboardList,
    demo: <div className="flex items-center justify-center"><FontAwesomeIcon icon={faClipboardList} size="3x" /></div>,
  },
  {
    title: "Community Support",
    description:
      "Join a community of learners, participate in discussions, and get support from peers and experts.",
    icon: faUsers,
    demo: <div className="flex items-center justify-center"><FontAwesomeIcon icon={faUsers} size="3x" /></div>,
  },
  {
    title: "Daily Study Goals",
    description:
      "Set daily study goals to stay motivated and ensure consistent progress.",
    icon: faBullseye,
    demo: <div className="flex items-center justify-center"><FontAwesomeIcon icon={faBullseye} size="3x" /></div>,
  },
  {
    title: "Resource Recommendations",
    description:
      "Get personalized recommendations for study resources based on your performance and interests.",
    icon: faLightbulb,
    demo: <div className="flex items-center justify-center"><FontAwesomeIcon icon={faLightbulb} size="3x" /></div>,
  },
];
