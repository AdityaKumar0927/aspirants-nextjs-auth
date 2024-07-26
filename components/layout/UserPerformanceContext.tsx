"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserPerformance {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  accuracy: number;
  weaknessBySubtopic: any;
  improvementOverTime: any;
  attemptRate: number;
  firstAttemptSuccessRate: number;
  reattemptAccuracy: number;
  topicPerformance: any;
  consistency: number;
  engagementLevel: number;
  completed: boolean;
  reviewed: boolean;
  createdAt: string;
}

interface UserPerformanceContextType {
  userPerformance: UserPerformance[];
  loading: boolean;
}

const UserPerformanceContext = createContext<UserPerformanceContextType | undefined>(undefined);

export const UserPerformanceProvider: React.FC<{ userId: string; children: ReactNode }> = ({ userId, children }) => {
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPerformance = async () => {
      try {
        const response = await fetch(`/api/user-performance/get?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user performance");
        }
        const data = await response.json();
        setUserPerformance(data);
      } catch (error) {
        console.error("Error fetching user performance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPerformance();
  }, [userId]);

  return (
    <UserPerformanceContext.Provider value={{ userPerformance, loading }}>
      {children}
    </UserPerformanceContext.Provider>
  );
};

export const useUserPerformance = (): UserPerformanceContextType => {
  const context = useContext(UserPerformanceContext);
  if (context === undefined) {
    throw new Error("useUserPerformance must be used within a UserPerformanceProvider");
  }
  return context;
};
