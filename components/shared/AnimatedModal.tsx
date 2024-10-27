"use client";

import { Dispatch, SetStateAction } from "react";
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
  return (
    <Dialog.Root open={showModal} onOpenChange={setShowModal}>
      <AnimatePresence>
        {showModal && (
          <Dialog.Portal forceMount>
            {/* Updated backdrop motion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            >
              <Dialog.Content asChild>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }} // Smooth transition for the modal
                  className={cn(
                    "relative max-h-[90%] w-8/12 overflow-hidden border border-gray-200 bg-white p-0 shadow-xl rounded-3xl"
                  )}
                >
                  <div className="h-full overflow-y-auto p-4">
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
