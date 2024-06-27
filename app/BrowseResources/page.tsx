import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

type Tag = {
  name: string;
  link?: string;
};

type Resource = {
  date: string;
  readTime: string;
  title: string;
  description: string;
  tags: string[];
  bgColor: string;
};

const tags: Tag[] = [
  { name: 'Mathematics', link: '/Mathematics' },
  { name: 'Physics', link: '/physics' },
  { name: 'Chemistry', link: '/chemistry' },
  { name: 'Biology', link: '/biology' },
  { name: 'Computer Science', link: '/computer-science' },
  { name: 'Engineering', link: '/engineering' },
  { name: 'Astronomy', link: '/astronomy' },
  { name: 'Geology', link: '/geology' },
  { name: 'Statistics', link: '/statistics' },
  { name: 'Environmental Science', link: '/environmental-science' },
];

const resources: Resource[] = [
  {
    date: '6/11/2024',
    readTime: '4 min read',
    title: 'Mastering Calculus: A Comprehensive Guide',
    description: 'Dive into the fundamentals of Calculus with our comprehensive guide. Learn concepts, solve problems...',
    tags: ['Mathematics'],
    bgColor: 'bg-blue-100',
  },
  {
    date: '6/11/2024',
    readTime: '6 min read',
    title: 'Understanding Quantum Mechanics',
    description: 'Explore the fascinating world of Quantum Mechanics. Understand the principles and theories that...',
    tags: ['Physics'],
    bgColor: 'bg-green-100',
  },
  {
    date: '6/11/2024',
    readTime: '8 min read',
    title: 'Organic Chemistry: Reactions and Mechanisms',
    description: 'Learn about the various reactions and mechanisms in Organic Chemistry. This guide covers...',
    tags: ['Chemistry'],
    bgColor: 'bg-purple-100',
  },
  {
    date: '6/11/2024',
    readTime: '4 min read',
    title: 'Genetics: The Blueprint of Life',
    description: 'Understand the basics of Genetics, including DNA structure, gene expression, and inheritance...',
    tags: ['Biology'],
    bgColor: 'bg-pink-100',
  },
  {
    date: '6/11/2024',
    readTime: '2 min read',
    title: 'Introduction to Programming with Python',
    description: 'Start your programming journey with Python. Learn syntax, control structures, and basic algorithms...',
    tags: ['Computer Science'],
    bgColor: 'bg-yellow-100',
  },
  {
    date: '6/1/2024',
    readTime: '8 min read',
    title: 'Engineering Principles: From Theory to Practice',
    description: 'Explore the core principles of engineering and see how they are applied in real-world scenarios...',
    tags: ['Engineering'],
    bgColor: 'bg-orange-100',
  },
  {
    date: '6/1/2024',
    readTime: '5 min read',
    title: 'Astronomy 101: Exploring the Universe',
    description: 'Take a journey through the cosmos with our introductory guide to Astronomy. Learn about stars, planets...',
    tags: ['Astronomy'],
    bgColor: 'bg-teal-100',
  },
  {
    date: '6/1/2024',
    readTime: '7 min read',
    title: 'Geology: The Science of Earth',
    description: 'Discover the science behind Earth\'s formation, structure, and the processes that shape our planet...',
    tags: ['Geology'],
    bgColor: 'bg-red-100',
  },
  {
    date: '6/1/2024',
    readTime: '3 min read',
    title: 'Statistics for Data Science',
    description: 'Learn the essential statistical methods used in data science. This guide covers probability, distributions...',
    tags: ['Statistics'],
    bgColor: 'bg-indigo-100',
  },
  {
    date: '6/1/2024',
    readTime: '6 min read',
    title: 'Environmental Science: Understanding Our Planet',
    description: 'Explore the key concepts of Environmental Science and understand the impact of human activities on...',
    tags: ['Environmental Science'],
    bgColor: 'bg-lime-100',
  },
];

const generateLink = (tagName: string): string => {
  if (tagName === 'Mathematics') {
    return '/Mathematics';
  }
  return `/${tagName.toLowerCase().replace(/\s+/g, '-')}`;
};

const BrowseResources: NextPage = () => {
  return (
    <>
      <Head>
        <title>Browse Resources</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
      </Head>
      <div className="text-gray-900 bg-white w-full h-full border-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">Browse Resources</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <Link key={tag.name} href={tag.link ?? generateLink(tag.name)} legacyBehavior>
                <a className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">{tag.name}</a>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <div key={index} className={`relative inline-block font-medium group p-6 rounded-lg ${resource.bgColor}`}>
                <span className="absolute inset-0 w-full h-full transition duration-400 ease-out transform translate-x-1 translate-y-1 bg-indigo-600 group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                <span className="absolute inset-0 w-full h-full bg-white border border-indigo-600 group-hover:bg-indigo-50"></span>
                <span className="relative">
                  <p className="text-sm text-gray-600 mb-2">{resource.date} · {resource.readTime}</p>
                  <h2 className="text-xl font-semibold mb-2">{resource.title}</h2>
                  <p className="text-gray-700 mb-4">{resource.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <Link key={tag} href={generateLink(tag)} legacyBehavior>
                        <a className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border">{tag}</a>
                      </Link>
                    ))}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BrowseResources;
