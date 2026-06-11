"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Define a common interface for icon components' props to avoid implicit any errors
interface IconProps {
  className?: string;
}

export default function Component() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4">
      <header className="w-full max-w-5xl">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <a href="#" className="hover:underline">
            CBSE
          </a>
          <span>/</span>
          <a href="#" className="hover:underline">
            Accountancy Class 12
          </a>
          <span>/</span>
          <a href="#" className="hover:underline">
            Fundamentals of partnership Firms
          </a>
        </nav>
        <h1 className="mt-2 text-2xl font-bold">Fundamentals of partnership Firms</h1>
        <div className="flex items-center mt-4 space-x-4">
          <a href="#" className="text-muted-foreground hover:underline">
            Overview
          </a>
          <a href="#" className="text-muted-foreground hover:underline">
            Learn
          </a>
          <a href="#" className="text-muted-foreground hover:underline">
            Questionbank
          </a>
          <a href="#" className="text-muted-foreground hover:underline">
            Notes
          </a>
          <Button variant="outline" className="ml-auto">
            Flashcards
          </Button>
        </div>
      </header>
      <main className="flex flex-col items-center w-full max-w-3xl mt-8 space-y-4">
        <div className="flex items-center w-full space-x-4">
          <Button variant="outline" className="p-2">
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="relative w-full h-2 bg-gray-200 rounded-full">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-blue-500 rounded-full" />
            </div>
            <div className="flex justify-center mt-2 text-sm">1 / 18</div>
          </div>
          <Button variant="outline" className="p-2">
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" className="flex items-center space-x-2">
          <ShuffleIcon className="w-4 h-4" />
          <span>Shuffle</span>
        </Button>
        <Card className="w-full p-8 text-center">
          <CardContent>
            <p className="text-lg">What is a partnership?</p>
          </CardContent>
          <Button variant="ghost" className="absolute top-4 right-4">
            <VolumeIcon className="w-6 h-6" />
          </Button>
        </Card>
        <div className="flex items-center space-x-4">
          <Button variant="destructive" className="flex items-center space-x-2">
            <ThumbsDownIcon className="w-4 h-4" />
            <span>Bad</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <MehIcon className="w-4 h-4" />
            <span>Mid</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <ThumbsUpIcon className="w-4 h-4" />
            <span>Good</span>
          </Button>
        </div>
        <Button variant="outline" className="mt-4">
          Reset card confidence
        </Button>
      </main>
    </div>
  );
}

// Icon components with proper type annotations
function ChevronLeftIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MehIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="8" x2="16" y1="15" y2="15" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  );
}

function ShuffleIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  );
}

function ThumbsDownIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

function ThumbsUpIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function VolumeIcon(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    </svg>
  );
}
