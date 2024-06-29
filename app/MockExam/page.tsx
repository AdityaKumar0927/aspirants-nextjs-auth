// page.tsx
"use client"

import React, { useState } from 'react';
import ExamComponent from '@/components/shared/ExamComponent';
import MockExamGenerator from '@/components/shared/MockExamGenerator';

const MockExam: React.FC = () => {
  const [examConfig, setExamConfig] = useState<any>(null);
  const [isExamStarted, setIsExamStarted] = useState(false);

  const handleStartExam = (config: any) => {
    setExamConfig(config);
    setIsExamStarted(true);
  };

  const handleFinishExam = (result: any) => {
    console.log('Exam finished:', result);
    setIsExamStarted(false);
  };

  return (
    <div className="p-8">
      {!isExamStarted ? (
        <MockExamGenerator
          onStartExam={handleStartExam}
          onGenerateQuestionBank={(config) => console.log('Question bank generated:', config)}
        />
      ) : (
        examConfig && (
          <ExamComponent
            questions={examConfig.questions}
            examTime={examConfig.examTime}
            onFinishExam={handleFinishExam}
          />
        )
      )}
    </div>
  );
};

export default MockExam;
