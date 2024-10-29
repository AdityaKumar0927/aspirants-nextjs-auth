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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 flex items-center justify-center backdrop-blur-md"
            >
              <Dialog.Content asChild>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "relative max-h-[90%] w-8/12 overflow-hidden border border-gray-200 bg-white shadow-xl rounded-3xl"
                  )}
                >
                  {/* Scrollable Content */}
                  <div className="h-full max-h-[80vh] overflow-y-auto p-4">
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
