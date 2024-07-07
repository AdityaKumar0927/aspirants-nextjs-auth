"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggle }) => (
  <div className="border-b border-gray-200">
    <div 
      className="flex items-center justify-between cursor-pointer py-4"
      onClick={toggle}
    >
      <div className="flex items-center">
        <span className="text-3xl mr-4">{isOpen ? '-' : '+'}</span>
        <p className="text-xl">{question}</p>
      </div>
    </div>
    {isOpen && (
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        exit={{ height: 0 }}
        className="overflow-hidden"
      >
        <p className="text-gray-700 py-4">{answer}</p>
      </motion.div>
    )}
  </div>
);

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Is Aspirants completely free to use?',
      answer: 'Yes, Aspirants is entirely free to use. We believe in providing equal access to high-quality educational tools without any financial barriers.',
    },
    {
      question: 'How frequently is the Question Bank updated?',
      answer: 'The Question Bank on Aspirants is regularly updated to ensure relevance and comprehensiveness. New questions and updates are added periodically to align with exam patterns and syllabus changes.',
    },
    {
      question: 'How can I stay updated with Aspirants\' latest developments?',
      answer: 'You can subscribe to our newsletter to receive updates on new features, development highlights, topper tips, and more. The newsletter keeps you informed about everything happening at Aspirants.',
    },
    {
      question: 'How do I contact Aspirants?',
      answer: 'Please feel free to use our Contact Us page.',
    },
    {
      question: 'Can I contribute to Aspirants?',
      answer: 'Yes, we welcome contributions and suggestions from users. If you have feature ideas and feedback, you can submit your suggestions via our Suggest Feature page. If you wish to collaborate with us, please see our Work with Us page.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-6xl font-bold text-center mb-2">Got Questions?</h1>
      <h2 className="text-4xl font-normal text-center mb-8">We've got Answers!</h2>
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            toggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
