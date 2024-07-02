"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faTasks,
  faPlus,
  faEdit,
  faTrash,
  faBell,
  faStar,
  faUser,
  faHome,
  faFlag,
  faShoppingCart,
  faList,
  faSearch,
  faLightbulb,
  faEllipsisH,
  faCheck,
  faTimesCircle,
  faClock,
  faBook,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "@/components/shared/modal";

// Interfaces
interface Goal {
  id: number;
  title: string;
  description: string;
  deadline: Date | null;
  reminders: Date[];
  completed: boolean;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: "class" | "exam" | "assignment" | "extracurricular";
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  progress: "not started" | "in progress" | "completed";
}

interface TimeBlock {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  day: string;
  type: "class" | "study" | "break" | "other";
  color: string;
}

const Planner = () => {
  // State hooks
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDeadline, setGoalDeadline] = useState<Date | null>(null);
  const [goalReminders, setGoalReminders] = useState<Date[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState<Event>({
    id: 0,
    title: "",
    description: "",
    date: new Date(),
    type: "class",
  });
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Assignment>({
    id: 0,
    title: "",
    description: "",
    dueDate: new Date(),
    priority: "medium",
    progress: "not started",
  });
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [newTimeBlock, setNewTimeBlock] = useState<TimeBlock>({
    id: 0,
    title: "",
    startTime: new Date(),
    endTime: new Date(),
    day: "Monday",
    type: "class",
    color: "#000000",
  });

  // Load data from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem("goals");
    const savedEvents = localStorage.getItem("events");
    const savedAssignments = localStorage.getItem("assignments");
    const savedTimeBlocks = localStorage.getItem("timeBlocks");

    if (savedGoals) {
      setGoals(
        JSON.parse(savedGoals).map((goal: Goal) => ({
          ...goal,
          deadline: goal.deadline ? new Date(goal.deadline) : null,
          reminders: goal.reminders.map((date) => new Date(date)),
        }))
      );
    }
    if (savedEvents) {
      setEvents(
        JSON.parse(savedEvents).map((event: Event) => ({
          ...event,
          date: new Date(event.date),
        }))
      );
    }
    if (savedAssignments) {
      setAssignments(
        JSON.parse(savedAssignments).map((assignment: Assignment) => ({
          ...assignment,
          dueDate: new Date(assignment.dueDate),
        }))
      );
    }
    if (savedTimeBlocks) {
      setTimeBlocks(
        JSON.parse(savedTimeBlocks).map((block: TimeBlock) => ({
          ...block,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime),
        }))
      );
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
    localStorage.setItem("events", JSON.stringify(events));
    localStorage.setItem("assignments", JSON.stringify(assignments));
    localStorage.setItem("timeBlocks", JSON.stringify(timeBlocks));
  }, [goals, events, assignments, timeBlocks]);

  // Goal handlers
  const handleNewGoal = () => setShowNewGoalModal(true);
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: Goal = {
      id: goals.length + 1,
      title: goalTitle,
      description: goalDescription,
      deadline: goalDeadline,
      reminders: goalReminders,
      completed: false,
    };
    setGoals([...goals, newGoal]);
    resetGoalForm();
  };
  const resetGoalForm = () => {
    setGoalTitle("");
    setGoalDescription("");
    setGoalDeadline(null);
    setGoalReminders([]);
    setShowNewGoalModal(false);
  };
  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description);
    setGoalDeadline(goal.deadline);
    setGoalReminders(goal.reminders);
    setShowEditGoalModal(true);
  };
  const handleUpdateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setGoals(
      goals.map((goal) =>
        goal.id === editingGoalId
          ? {
              ...goal,
              title: goalTitle,
              description: goalDescription,
              deadline: goalDeadline,
              reminders: goalReminders,
            }
          : goal
      )
    );
    resetGoalForm();
    setShowEditGoalModal(false);
    setEditingGoalId(null);
  };
  const handleDeleteGoal = (goalId: number) =>
    setGoals(goals.filter((goal) => goal.id !== goalId));
  const toggleGoalCompletion = (goalId: number) =>
    setGoals(
      goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              completed: !goal.completed,
            }
          : goal
      )
    );

  // Event handlers
  const handleNewEvent = () => setShowNewEventModal(true);
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEvents([...events, { ...newEvent, id: events.length + 1 }]);
    setNewEvent({
      id: 0,
      title: "",
      description: "",
      date: new Date(),
      type: "class",
    });
    setShowNewEventModal(false);
  };

  // Assignment handlers
  const handleNewAssignment = () => setShowNewAssignmentModal(true);
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignments([...assignments, { ...newAssignment, id: assignments.length + 1 }]);
    setNewAssignment({
      id: 0,
      title: "",
      description: "",
      dueDate: new Date(),
      priority: "medium",
      progress: "not started",
    });
    setShowNewAssignmentModal(false);
  };

  // Time block handlers
  const handleNewTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeBlocks([...timeBlocks, { ...newTimeBlock, id: timeBlocks.length + 1 }]);
    setNewTimeBlock({
      id: 0,
      title: "",
      startTime: new Date(),
      endTime: new Date(),
      day: "Monday",
      type: "class",
      color: "#000000",
    });
    setShowScheduleModal(false);
  };

  const handleDeleteTimeBlock = (id: number) => {
    setTimeBlocks(timeBlocks.filter((block) => block.id !== id));
  };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Filtered goals
  const filteredGoals = goals.filter((goal) => {
    if (filter === "completed") return goal.completed;
    if (filter === "incomplete") return !goal.completed;
    return true;
  });

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-900 p-4">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold mr-3">AK</div>
          <div>
            <div className="font-semibold">Aditya Kumar</div>
            <div className="text-xs text-gray-400">artistaadityakumar@gmail.com</div>
          </div>
        </div>
        <div className="mb-4">
          <input type="text" placeholder="Search" className="w-full bg-gray-800 rounded px-3 py-2 text-sm" />
        </div>
        <nav>
          <ul className="space-y-2">
            <li className="flex items-center text-white"><FontAwesomeIcon icon={faSun} className="mr-3" /> My Day <span className="ml-auto">{goals.filter(g => !g.completed).length}</span></li>
            <li className="flex items-center"><FontAwesomeIcon icon={faStar} className="mr-3" /> Important</li>
            <li className="flex items-center"><FontAwesomeIcon icon={faCalendar} className="mr-3" /> Planned <span className="ml-auto">{events.length}</span></li>
            <li className="flex items-center"><FontAwesomeIcon icon={faUser} className="mr-3" /> Assigned to me</li>
            <li className="flex items-center"><FontAwesomeIcon icon={faHome} className="mr-3" /> Tasks <span className="ml-auto">{goals.length}</span></li>
            <li className="flex items-center"><FontAwesomeIcon icon={faFlag} className="mr-3" /> Getting started <span className="ml-auto">{assignments.length}</span></li>
            <li className="flex items-center"><FontAwesomeIcon icon={faShoppingCart} className="mr-3" /> Groceries</li>
            <li className="flex items-center"><FontAwesomeIcon icon={faList} className="mr-3" /> Untitled list</li>
          </ul>
        </nav>
        <div className="absolute bottom-4 left-4">
          <button className="flex items-center text-sm" onClick={handleNewGoal}><FontAwesomeIcon icon={faPlus} className="mr-2" /> New list</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-gray-800 p-8 relative overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <div className="flex space-x-2">
              <button className="p-2 bg-gray-700 rounded" onClick={() => setShowScheduleModal(true)}>
                <FontAwesomeIcon icon={faPlus} /> Add Time Block
              </button>
              <button className="p-2 bg-gray-700 rounded" onClick={handleNewEvent}>
                <FontAwesomeIcon icon={faPlus} /> Add Event
              </button>
              <button className="p-2 bg-gray-700 rounded" onClick={handleNewAssignment}>
                <FontAwesomeIcon icon={faPlus} /> Add Assignment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-8">
            {weekDays.map((day) => (
              <div key={day} className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{day}</h3>
                {timeBlocks
                  .filter((block) => block.day === day)
                  .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                  .map((block) => (
                    <div
                      key={block.id}
                      className="mb-2 p-2 rounded-md"
                      style={{ backgroundColor: block.color }}
                    >
                      <p className="font-medium">{block.title}</p>
                      <p className="text-sm">
                        {block.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {block.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs">{block.type}</p>
                      <button
                        className="text-red-600 hover:text-red-800 mt-1"
                        onClick={() => handleDeleteTimeBlock(block.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4">Goals</h2>
          <div className="mb-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "completed" | "incomplete")}
              className="bg-gray-700 text-white rounded px-3 py-2"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="bg-gray-700 p-3 rounded-lg flex items-center">
                <button
                  className={`mr-3 text-${goal.completed ? "green" : "gray"}-600 hover:text-${goal.completed ? "green" : "gray"}-800`}
                  onClick={() => toggleGoalCompletion(goal.id)}
                >
                  <FontAwesomeIcon icon={goal.completed ? faCheck : faTimesCircle} />
                </button>
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <p className="text-sm text-gray-400">{goal.description}</p>
                  {goal.deadline && (
                    <p className="text-sm text-gray-400">Deadline: {goal.deadline.toDateString()}</p>
                  )}
                </div>
                <div className="ml-auto flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleEditGoal(goal)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-900 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upcoming Events</h2>
          <button><FontAwesomeIcon icon={faEllipsisH} /></button>
        </div>
        <div className="mb-4">
          {events.map((event) => (
            <div key={event.id} className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <p>{event.date.toDateString()}</p>
                <button><FontAwesomeIcon icon={faEllipsisH} /></button>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCalendar} className="mr-3" />
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-400">{event.type} • {event.date.toDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Assignments</h2>
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center">
                <FontAwesomeIcon icon={faFlag} className="mr-3" />
                <div>
                  <p className="font-medium">{assignment.title}</p>
                  <p className="text-sm text-gray-400">Due: {assignment.dueDate.toDateString()}</p>
                  <p className="text-xs text-gray-400">Priority: {assignment.priority}</p>
                  <p className="text-xs text-gray-400">Progress: {assignment.progress}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal showModal={showNewGoalModal} setShowModal={setShowNewGoalModal}>
        <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h3 className="font-display text-2xl font-bold">New Academic Goal</h3>
          </div>
          <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
            <form onSubmit={handleCreateGoal}>
              <div className="mb-4">
                <label htmlFor="goalTitle" className="block text-gray-700 font-semibold mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  id="goalTitle"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your goal title"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="goalDescription" className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  id="goalDescription"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your goal description"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="goalDeadline" className="block text-gray-700 font-semibold mb-2">
                  Deadline
                </label>
                <DatePicker
                  selected={goalDeadline}
                  onChange={(date) => setGoalDeadline(date)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select a deadline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Reminders
                </label>
                {goalReminders.map((reminder, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <DatePicker
                      selected={reminder}
                      onChange={(date) => {
                        const newReminders = [...goalReminders];
                        newReminders[index] = date as Date;
                        setGoalReminders(newReminders);
                      }}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      className="ml-2 text-red-600"
                      onClick={() => setGoalReminders(goalReminders.filter((_, i) => i !== index))}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => setGoalReminders([...goalReminders, new Date()])}
                >
                  Add Reminder
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <Modal showModal={showEditGoalModal} setShowModal={setShowEditGoalModal}>
        <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h3 className="font-display text-2xl font-bold">Edit Goal</h3>
          </div>
          <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
            <form onSubmit={handleUpdateGoal}>
              <div className="mb-4">
                <label htmlFor="goalTitle" className="block text-gray-700 font-semibold mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  id="goalTitle"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your goal title"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="goalDescription" className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  id="goalDescription"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your goal description"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="goalDeadline" className="block text-gray-700 font-semibold mb-2">
                  Deadline
                </label>
                <DatePicker
                  selected={goalDeadline}
                  onChange={(date) => setGoalDeadline(date)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select a deadline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Reminders
                </label>
                {goalReminders.map((reminder, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <DatePicker
                      selected={reminder}
                      onChange={(date) => {
                        const newReminders = [...goalReminders];
                        newReminders[index] = date as Date;
                        setGoalReminders(newReminders);
                      }}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      className="ml-2 text-red-600"
                      onClick={() => setGoalReminders(goalReminders.filter((_, i) => i !== index))}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => setGoalReminders([...goalReminders, new Date()])}
                >
                  Add Reminder
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <Modal showModal={showNewEventModal} setShowModal={setShowNewEventModal}>
        <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h3 className="font-display text-2xl font-bold">New Event</h3>
          </div>
          <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
            <form onSubmit={handleCreateEvent}>
              <div className="mb-4">
                <label htmlFor="eventTitle" className="block text-gray-700 font-semibold mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  id="eventTitle"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="eventDescription" className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  id="eventDescription"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your event description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="eventDate" className="block text-gray-700 font-semibold mb-2">
                  Date
                </label>
                <DatePicker
                  selected={newEvent.date}
                  onChange={(date) => setNewEvent({ ...newEvent, date: date as Date })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select a date"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="eventType" className="block text-gray-700 font-semibold mb-2">
                  Type
                </label>
                <select
                  id="eventType"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as "class" | "exam" | "assignment" | "extracurricular" })}
                >
                  <option value="class">Class</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="extracurricular">Extracurricular</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <Modal showModal={showNewAssignmentModal} setShowModal={setShowNewAssignmentModal}>
        <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h3 className="font-display text-2xl font-bold">New Assignment</h3>
          </div>
          <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
            <form onSubmit={handleCreateAssignment}>
              <div className="mb-4">
                <label htmlFor="assignmentTitle" className="block text-gray-700 font-semibold mb-2">
                  Assignment Title
                </label>
                <input
                  type="text"
                  id="assignmentTitle"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your assignment title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="assignmentDescription" className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  id="assignmentDescription"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your assignment description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="assignmentDueDate" className="block text-gray-700 font-semibold mb-2">
                  Due Date
                </label>
                <DatePicker
                  selected={newAssignment.dueDate}
                  onChange={(date) => setNewAssignment({ ...newAssignment, dueDate: date as Date })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="Select a due date"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="assignmentPriority" className="block text-gray-700 font-semibold mb-2">
                  Priority
                </label>
                <select
                  id="assignmentPriority"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAssignment.priority}
                  onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value as "low" | "medium" | "high" })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <Modal showModal={showScheduleModal} setShowModal={setShowScheduleModal}>
        <div className="w-full overflow-hidden shadow-xl md:max-w-md md:rounded-2xl md:border md:border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h3 className="font-display text-2xl font-bold">Add Time Block</h3>
          </div>
          <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 md:px-16">
            <form onSubmit={handleNewTimeBlock}>
              <div className="mb-4">
                <label htmlFor="blockTitle" className="block text-gray-700 font-semibold mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="blockTitle"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter block title"
                  value={newTimeBlock.title}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, title: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="blockDay" className="block text-gray-700 font-semibold mb-2">
                  Day
                </label>
                <select
                  id="blockDay"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTimeBlock.day}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, day: e.target.value })}
                >
                  {weekDays.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="blockStartTime" className="block text-gray-700 font-semibold mb-2">
                  Start Time
                </label>
                <DatePicker
                  selected={newTimeBlock.startTime}
                  onChange={(date) => setNewTimeBlock({ ...newTimeBlock, startTime: date as Date })}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="blockEndTime" className="block text-gray-700 font-semibold mb-2">
                  End Time
                </label>
                <DatePicker
                  selected={newTimeBlock.endTime}
                  onChange={(date) => setNewTimeBlock({ ...newTimeBlock, endTime: date as Date })}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="blockType" className="block text-gray-700 font-semibold mb-2">
                  Type
                </label>
                <select
                  id="blockType"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTimeBlock.type}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, type: e.target.value as "class" | "study" | "break" | "other" })}
                >
                  <option value="class">Class</option>
                  <option value="study">Study</option>
                  <option value="break">Break</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="blockColor" className="block text-gray-700 font-semibold mb-2">
                  Color
                </label>
                <input
                  type="color"
                  id="blockColor"
                  className="w-full h-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTimeBlock.color}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, color: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Time Block
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Planner;
