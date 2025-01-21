"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    section: "General",
    qa: [
      {
        question: "What is aspirants?",
        answer: "aspirants is an online platform designed to help students and professionals prepare for competitive exams with comprehensive resources, practice tests, and interactive features.",
      },
      {
        question: "How can I get started with aspirants?",
        answer: "To get started, simply create an account on our website, explore our available resources, and start practicing with our tailored study materials and tests.",
      },
    ],
  },
  {
    section: "Support",
    qa: [
      {
        question: "Does aspirants offer technical support?",
        answer: "Yes, aspirants provides technical support through our help center and customer support email. You can also find answers to common issues in our FAQ section.",
      },
    ],
  },
  {
    section: "Customization",
    qa: [
      {
        question: "Can I customize my study plan on aspirants?",
        answer: "aspirants allows you to customize your study plan based on your specific goals and timelines. You can track your progress and adjust your plan as needed.",
      },
    ],
  },
  {
    section: "Integration",
    qa: [
      {
        question: "Can I integrate aspirants with other tools?",
        answer: "Currently, aspirants is a standalone platform, but we are working on integrating with other popular tools and apps to enhance your study experience. Stay tuned for updates!",
      },
    ],
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-16 bg-white dark:bg-dark-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-light tracking-tight text-center mb-2 text-black dark:text-white">
          Still Got Questions?
        </h2>
        <p className="text-lg text-center text-gray-500 dark:text-gray-400 mb-12 tracking-tight">
          We&apos;ve got answers
        </p>
        
        {faqs.map((faq, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-lg font-normal text-gray-400 dark:text-gray-500 mb-4 tracking-tight">
              {faq.section}
            </h3>
            <Accordion type="single" collapsible className="border-t border-gray-100 dark:border-gray-800">
              {faq.qa.map((item, itemIdx) => (
                <AccordionItem key={itemIdx} value={item.question} className="border-b border-gray-100 dark:border-gray-800">
                  <AccordionTrigger className="text-left py-4 hover:no-underline font-light tracking-tight text-black dark:text-white">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="py-4 text-gray-500 dark:text-gray-400 font-light tracking-tight">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
        
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-12 tracking-tight">
          Still have questions? Email us at{" "}
          <a href="mailto:contactus@aspirants.tech" className="text-blue-500 hover:underline">
            contactus@aspirants.tech
          </a>
        </p>
      </div>
    </section>
  )
}

