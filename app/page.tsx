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
      <div className="flex justify-between items-center">
        <MainContent />
      </div>
      
    </>
  );
}


