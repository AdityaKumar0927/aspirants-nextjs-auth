"use client";

import { useState } from "react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AnimatedModal from "@/components/shared/AnimatedModal";
import NoteApp from "@/components/shared/note";
import StatsWithSession from "./StatsWithSession";
import { LucidePencil } from "lucide-react";
import { GoGraph } from "react-icons/go";
import { cn } from "@/lib/utils";
import { useMotionValue } from "framer-motion";

/* The props for Bar (unchanged) */
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
        <div className="fixed bottom-0 inset-x-0 h-16 w-full" />
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
        </Dock>
      </div>

      {/* The modals */}
      <AnimatedModal showModal={showNoteModal} setShowModal={setShowNoteModal}>
        <NoteApp />
      </AnimatedModal>

      <AnimatedModal showModal={showDashboardModal} setShowModal={setShowDashboardModal}>
        {/* 
          Instead of <Stats />, use <StatsWithSession /> 
          so that <SessionProvider> is present 
        */}
        <StatsWithSession />
      </AnimatedModal>
    </>
  );
}
