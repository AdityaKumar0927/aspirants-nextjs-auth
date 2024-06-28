// components/shared/WorkInProgressModal.tsx
import Modal from "@/components/shared/modal";
import { useState, Dispatch, SetStateAction } from "react";
import Image from "next/image";

const WorkInProgressModal = ({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <Modal showModal={showModal} setShowModal={setShowModal}>
      <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
          <a href="https://aspirants.tech">
            <Image
              src="/bulb.svg"
              alt="Logo"
              className="h-10 w-10 rounded-full"
              width={20}
              height={20}
            />
          </a>
          <h3 className="font-display text-2xl font-bold">Work in Progress</h3>
          <p className="text-sm text-gray-500">
            This site is a work in progress. Some features may not work as expected.
          </p>
        </div>
        <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
          <button
            className="border border-gray-200 bg-white text-black hover:bg-gray-50"
            onClick={() => setShowModal(false)}
          >
            <p className="font-display text-gray-400">Got it!</p>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkInProgressModal;
