"use client";

import { useState } from "react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LucidePencil, HomeIcon } from "lucide-react";
import AnimatedModal from "@/components/shared/AnimatedModal";
import { NoteApp } from "@/components/shared/NoteApp";
import Dashboard from "@/components/shared/Dashboard";
import { useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

// You can replace this with actual userId fetching logic
const getUserId = () => "user-id-placeholder";

export default function Sidebar() {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const userId = getUserId(); // Fetch or define the userId

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 flex origin-bottom h-full max-h-14">
        <div className="fixed bottom-0 inset-x-0 h-16 w-full bg-background to-transparent backdrop-blur-lg [-webkit-mask-image:linear-gradient(to_top,black,transparent)] dark:bg-background"></div>
        <Dock className="z-50 border-2 pointer-events-auto relative mx-auto flex min-h-full h-full items-center px-1 bg-background shadow-lg [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]">
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
                  <HomeIcon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
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
        <Dashboard />
      </AnimatedModal>
    </>
  );
}