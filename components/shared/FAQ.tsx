"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useSiteName } from "@/components/i18n/i18n"

const faqs = [
  {
    section: "Getting started",
    qa: [
      {
        question: "What is {{siteName}}?",
        answer:
          "{{siteName}} is a study platform for Indian competitive exams — JEE, NEET, GATE, UPSC and more. You get a large bank of past-paper questions, full-length mock exams, study notes and progress tracking in one place.",
      },
      {
        question: "How do I get started?",
        answer:
          "Sign in with Google, tell us your date of birth and accept the consent notice, and you're in. Head to the question bank to start practising, or take a mock exam to benchmark yourself.",
      },
      {
        question: "Is it free?",
        answer:
          "The core question bank and practice tools are free to use. Sign in to save your progress, notes and mock-exam attempts.",
      },
    ],
  },
  {
    section: "Practising",
    qa: [
      {
        question: "Can I tailor my practice?",
        answer:
          "Yes. Filter questions by exam, subject, topic, year, difficulty and type, mark questions for review, and track what you've completed. Your progress and notes are saved to your account.",
      },
      {
        question: "How do mock exams work?",
        answer:
          "Pick an exam, year and shift, then sit a timed paper in a CBT-style interface with an answer sheet and review flags. At the end you get a scorecard with a topic-by-topic breakdown.",
      },
    ],
  },
  {
    section: "Your data",
    qa: [
      {
        question: "How is my data handled?",
        answer:
          "We follow India's Digital Personal Data Protection Act. You can download your data, manage your consents, or request erasure any time from Settings → Privacy & Data.",
      },
    ],
  },
]

export function FAQ() {
  const siteName = useSiteName()
  const fill = (s: string) => s.replaceAll("{{siteName}}", siteName)
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="container mx-auto grid max-w-5xl gap-12 px-4 lg:grid-cols-[2fr,3fr] lg:gap-16">
        {/* Left rail — heading + contact CTA. NOT sticky: it should scroll with
            the page, not follow the viewport past the questions column. */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-tight text-black dark:text-white sm:text-4xl">
            Still got questions?
          </h2>
          <p className="mt-3 text-base font-light tracking-tight text-gray-500 dark:text-gray-400">
            Everything you need to know about practising on {siteName}. Can&apos;t
            find your answer?
          </p>
          <a
            href="mailto:aspirants.contact@gmail.com"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Email us
          </a>
        </div>

        {/* Right — grouped questions */}
        <div className="space-y-10">
          {faqs.map((faq) => (
            <div key={faq.section}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                {faq.section}
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {faq.qa.map((item) => (
                  <AccordionItem
                    key={item.question}
                    value={item.question}
                    className="border-b border-gray-200 dark:border-gray-800"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-normal tracking-tight text-black hover:no-underline dark:text-white">
                      {fill(item.question)}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] font-light leading-relaxed tracking-tight text-gray-600 dark:text-gray-400">
                      {fill(item.answer)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
