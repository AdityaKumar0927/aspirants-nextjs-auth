import React from "react";

const RemindersApp: React.FC = () => {
  return (
    <div className="p-4 max-h-screen overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-orange-400">Reminders</h1>
        <div className="text-gray-400 mt-4 md:mt-0">Edit</div>
      </div>
      <div className="w-full">
        <div className="mb-4">
          <div className="bg-white rounded-lg p-2 mb-2">
            <input type="text" placeholder="Search" className="w-full bg-gray-100 rounded p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-blue-500 text-2xl font-bold">0</div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-red-500 text-2xl font-bold">0</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-black text-2xl font-bold">1</div>
              <div className="text-xs text-gray-500">All</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-gray-400 text-2xl font-bold"><i className="fas fa-check"></i></div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <div className="bg-gray-300 rounded-full p-1 mr-2">
              <i className="fas fa-plus text-gray-600"></i>
            </div>
            <div>
              <div className="font-bold">Get More From Reminders</div>
              <div className="text-xs text-gray-500">To use all the latest features, tap Update.</div>
            </div>
          </div>
          <button className="text-blue-500 text-sm">Update Reminders</button>
        </div>
        <div className="mb-4">
          <h2 className="font-bold mb-2">My Lists</h2>
          <div className="bg-gray-300 rounded-lg p-2 flex items-center">
            <div className="bg-orange-400 rounded p-1 mr-2">
              <i className="fas fa-list-ul text-white"></i>
            </div>
            <span>Reminders</span>
            <span className="ml-auto">1</span>
          </div>
        </div>
        <div className="mt-auto">
          <button className="text-blue-500 mr-4">Add List</button>
          <button className="bg-orange-400 text-white px-4 py-2 rounded-full">
            <i className="fas fa-plus mr-2"></i>New Reminder
          </button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-orange-400">Reminders</h1>
          <div className="text-gray-400">Edit</div>
        </div>
        <div className="bg-white rounded-lg p-4 flex items-center">
          <input type="checkbox" className="mr-4" />
          <span>Skype Audio Palakh khetrapal - Palakh khetrapal, Saugata Ghosh</span>
          <button className="ml-auto bg-blue-500 text-white px-3 py-1 rounded text-sm">Soon</button>
        </div>
      </div>
    </div>
  );
};

export default RemindersApp;
