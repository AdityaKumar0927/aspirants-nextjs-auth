"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar, faTasks, faPlus, faEdit, faTrash, faBell, faSave,
  faBook, faClock, faUser, faStickyNote, faExclamationCircle,
  faFlag, faFileUpload, faUsers, faCommentDots, faChartBar,
  faHeart, faPaintBrush, faMobileAlt, faLink
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  type: 'class' | 'exam' | 'assignment' | 'extracurricular';
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  progress: 'not started' | 'in progress' | 'completed';
}

// Utility function to parse dates correctly
const parseDate = (date: string | Date) => {
  return typeof date === 'string' ? new Date(date) : date;
};

const Planner = () => {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDeadline, setGoalDeadline] = useState<Date | null>(null);
  const [goalReminders, setGoalReminders] = useState<Date[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState<Event>({ id: 0, title: '', description: '', date: new Date(), type: 'class' });
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Assignment>({
    id: 0, title: '', description: '', dueDate: new Date(), priority: 'medium', progress: 'not started'
  });
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);

  useEffect(() => {
    const savedGoals = localStorage.getItem('goals');
    const savedEvents = localStorage.getItem('events');
    const savedAssignments = localStorage.getItem('assignments');
    if (savedGoals) setGoals(JSON.parse(savedGoals).map((goal: Goal) => ({
      ...goal,
      deadline: goal.deadline ? parseDate(goal.deadline) : null,
      reminders: goal.reminders.map(parseDate),
    })));
    if (savedEvents) setEvents(JSON.parse(savedEvents).map((event: Event) => ({
      ...event,
      date: parseDate(event.date),
    })));
    if (savedAssignments) setAssignments(JSON.parse(savedAssignments).map((assignment: Assignment) => ({
      ...assignment,
      dueDate: parseDate(assignment.dueDate),
    })));
  }, []);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [goals, events, assignments]);

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
    setGoalTitle('');
    setGoalDescription('');
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
    setGoals(goals.map(goal => goal.id === editingGoalId ? {
      ...goal, title: goalTitle, description: goalDescription, deadline: goalDeadline, reminders: goalReminders
    } : goal));
    resetGoalForm();
    setShowEditGoalModal(false);
    setEditingGoalId(null);
  };
  const handleDeleteGoal = (goalId: number) => setGoals(goals.filter(goal => goal.id !== goalId));
  const handleNewEvent = () => setShowNewEventModal(true);
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEvents([...events, { ...newEvent, id: events.length + 1 }]);
    setNewEvent({ id: 0, title: '', description: '', date: new Date(), type: 'class' });
    setShowNewEventModal(false);
  };
  const handleNewAssignment = () => setShowNewAssignmentModal(true);
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignments([...assignments, { ...newAssignment, id: assignments.length + 1 }]);
    setNewAssignment({
      id: 0, title: '', description: '', dueDate: new Date(), priority: 'medium', progress: 'not started'
    });
    setShowNewAssignmentModal(false);
  };

  return (
    <div className="w-full h-full bg-white p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center py-6 border-b border-gray-200">
        <h1 className="text-gray-900 font-display text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
          Academic Planner
        </h1>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
          <button
            className="flex items-center bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition duration-300 transform hover:scale-105"
            onClick={handleNewGoal}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            New Goal
          </button>
          <button
            className="flex items-center bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition duration-300 transform hover:scale-105"
            onClick={handleNewEvent}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            New Event
          </button>
          <button
            className="flex items-center bg-black text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition duration-300 transform hover:scale-105"
            onClick={handleNewAssignment}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            New Assignment
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faCalendar} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-600">No upcoming events</p>
            ) : (
              <ul className="list-disc list-inside">
                {events.map((event) => (
                  <li key={event.id} className="text-gray-700">
                    <strong>{event.title}</strong>: {event.description} on {event.date.toDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faTasks} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">To-Do List</h2>
            </div>
            {goals.length === 0 ? (
              <p className="text-gray-600">No tasks assigned</p>
            ) : (
              <ul className="list-disc list-inside">
                {goals.map((goal) => (
                  <li key={goal.id} className="text-gray-700 flex justify-between items-center">
                    <div>
                      <strong>{goal.title}</strong>: {goal.description}
                      {goal.deadline && <p className="text-sm text-gray-500">Deadline: {goal.deadline.toDateString()}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
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
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faBell} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>
            </div>
            {goalReminders.length === 0 ? (
              <p className="text-gray-600">No reminders set</p>
            ) : (
              <ul className="list-disc list-inside">
                {goalReminders.map((reminder, index) => (
                  <li key={index} className="text-gray-700">
                    Reminder set for {reminder.toDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faFlag} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
            </div>
            {assignments.length === 0 ? (
              <p className="text-gray-600">No assignments added</p>
            ) : (
              <ul className="list-disc list-inside">
                {assignments.map((assignment) => (
                  <li key={assignment.id} className="text-gray-700">
                    <strong>{assignment.title}</strong>: {assignment.description} due on {assignment.dueDate.toDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faBook} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Reading List</h2>
            </div>
            <p className="text-gray-600">No reading materials added</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faClock} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Pomodoro Timer</h2>
            </div>
            <p className="text-gray-600">Timer not set</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Group Projects</h2>
            </div>
            <p className="text-gray-600">No group projects added</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faStickyNote} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Study Notes</h2>
            </div>
            <p className="text-gray-600">No study notes added</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Exams</h2>
            </div>
            <p className="text-gray-600">No upcoming exams</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faLink} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Useful Links</h2>
            </div>
            <p className="text-gray-600">No links added</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faPaintBrush} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Customization</h2>
            </div>
            <p className="text-gray-600">No customizations set</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faHeart} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Wellness Tips</h2>
            </div>
            <p className="text-gray-600">No wellness tips available</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faChartBar} className="text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Progress Reports</h2>
            </div>
            <p className="text-gray-600">No progress reports available</p>
          </div>
        </div>
      </main>
      <Modal showModal={showNewGoalModal} setShowModal={setShowNewGoalModal}>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">New Academic Goal</h2>
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
      </Modal>
      <Modal showModal={showEditGoalModal} setShowModal={setShowEditGoalModal}>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Edit Academic Goal</h2>
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
      </Modal>
      <Modal showModal={showNewEventModal} setShowModal={setShowNewEventModal}>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">New Event</h2>
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
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as 'class' | 'exam' | 'assignment' | 'extracurricular' })}
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
      </Modal>
      <Modal showModal={showNewAssignmentModal} setShowModal={setShowNewAssignmentModal}>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">New Assignment</h2>
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
                onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value as 'low' | 'medium' | 'high' })}
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
      </Modal>
    </div>
  );
};

export default Planner;
