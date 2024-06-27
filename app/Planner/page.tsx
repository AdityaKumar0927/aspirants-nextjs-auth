"use client"

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faTasks, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faApple } from '@fortawesome/free-brands-svg-icons';
import Modal from '@/components/shared/modal';
import Popover from '@/components/shared/popover';

const Planner = () => {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  const handleNewGoal = () => {
    setShowNewGoalModal(true);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center py-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900">Academic Planner</h1>
        <button
          className="text-white bg-black px-4 py-2 rounded-md flex items-center"
          onClick={handleNewGoal}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          New Goal
        </button>
      </header>
      <main className="w-full max-w-4xl mx-auto mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faCalendar} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            <p className="text-gray-600">No upcoming events</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faTasks} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">To-Do List</h2>
            </div>
            <p className="text-gray-600">No tasks assigned</p>
          </div>
        </div>
      </main>
      <Modal showModal={showNewGoalModal} setShowModal={setShowNewGoalModal}>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">New Academic Goal</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="goalTitle" className="block text-gray-700 font-semibold mb-2">
                Goal Title
              </label>
              <input
                type="text"
                id="goalTitle"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your goal title"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="goalDescription" className="block text-gray-700 font-semibold mb-2">
                Description
              </label>
              <textarea
                id="goalDescription"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your goal description"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Planner;
