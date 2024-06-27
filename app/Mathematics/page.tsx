"use client";

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';

const chapters = [
  {
    name: "Calculus",
    subtopics: [
      { name: "Limits", link: "/Limits" },
      { name: "Derivatives", link: "/mathematics/derivatives" },
      { name: "Integrals", link: "/mathematics/integrals" },
      { name: "Differential Equations", link: "/mathematics/differential-equations" },
    ],
  },
  {
    name: "Algebra",
    subtopics: [
      { name: "Linear Equations", link: "/mathematics/linear-equations" },
      { name: "Quadratic Equations", link: "/mathematics/quadratic-equations" },
      { name: "Polynomials", link: "/mathematics/polynomials" },
      { name: "Matrices", link: "/mathematics/matrices" },
    ],
  },
  {
    name: "Geometry",
    subtopics: [
      { name: "Triangles", link: "/mathematics/triangles" },
      { name: "Circles", link: "/mathematics/circles" },
      { name: "Conic Sections", link: "/mathematics/conic-sections" },
      { name: "Coordinate Geometry", link: "/mathematics/coordinate-geometry" },
    ],
  },
  {
    name: "Trigonometry",
    subtopics: [
      { name: "Trigonometric Functions", link: "/mathematics/trigonometric-functions" },
      { name: "Identities", link: "/mathematics/identities" },
      { name: "Equations", link: "/mathematics/equations" },
      { name: "Applications", link: "/mathematics/applications" },
    ],
  },
  {
    name: "Statistics",
    subtopics: [
      { name: "Probability", link: "/mathematics/probability" },
      { name: "Descriptive Statistics", link: "/mathematics/descriptive-statistics" },
      { name: "Inferential Statistics", link: "/mathematics/inferential-statistics" },
      { name: "Regression", link: "/mathematics/regression" },
    ],
  },
];

const Mathematics: NextPage = () => {
  return (
    <>
      <Head>
        <title>Mathematics</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
      </Head>
      <div className="h-full w-full max-w-7xl mx-auto p-6 text-gray-900">
        <div className="text-sm text-gray-500 mb-2">Browse &gt; Mathematics</div>
        <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">Mathematics</h1>
        <div className="flex space-x-4 mb-4">
          <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded">
            <i className="fas fa-check-circle"></i>
            <span>0</span>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded">
            <i className="fas fa-bookmark"></i>
            <span>0</span>
            <span>Saved</span>
          </div>
        </div>
        <div className="bg-blue-100 text-blue-700 p-4 rounded mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-bold">Need some exam-style practice?</h2>
              <p>Get questions from the topics you struggle with instantly.</p>
            </div>
            <div className="flex-shrink-0">
              <Image src="/path/to/your/image.jpg" alt="Cartoon character with headband" width={50} height={50} className="w-12 h-12" />
            </div>
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Generate Math Mock Exam</button>
        </div>
        {chapters.map((chapter, index) => (
          <Disclosure key={index} as="div" className="mb-4">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex justify-between items-center w-full p-4 bg-gray-100 text-left rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                  <span className="text-xl font-semibold">{chapter.name}</span>
                  {open ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                </Disclosure.Button>
                <Disclosure.Panel className="p-4 bg-gray-50">
                  <ul className="space-y-2">
                    {chapter.subtopics.map((subtopic, idx) => (
                      <li key={idx}>
                        <Link href={subtopic.link} legacyBehavior>
                          <a className="text-lg text-blue-600 hover:underline">{subtopic.name}</a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </>
  );
};

export default Mathematics;
