// pages/planner.tsx
import { useState } from "react";
import MonthlyView from "@/components/planner/MonthlyView";
import WeeklyView from "@/components/planner/WeeklyView";
import DailyView from "@/components/planner/DailyView";
import GoalSetting from "@/components/planner/GoalSetting";
import AssignmentTracker from "@/components/planner/AssignmentTracker";
import StudySchedule from "@/components/planner/StudySchedule";
import ClassSchedule from "@/components/planner/ClassSchedule";
import ToDoLists from "@/components/planner/ToDoLists";
import Notes from "@/components/planner/Notes";


const Planner = () => {
  const [view, setView] = useState("monthly");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Academic Planner</h1>
          <nav className="mt-4">
            <button onClick={() => setView("monthly")}>Monthly</button>
            <button onClick={() => setView("weekly")}>Weekly</button>
            <button onClick={() => setView("daily")}>Daily</button>
            <button onClick={() => setView("goals")}>Goals</button>
            <button onClick={() => setView("assignments")}>Assignments</button>
            <button onClick={() => setView("study")}>Study</button>
            <button onClick={() => setView("classes")}>Classes</button>
            <button onClick={() => setView("todo")}>To-Do</button>
            <button onClick={() => setView("notes")}>Notes</button>
            <button onClick={() => setView("habits")}>Habits</button>
            <button onClick={() => setView("grades")}>Grades</button>
            <button onClick={() => setView("extracurricular")}>Extracurricular</button>
          </nav>
        </div>
      </header>
      <main>
        {view === "monthly" && <MonthlyView />}
        {view === "weekly" && <WeeklyView />}
        {view === "daily" && <DailyView />}
        {view === "goals" && <GoalSetting />}
        {view === "assignments" && <AssignmentTracker />}
        {view === "study" && <StudySchedule />}
        {view === "classes" && <ClassSchedule />}
        {view === "todo" && <ToDoLists />}
        {view === "notes" && <Notes />}
      </main>
    </div>
  );
};

export default Planner;
