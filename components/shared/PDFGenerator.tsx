import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
}

interface PDFGeneratorProps {
  questions: QuestionType[];
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ questions }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    // Set document properties
    doc.setProperties({
      title: "Exam Paper",
      subject: "Generated Exam Paper",
      author: "Exam Generator",
      keywords: "exam, paper, question",
      creator: "jsPDF"
    });

    // Add title and metadata
    doc.setFontSize(18);
    doc.text("Examination Paper", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Subject: Power System-III (ELE-703)", 105, 30, { align: "center" });
    doc.text("End Term, Date: Feb 25, 2020", 105, 38, { align: "center" });

    doc.setFontSize(12);
    doc.text("Timing: 2:00 to 5:00 PM", 10, 50);
    doc.text("Autumn 2019-20, VII Semester", 105, 50, { align: "center" });
    doc.text("Max marks: 90", 200, 50, { align: "right" });

    doc.text("Attempt any five questions", 105, 60, { align: "center" });

    // Add questions
    let y = 70;
    questions.forEach((question, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${question.text}`, 10, y);
      y += 10;

      if (question.options) {
        question.options.forEach((option, optionIndex) => {
          doc.text(`${String.fromCharCode(65 + optionIndex)}. ${option}`, 20, y);
          y += 6;
        });
      }
      y += 4;
    });

    // Save the PDF
    doc.save("ExamPaper.pdf");
  };

  if (!isClient) {
    return null;
  }

  return (
    <button
      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2"
      onClick={generatePDF}
    >
      <span>Download PDF</span>
    </button>
  );
};

export default PDFGenerator;
