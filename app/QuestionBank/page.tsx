"use client"; // Add this directive at the top

import React from 'react';

interface SidebarProps {
  onSettingsClick: () => void;
  onUserDashboardClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick, onUserDashboardClick }) => {
  return (
    <aside className="w-64 bg-white h-screen p-4">
      <nav>
        <ul>
          <div className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <i className="fas fa-laptop text-gray-500 mr-2"></i>
              <div className="text-purple-600"><span>MyStats</span></div>
            </button>
          </div>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onSettingsClick}>
              <i className="fas fa-cog text-gray-500 mr-2"></i>
              <span>Settings</span>
            </button>
          </li>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <i className="fas fa-star text-yellow-500 mr-2"></i>
              <span>Review</span>
            </button>
          </li>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <i className="fas fa-file-alt text-gray-500 mr-2"></i>
              <span>Mock Exam</span>
            </button>
          </li>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <i className="fas fa-chalkboard-teacher text-gray-500 mr-2"></i>
              <span>Doubts</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
          <p>Convert PDFs to Question Banks for free!</p>
          <button className="mt-2 bg-white text-purple-500 px-4 py-2 rounded-lg">Try Now</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
