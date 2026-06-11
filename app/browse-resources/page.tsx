"use client";

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BlurFade from "@/components/magicui/blur-fade";
import ReactMarkdown from 'react-markdown';


type Resource = {
  date: string;
  readTime: string;
  title: string;
  description: string;
  tags: string[];
  bgColor: string;
  syllabus: string;
};

const resources: Resource[] = [
  {
    date: '6/11/2024',
    readTime: '4 min read',
    title: 'JEE Mains Syllabus',
    description: 'Complete syllabus for JEE Mains including Physics, Chemistry, and Mathematics...',
    tags: ['JEE Mains'],
    bgColor: 'bg-blue-100',
    syllabus: `
      ## Physics
      - Units and Measurement
      - Kinematics
      - Laws of Motion
      - Work, Energy and Power
      - ... (more topics)
      
      ## Chemistry
      - Some Basic Concepts in Chemistry
      - States of Matter
      - Atomic Structure
      - Chemical Bonding and Molecular Structure
      - ... (more topics)
      
      ## Mathematics
      - Sets, Relations and Functions
      - Complex Numbers and Quadratic Equations
      - Matrices and Determinants
      - Mathematical Induction
      - ... (more topics)
    `,
  },
  {
    date: '6/11/2024',
    readTime: '6 min read',
    title: 'JEE Advanced Syllabus',
    description: 'Detailed syllabus for JEE Advanced with tips on important topics...',
    tags: ['JEE Advanced'],
    bgColor: 'bg-green-100',
    syllabus: `
      ## Physics
      - General Physics
      - Mechanics
      - Thermal Physics
      - Electricity and Magnetism
      - ... (more topics)
      
      ## Chemistry
      - Physical Chemistry
      - Inorganic Chemistry
      - Organic Chemistry
      - ... (more topics)
      
      ## Mathematics
      - Algebra
      - Trigonometry
      - Analytical Geometry
      - Differential Calculus
      - ... (more topics)
    `,
  },
  {
    date: '6/11/2024',
    readTime: '8 min read',
    title: 'CLAT Syllabus',
    description: 'Comprehensive syllabus for CLAT covering English, Logical Reasoning, Legal Aptitude...',
    tags: ['CLAT'],
    bgColor: 'bg-purple-100',
    syllabus: `
      ## English
      - Comprehension Passages
      - Grammar
      - Vocabulary
      - ... (more topics)
      
      ## Logical Reasoning
      - Series
      - Analogies
      - Logical Sequences
      - ... (more topics)
      
      ## Legal Aptitude
      - Indian Constitution
      - Legal Terms and Maxims
      - Important Legal Principles
      - ... (more topics)
    `,
  },
  {
    date: '6/11/2024',
    readTime: '4 min read',
    title: 'CAT Syllabus',
    description: 'Overview of CAT syllabus including Quantitative Aptitude, Data Interpretation, Logical Reasoning...',
    tags: ['CAT'],
    bgColor: 'bg-pink-100',
    syllabus: `
      ## Quantitative Aptitude
      - Number Systems
      - Arithmetic
      - Algebra
      - Geometry and Mensuration
      - ... (more topics)
      
      ## Data Interpretation
      - Data Tables
      - Charts and Graphs
      - Data Analysis
      - ... (more topics)
      
      ## Logical Reasoning
      - Puzzles
      - Arrangements
      - Logical Sequences
      - ... (more topics)
    `,
  },
  {
    date: '6/11/2024',
    readTime: '2 min read',
    title: 'UPSC Syllabus',
    description: 'Detailed UPSC syllabus for both Prelims and Mains examination...',
    tags: ['UPSC'],
    bgColor: 'bg-yellow-100',
    syllabus: `
      ## Prelims
      - General Studies Paper I
      - General Studies Paper II (CSAT)
      
      ## Mains
      - Essay
      - General Studies I
      - General Studies II
      - General Studies III
      - General Studies IV
      - Optional Subject
      - ... (more topics)
    `,
  },
];

const BrowseResources: NextPage = () => {
  return (
    <>
      <Head>
        <title>Browse Resources</title>
      </Head>
      <section id="resources">
        <div className="space-y-12 w-full py-12">
          <BlurFade>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                  Exam Resources
                </div>
                <h2 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
                  Explore Various Exams and Their Syllabi
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Find the detailed syllabus and resources for exams like JEE Mains, JEE Advanced, CLAT, CAT, and UPSC.
                </p>
              </div>
            </div>
          </BlurFade>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-[1200px] mx-auto">
            {resources.map((resource, index) => (
              <BlurFade key={index}>
                <Card className={`lg:max-w-md ${resource.bgColor}`}>
                  <CardHeader className="space-y-0 pb-2">
                    <CardDescription>{resource.date} • {resource.readTime}</CardDescription>
                    <CardTitle className="text-2xl font-bold">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{resource.description}</p>
                    <Separator />
                    <div className="my-4">
                      <ReactMarkdown>{resource.syllabus}</ReactMarkdown>
                    </div>
                    <Separator />
                    <div className="flex space-x-2 mt-4">
                      {resource.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-foreground text-background px-3 py-1 rounded-lg text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default BrowseResources;
