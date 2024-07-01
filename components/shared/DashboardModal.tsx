"use client";

import React from "react";
import Modal from "@/components/shared/modal";

interface DashboardModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ showModal, setShowModal }) => {
  return (
    <Modal showModal={showModal} setShowModal={setShowModal}>
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">My Stuff</h1>
        <div className="flex space-x-2 mb-6">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-full">All</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full">Saved</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full">Flashcards</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full">Collections</button>
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold flex items-center">
              <i className="fas fa-folder-open mr-2"></i> My Flashcards
            </h2>
            <button className="text-gray-500">View all</button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
            <i className="fas fa-plus mr-2"></i> Create deck
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold flex items-center">
              <i className="fas fa-folder-open mr-2"></i> My Collections
            </h2>
            <button className="text-gray-500">View all</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              <i className="fas fa-plus mr-2"></i> Create collection
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold">Biology Mock Exam</h3>
              <p className="text-gray-500">Created by Aditya Kumar</p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold">Biology Mock Exam</h3>
              <p className="text-gray-500">Created by Aditya Kumar</p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold">Physics Mock Exam</h3>
              <p className="text-gray-500">From topics Topic 1 - Measurements and...</p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold">SEHS Mock Exam</h3>
              <p className="text-gray-500">From topics</p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold">Psychology Mock Exam</h3>
              <p className="text-gray-500">From topics</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DashboardModal;
