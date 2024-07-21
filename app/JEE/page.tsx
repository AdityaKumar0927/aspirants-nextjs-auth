"use client"

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@/components/shared/tooltip';
import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { ProjectCard } from "@/components/magicui/project-card";
import { DATA } from "@/components/data/resume";
import Link from "next/link";
import Markdown from "react-markdown";

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
  const addCourseToPlanner = (course: Resource) => {
    // Logic to add the course to the planner
    alert(`Course "${course.title}" added to planner!`);
  };

  return (
    <>
          <section id="projects">
        <div className="space-y-12 w-full py-12">
          <BlurFade>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                  My Projects
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Check out my latest work
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  I&apos;ve worked on a variety of projects, from simple
                  websites to complex web applications. Here are a few of my
                  favorites.
                </p>
              </div>
            </div>
          </BlurFade>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
            {DATA.projects.map((project, id) => (
              <BlurFade
                key={project.title}
              >
                <ProjectCard
                  href={project.href}
                  key={project.title}
                  title={project.title}
                  description={project.description}
                  dates={project.dates}
                  tags={project.technologies}
                  image={project.image}
                  video={project.video}
                  links={project.links}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default BrowseResources;
