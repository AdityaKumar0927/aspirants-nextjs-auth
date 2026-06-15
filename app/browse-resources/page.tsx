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
import T from "@/components/i18n/T"


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
- Units, Measurement & Dimensions
- Kinematics
- Laws of Motion
- Work, Energy and Power
- Rotational Motion & System of Particles
- Gravitation
- Properties of Solids and Liquids
- Thermodynamics & Kinetic Theory of Gases
- Oscillations and Waves
- Electrostatics & Current Electricity
- Magnetic Effects of Current and Magnetism
- Electromagnetic Induction and Alternating Currents
- Electromagnetic Waves & Optics
- Dual Nature of Matter and Radiation
- Atoms and Nuclei
- Electronic Devices
- Experimental Skills

## Chemistry
- Some Basic Concepts in Chemistry
- Atomic Structure
- Chemical Bonding and Molecular Structure
- Chemical Thermodynamics
- Solutions & Equilibrium
- Redox Reactions and Electrochemistry
- Chemical Kinetics
- Classification of Elements and Periodicity
- p-, d- and f-Block Elements
- Coordination Compounds
- Basic Principles of Organic Chemistry
- Hydrocarbons & their Functional Groups
- Aldehydes, Ketones, Carboxylic Acids and Amines
- Biomolecules, Polymers & Chemistry in Everyday Life

## Mathematics
- Sets, Relations and Functions
- Complex Numbers and Quadratic Equations
- Matrices and Determinants
- Permutations, Combinations and Binomial Theorem
- Sequences and Series
- Limits, Continuity and Differentiability
- Integral Calculus & Differential Equations
- Coordinate Geometry (2D) and Three-Dimensional Geometry
- Vector Algebra
- Statistics and Probability
- Trigonometry
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
- General Physics (units, dimensions, error analysis, experiments)
- Mechanics (kinematics, Newton's laws, work-energy, rotation, gravitation, fluids, SHM)
- Thermal Physics (calorimetry, thermodynamics, kinetic theory)
- Electricity and Magnetism (electrostatics, capacitors, current, magnetism, EMI, AC)
- Optics (ray & wave optics)
- Modern Physics (photoelectric effect, atoms, nuclei, radioactivity)

## Chemistry
- Physical Chemistry (gaseous/liquid states, atomic structure, thermodynamics, equilibrium, electrochemistry, kinetics, solutions, surface chemistry)
- Inorganic Chemistry (periodicity, s-, p-, d-block, coordination compounds, metallurgy, qualitative analysis)
- Organic Chemistry (basic concepts, isomerism, reaction mechanisms, hydrocarbons, functional groups, biomolecules, polymers, practical organic chemistry)

## Mathematics
- Algebra (complex numbers, quadratic equations, sequences & series, permutations, binomial theorem, matrices, probability)
- Trigonometry (ratios, identities, inverse functions)
- Analytical Geometry (straight lines, circles, conics; 3D geometry)
- Differential Calculus (limits, continuity, differentiation, applications)
- Integral Calculus (definite & indefinite integrals, differential equations)
- Vectors
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
## English Language
- Comprehension of ~450-word passages
- Inference and conclusion from passages
- Vocabulary in context
- Grammar and summary

## Current Affairs & General Knowledge
- National and international events of significance
- Arts and culture
- Historical events of continuing importance
- Polity, economy and the environment in the news

## Legal Reasoning
- Identifying legal principles in passages
- Applying principles to fact situations
- Basics of contracts, torts and constitutional law

## Logical Reasoning
- Recognising arguments, premises and conclusions
- Inferences, analogies and relationships
- Syllogisms and identifying contradictions

## Quantitative Techniques
- Deriving information from short passages, graphs and tables
- Ratios and proportions, percentages
- Averages and basic algebra
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
## Verbal Ability & Reading Comprehension (VARC)
- Reading comprehension passages
- Para-jumbles and para-completion
- Para-summary
- Sentence correction and odd-sentence-out

## Data Interpretation & Logical Reasoning (DILR)
- Data tables, bar/line/pie charts and caselets
- Data sufficiency
- Seating arrangements and puzzles
- Venn diagrams, sets and logical sequences

## Quantitative Ability (QA)
- Number Systems
- Arithmetic (percentages, ratios, averages, time-speed-distance, interest)
- Algebra (equations, functions, inequalities)
- Geometry and Mensuration
- Modern Maths (permutations & combinations, probability, sequences)
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
## Prelims (objective, screening)
- **GS Paper I** — Current events; History of India & National Movement; Indian & World Geography; Polity & Governance; Economic & Social Development; Environment, Biodiversity & Climate Change; General Science
- **GS Paper II — CSAT** (qualifying) — Comprehension; Interpersonal & communication skills; Logical reasoning & analytical ability; Decision-making; Basic numeracy & data interpretation

## Mains (descriptive)
- **Essay**
- **GS-I** — Indian Heritage & Culture; History & Geography of the World and Society
- **GS-II** — Governance, Constitution, Polity, Social Justice & International Relations
- **GS-III** — Economy, Agriculture, Science & Technology, Environment, Security & Disaster Management
- **GS-IV** — Ethics, Integrity and Aptitude
- **Optional Subject** — two papers
- Two qualifying language papers (English + an Indian language)

## Interview
- Personality Test before the UPSC board
`,
  },
];

const BrowseResources: NextPage = () => {
  return (
    <>
      <Head>
        <title><T k="auto.browseResourcesPage.browseResources" /></title>
      </Head>
      <section id="resources">
        <div className="space-y-12 w-full px-4 py-12 sm:px-6 lg:px-8">
          <BlurFade>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
                  <T k="auto.browseResourcesPage.examResources" />
                </div>
                <h2 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem]">
                  <T k="auto.browseResourcesPage.exploreVariousExamsAndTheir" />
                </h2>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  <T k="auto.browseResourcesPage.findTheDetailedSyllabusAnd" />
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
