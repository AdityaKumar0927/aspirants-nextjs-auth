"use client";

import React from "react";
import Modal from "@/components/shared/modal";

interface DashboardModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ showModal, setShowModal }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <Modal showModal={showModal} setShowModal={setShowModal} className="w-full max-w-7xl h-5/6">
          <div className="flex flex-col justify-center mx-auto w-full max-w-7xl bg-white rounded-3xl p-8 shadow-lg">
            <div className="container mx-auto p-4">
              <header className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
                    <i className="fas fa-cube"></i>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Welcome, Kristin</h1>
                    <p className="text-sm text-gray-500">Your personal dashboard overview</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center mr-4">
                    <i className="fas fa-search text-gray-400 mr-2"></i>
                    <input type="text" placeholder="Search" className="bg-transparent outline-none" />
                  </div>
                  <i className="far fa-user-circle text-2xl text-gray-600 mr-4"></i>
                  <h2 className="text-lg font-semibold mr-4">My meetings</h2>
                  <i className="far fa-calendar-alt text-2xl text-gray-600"></i>
                </div>
              </header>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">Profile</h3>
                        <i className="fas fa-sync-alt text-gray-400"></i>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative mb-2">
                          <img
                            src="https://placehold.co/100x100"
                            alt="Profile picture of a woman with straight dark hair and bangs against a coral background"
                            className="rounded-full w-24 h-24 object-cover"
                          />
                          <div className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                            <i className="fas fa-plus text-xs"></i>
                          </div>
                        </div>
                        <h4 className="text-lg font-semibold">Kristin Watson</h4>
                        <p className="text-sm text-gray-500 mb-4">Design Manager</p>
                        <div className="flex justify-between w-full">
                          <div className="text-center">
                            <i className="fas fa-users text-orange-500"></i>
                            <p className="text-sm font-semibold">11</p>
                          </div>
                          <div className="text-center">
                            <i className="fas fa-comment-alt text-red-500"></i>
                            <p className="text-sm font-semibold">56</p>
                          </div>
                          <div className="text-center">
                            <i className="fas fa-trophy text-yellow-500"></i>
                            <p className="text-sm font-semibold">12</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-rows-2 gap-6">
                      <div className="bg-gradient-to-br from-purple-200 to-red-200 rounded-xl p-6 shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold">Prioritized tasks</h3>
                          <i className="fas fa-clock text-gray-600"></i>
                        </div>
                        <p className="text-5xl font-bold mb-2">83%</p>
                        <p className="text-sm text-gray-600">Avg. Completed</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-200 to-green-200 rounded-xl p-6 shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold">Additional tasks</h3>
                          <i className="fas fa-check-circle text-gray-600"></i>
                        </div>
                        <p className="text-5xl font-bold mb-2">56%</p>
                        <p className="text-sm text-gray-600">Avg. Completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Trackers connected</h3>
                        <p className="text-sm text-gray-500">3 active connections</p>
                      </div>
                      <div className="flex items-center">
                        <img
                          src="https://placehold.co/30x30"
                          alt="Figma logo"
                          className="w-8 h-8 rounded mr-2"
                        />
                        <img
                          src="https://placehold.co/30x30"
                          alt="Trello logo"
                          className="w-8 h-8 rounded mr-2"
                        />
                        <img
                          src="https://placehold.co/30x30"
                          alt="Google Meet logo"
                          className="w-8 h-8 rounded mr-2"
                        />
                        <i className="fas fa-ellipsis-h text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold">Focusing</h3>
                        <p className="text-sm text-gray-500">Productivity analytics</p>
                      </div>
                      <select className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                        <option>Range: Last month</option>
                      </select>
                    </div>
                    <div className="relative h-64 mb-4">
                      {/* Placeholder for the graph */}
                      <div className="absolute top-1/4 right-1/4 bg-white rounded-lg shadow px-3 py-2">
                        <p className="text-sm font-semibold">Week 8</p>
                        <p className="text-xs text-gray-500">Unbalanced</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                        <p className="text-sm">Maximum of focus</p>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                        <p className="text-sm">Min or lack of focus</p>
                      </div>
                      <p className="text-3xl font-bold">41%</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-white rounded-xl p-6 shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">My meetings</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Tue, 11 Jul</p>
                          <p className="font-semibold">08:15 am</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Quick Daily Meeting</p>
                          <p className="text-sm text-blue-500">Zoom</p>
                        </div>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Tue, 11 Jul</p>
                          <p className="font-semibold">09:30 pm</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">John Onboarding</p>
                          <p className="text-sm text-green-500">Google Meet</p>
                        </div>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Tue, 12 Jul</p>
                          <p className="font-semibold">02:30 pm</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Call With a New Team</p>
                          <p className="text-sm text-green-500">Google Meet</p>
                        </div>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Tue, 15 Jul</p>
                          <p className="font-semibold">04:00 pm</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Lead Designers Event</p>
                          <p className="text-sm text-blue-500">Zoom</p>
                        </div>
                        <i className="fas fa-chevron-right text-gray-400"></i>
                      </div>
                    </div>
                    <a href="#" className="text-blue-500 text-sm font-semibold block mt-4">
                      See all meetings
                    </a>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow">
                    <h3 className="text-lg font-semibold mb-2">Developed areas</h3>
                    <p className="text-sm text-gray-500 mb-4">Most common areas of interests</p>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold">Sport Skills</span>
                          <span className="text-sm font-semibold">71%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "71%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold">Blogging</span>
                          <span className="text-sm font-semibold">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "92%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold">Leadership</span>
                          <span className="text-sm font-semibold">33%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "33%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold">Meditation</span>
                          <span className="text-sm font-semibold">56%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "56%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold">Philosophy</span>
                          <span className="text-sm font-semibold">79%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "79%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DashboardModal;
