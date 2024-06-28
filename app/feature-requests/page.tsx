// pages/feature-requests.tsx
"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCaretUp, faComment, faFire } from "@fortawesome/free-solid-svg-icons";
import NewFeatureModal from "@/components/layout/NewFeatureModal";

const FeatureRequests = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: "Enable Dark Mode",
      description: "Implement a dark mode option for better night-time usability and to reduce eye strain.",
      votes: 150,
      status: "Suggested",
      comments: 20,
      tags: ["Suggested", "Popular"],
    },
    {
      id: 2,
      title: "Customizable Dashboards",
      description: "Allow users to customize their dashboard with widgets and layout options.",
      votes: 90,
      status: "Suggested",
      comments: 5,
      tags: ["Suggested"],
    },
    {
      id: 3,
      title: "Multi-Language Support",
      description: "Add support for multiple languages to cater to a global audience.",
      votes: 120,
      status: "Planned",
      comments: 10,
      tags: ["Planned", "Popular"],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: number]: boolean }>({});

  const addNewRequest = (title: string, description: string) => {
    setRequests([
      ...requests,
      {
        id: requests.length + 1,
        title,
        description,
        votes: 0,
        status: "Suggested",
        comments: 0,
        tags: ["Suggested"],
      },
    ]);
  };

  const handleVote = (id: number) => {
    if (!userVotes[id]) {
      setRequests(
        requests.map((request) =>
          request.id === id ? { ...request, votes: request.votes + 1 } : request
        )
      );
      setUserVotes({ ...userVotes, [id]: true });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement search functionality here
    // For now, just log the search term
    console.log(e.target.value);
  };

  return (
    <div className="bg-white w-full h-full border border-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-5 font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
          Feature Requests
        </h1>
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <input
              type="text"
              className="bg-white shadow rounded-full py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search"
              onChange={handleSearch}
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-3 top-2.5 text-gray-400"
            />
          </div>
          <button
            className="relative z-30 inline-flex items-center justify-center w-auto px-8 py-3 overflow-hidden font-bold text-gray-500 transition-all duration-500 border border-gray-200 rounded-md cursor-pointer group ease bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-white active:to-white"
            onClick={() => setShowModal(true)}
          >
            <span className="w-full h-0.5 absolute bottom-0 group-active:bg-transparent left-0 bg-gray-100"></span>
            <span className="h-full w-0.5 absolute bottom-0 group-active:bg-transparent right-0 bg-gray-100"></span>
            + New
          </button>
        </div>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-4 rounded-lg shadow transition duration-300 ease-in-out hover:shadow-lg hover:shadow-cyan-500/50"
            >
              <div className="flex items-start">
                <div className="text-center mr-4">
                  <FontAwesomeIcon
                    icon={faCaretUp}
                    className={`text-gray-400 hover:text-blue-500 cursor-pointer transition duration-300 ${userVotes[request.id] ? "text-blue-500" : ""}`}
                    onClick={() => handleVote(request.id)}
                  />
                  <div className="text-gray-700 font-semibold">
                    {request.votes}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{request.title}</h2>
                  <p className="text-gray-600">{request.description}</p>
                  <div className="flex items-center mt-2">
                    {request.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`bg-blue-100 text-blue-600 text-xs font-semibold rounded-full px-2 py-1 mr-2`}
                      >
                        {tag}{" "}
                        {tag === "Popular" && (
                          <FontAwesomeIcon
                            icon={faFire}
                            className="text-yellow-500 ml-1"
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faComment}
                    className="text-yellow-500"
                  />
                  <span className="ml-1 text-gray-600">
                    {request.comments} Comments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <NewFeatureModal
          showModal={showModal}
          setShowModal={setShowModal}
          addNewRequest={addNewRequest}
        />
      </div>
    </div>
  );
};

export default FeatureRequests;
