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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }} // Quick transition for the overlay
              className="fixed inset-0 z-30 bg-gray-100 bg-opacity-50"
            />
            <Dialog.Content asChild>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }} // Quick transition for the modal
                className={cn(
                  "fixed inset-0 z-40 m-auto max-h-[90%] w-8/12 overflow-hidden border border-gray-200 bg-white p-0 shadow-xl rounded-3xl"
                )}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
