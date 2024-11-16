"use client";

import { useState } from "react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LucidePencil, HomeIcon, LucideGitBranchPlus } from "lucide-react";
import AnimatedModal from "@/components/shared/AnimatedModal";
import NoteApp from "@/components/shared/NoteApp";
import Stats from "@/components/shared/Stats";
import { useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import DashboardContent from "@/components/home/DashboardContent"; // Import the sample DashboardContent
import GuestAccessBlock from "./GuestAccessBlock";
import { IconGraph, IconGraphOff } from "@tabler/icons-react";
import { MdOutlineAutoGraph } from "react-icons/md";
import { GoGraph } from "react-icons/go";

// Define the type for the userId prop
interface BarProps {
  userId: string | null;
}

export default function Bar({ userId }: BarProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const mouseX = useMotionValue(Infinity);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 flex origin-bottom h-full max-h-14">
        <div className="fixed bottom-0 inset-x-0 h-16 w-full"></div>
        <Dock className="z-50 border-2 pointer-events-auto relative mx-auto flex min-h-full h-full items-center px-1 bg-background">
          <DockIcon mouseX={mouseX}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowDashboardModal(true)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12"
                  )}
                >
                  <GoGraph className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>performance</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          <DockIcon mouseX={mouseX}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowNoteModal(true)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12"
                  )}
                >
                  <LucidePencil className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notes</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          <DockIcon mouseX={mouseX}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ModeToggle />
              </TooltipTrigger>
              <TooltipContent>
                <p>Theme</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        </Dock>
      </div>

      <AnimatedModal showModal={showNoteModal} setShowModal={setShowNoteModal}>
        <NoteApp />
      </AnimatedModal>

      <AnimatedModal showModal={showDashboardModal} setShowModal={setShowDashboardModal}>
        {userId ? (
          <Stats />  // For signed-in users, show the Stats component with their data
        ) : (
          <GuestAccessBlock />
        )}
      </AnimatedModal>
    </>
  );
}
