"use client";
 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
 
const faqs = [
  {
    section: "General",
    qa: [
      {
        question: "What is aspirants?",
        answer: (
          <span>
            aspirants is an online platform designed to help students and professionals prepare for competitive exams with comprehensive resources, practice tests, and interactive features.
          </span>
        ),
      },
      {
        question: "How can I get started with aspirants?",
        answer: (
          <span>
            To get started, simply create an account on our website, explore our available resources, and start practicing with our tailored study materials and tests.
          </span>
        ),
      },
    ],
  },
  {
    section: "Support",
    qa: [
      {
        question: "Does aspirants offer technical support?",
        answer: (
          <span>
            Yes, aspirants provides technical support through our help center and customer support email. You can also find answers to common issues in our FAQ section.
          </span>
        ),
      },
    ],
  },
  {
    section: "Customization",
    qa: [
      {
        question: "Can I customize my study plan on aspirants?",
        answer: (
          <span>
            Absolutely! aspirants allows you to customize your study plan based on your specific goals and timelines. You can track your progress and adjust your plan as needed.
          </span>
        ),
      },
    ],
  },
  {
    section: "Integration",
    qa: [
      {
        question: "Can I integrate aspirants with other tools?",
        answer: (
          <span>
            Currently, aspirants is a standalone platform, but we are working on integrating with other popular tools and apps to enhance your study experience. Stay tuned for updates!
          </span>
        ),
      },
    ],
  },
];
 
export function FAQ() {
  return (
    <section id="faq">
      <div className="py-14">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
              Still Got Questions? 
            </h2>
            <p className="mt-6 text-xl leading-8 text-black/80">
              we&apos;ve got answers
            </p>
          </div>
          <div className="container mx-auto my-12 max-w-[1600px] space-y-12">
            {faqs.map((faq, idx) => (
              <section key={idx} id={"faq-" + faq.section}>
                <h2 className="mb-4 text-left text-base font-semibold tracking-tight text-foreground/60">
                  {faq.section}
                </h2>
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-[1000px] flex-col items-center justify-center"
                >
                  {faq.qa.map((faq, idx) => (
                    <AccordionItem
                      key={idx}
                      value={faq.question}
                      className="w-full max-w-[600px]"
                    >
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>
          <h4 className="mb-12 text-center text-sm font-medium tracking-tight text-foreground/80">
            Still have questions? Email us at{" "}
            <a href="mailto:support@example.com" className="underline">
              contactus@aspirants.tech
            </a>
          </h4>
        </div>
      </div>
    </section>
  );
}
