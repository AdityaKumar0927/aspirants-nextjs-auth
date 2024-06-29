"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Popover from "@/components/shared/popover";
import Link from "next/link";

interface ExamDropdownProps {
  mobile?: boolean;
  className?: string;
}

export default function ExamDropdown({ mobile = false, className = "" }: ExamDropdownProps) {
  const [openPopover, setOpenPopover] = useState(false);
  let timer: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(timer);
    setOpenPopover(true);
  };

  const handleMouseLeave = () => {
    timer = setTimeout(() => {
      setOpenPopover(false);
    }, 300); // 300ms delay
  };

  return (
    <div
      className={`relative inline-block text-left ${
        mobile ? "font-display text-2xl font-bold tracking-tight drop-shadow-sm" : ""
      } ${className}`}
      onMouseEnter={!mobile ? handleMouseEnter : undefined}
      onMouseLeave={!mobile ? handleMouseLeave : undefined}
    >
      <Popover
        content={
          <div className="w-full rounded-md bg-white p-2 sm:w-56">
            <button className="relative flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100">
              <Link href="/CUET" className="block w-full text-gray-700" role="menuitem">
                CUET
              </Link>
            </button>
            <button className="relative flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100">
              <Link href="/JEE" className="block w-full text-gray-700" role="menuitem">
                JEE
              </Link>
            </button>
          </div>
        }
        align="end"
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
      >
        <button className="inline-flex justify-center w-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 p-2 rounded-full">
          Exam
          <ChevronDown className="ml-0.75 -mr-1 h-6 w-5" />
        </button>
      </Popover>
    </div>
  );
}
