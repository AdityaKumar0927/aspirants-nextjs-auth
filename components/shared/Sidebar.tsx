"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLaptop, faStar, faFileAlt, faChalkboardTeacher, faTimes } from "@fortawesome/free-solid-svg-icons";

interface SidebarProps {
  onSettingsClick: () => void;
  onUserDashboardClick: () => void;
  onCloseSidebar: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick, onUserDashboardClick, onCloseSidebar, className }) => {
  return (
    <aside className={`w-64 bg-white h-screen p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
      </div>
      <nav>
        <ul>
          <div className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <FontAwesomeIcon icon={faLaptop} className="text-gray-500 mr-2" />
              <div className="text-purple-600"><span>MyStats</span></div>
            </button>
          </div>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <FontAwesomeIcon icon={faStar} className="text-yellow-500 mr-2" />
              <span>Review</span>
            </button>
          </li>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <FontAwesomeIcon icon={faFileAlt} className="text-gray-500 mr-2" />
              <span>Mock Exam</span>
            </button>
          </li>
          <li className="mb-4">
            <button className="flex items-center p-2" onClick={onUserDashboardClick}>
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-gray-500 mr-2" />
              <span>Doubts</span>
            </button>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
          <p>Convert PDFs to Question Banks for free!</p>
          <button className="mt-2 bg-white text-purple-500 px-4 py-2 rounded-lg" onClick={() => alert("Coming soon!")}>
            Try Now
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
