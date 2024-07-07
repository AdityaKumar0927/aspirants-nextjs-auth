"use client";

import { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import useMediaQuery from "@/lib/hooks/use-media-query";

export default function SidebarModal({
  children,
  className,
  showModal,
  setShowModal,
}: {
  children: React.ReactNode;
  className?: string;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { isMobile } = useMediaQuery();

  return (
    <Dialog.Root open={showModal} onOpenChange={setShowModal}>
      <Dialog.Portal>
        <Dialog.Overlay
          id="modal-backdrop"
          className="animate-fade-in fixed inset-0 z-40 bg-gray-100 bg-opacity-50 backdrop-blur-md"
          style={{ left: '5rem' }} // Adjusted to exclude the sidebar
        />
        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "animate-slide-in fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 h-auto w-full max-w-4xl border border-gray-200 bg-white p-0 shadow-xl md:rounded-2xl",
            className
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
