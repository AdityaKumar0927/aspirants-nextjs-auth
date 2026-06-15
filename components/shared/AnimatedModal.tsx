"use client";

import { Dispatch, SetStateAction, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";

export default function AnimatedModal({
  children,
  showModal,
  setShowModal,
}: {
  children: React.ReactNode;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
  // Prevent body from scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = ""; // Clean up on unmount
    };
  }, [showModal]);

  return (
    <Dialog.Root open={showModal} onOpenChange={setShowModal}>
      <AnimatePresence>
        {showModal && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 flex items-center justify-center bg-ink/10 p-4 backdrop-blur-md"
            >
              <Dialog.Content asChild>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "relative w-full max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] h-[90vh] sm:h-[85vh] overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_20px_60px_rgba(15,18,35,0.25)]"
                  )}
                >
                  {/* Accessible title required by Radix Dialog; visually hidden. */}
                  <Dialog.Title className="sr-only">Dialog</Dialog.Title>
                  {/* Scrollable Content */}
                  <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8">
                    {children}
                  </div>
                </motion.div>
              </Dialog.Content>
            </motion.div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}