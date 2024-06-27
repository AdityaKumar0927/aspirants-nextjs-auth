"use client"
// pages/feature-requests.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCaretUp, faComment, faFire } from '@fortawesome/free-solid-svg-icons';

const FeatureRequests = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: 'Create an option to have topics ordered by new syllabus. Physics',
      description: 'For May 2025, the physics syllabus has changed. Of course, most of the...',
      votes: 110,
      status: 'Suggested',
      comments: 11,
      tags: ['Suggested', 'Popular'],
    },
    {
      id: 2,
      title: 'May 2023',
      description: 'Add questions from the May 2023 examinations for the science subjects!!!',
      votes: 46,
      status: 'Suggested',
      comments: 1,
      tags: ['Suggested', 'Popular'],
    },
    {
      id: 3,
      title: 'Can questions be labelled with: which year they are from, what time zone and paper #',
      description: 'I was hoping that when you have the questions from past papers for any...',
      votes: 40,
      status: 'Suggested',
      comments: 0,
      tags: ['Suggested', 'Popular'],
    },
  ]);

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mt-8">Feature Requests</h1>
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full shadow flex">
            <button className="px-4 py-2 text-sm font-semibold text-gray-700">Pending <span className="bg-blue-100 text-blue-600 rounded-full px-2 py-1 ml-1">91</span></button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-700">In Review <span className="bg-blue-100 text-blue-600 rounded-full px-2 py-1 ml-1">1</span></button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-700">Planned <span className="bg-blue-100 text-blue-600 rounded-full px-2 py-1 ml-1">2</span></button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-700">In Progress <span className="bg-green-100 text-green-600 rounded-full px-2 py-1 ml-1">1</span></button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-700">Completed <span className="bg-red-100 text-red-600 rounded-full px-2 py-1 ml-1">7</span></button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <input type="text" className="bg-white shadow rounded-full py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search" />
            <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          <button className="bg-blue-600 text-white rounded-full px-4 py-2 font-semibold">+ New</button>
        </div>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-start">
                <div className="text-center mr-4">
                  <FontAwesomeIcon icon={faCaretUp} className="text-gray-400" />
                  <div className="text-gray-700 font-semibold">{request.votes}</div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{request.title}</h2>
                  <p className="text-gray-600">{request.description}</p>
                  <div className="flex items-center mt-2">
                    {request.tags.map((tag, index) => (
                      <span key={index} className={`bg-blue-100 text-blue-600 text-xs font-semibold rounded-full px-2 py-1 mr-2`}>
                        {tag} {tag === 'Popular' && <FontAwesomeIcon icon={faFire} className="text-yellow-500 ml-1" />}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faComment} className="text-yellow-500" />
                  <span className="ml-1 text-gray-600">{request.comments} Comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureRequests;
