// File: components/ExamHeader.tsx
import React from "react";
import { User, Clock } from "lucide-react";

interface ExamHeaderProps {
  userName: string;
  subject: string;
  year: string;
  level: string;
  timeLeft: number;
  formatTime: (seconds: number) => string;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  userName,
  subject,
  year,
  level,
  timeLeft,
  formatTime,
}) => {
  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-medium">{userName}</h2>
              <p className="text-xs text-muted-foreground">
                {subject} ({year}) - {level}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
