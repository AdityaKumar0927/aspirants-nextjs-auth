"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faTasks, faPlus, faEdit, faTrash, faBell, faSave } from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/modal';
import Popover from '@/components/shared/popover';
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
}

const Planner = () => {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDeadline, setGoalDeadline] = useState<Date | null>(null);
  const [goalReminders, setGoalReminders] = useState<Date[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState<Event>({ id: 0, title: '', description: '', date: new Date() });
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  useEffect(() => {
    // Load saved goals and events from localStorage
    const savedGoals = localStorage.getItem('goals');
    const savedEvents = localStorage.getItem('events');
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
  }, []);

  useEffect(() => {
    // Save goals and events to localStorage whenever they change
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('events', JSON.stringify(events));
  }, [goals, events]);

  const handleNewGoal = () => {
    setShowNewGoalModal(true);
  };

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
    setGoals(
      goals.map((goal) =>
        goal.id === editingGoalId
          ? { ...goal, title: goalTitle, description: goalDescription, deadline: goalDeadline, reminders: goalReminders }
          : goal
      )
    );
    resetGoalForm();
    setShowEditGoalModal(false);
    setEditingGoalId(null);
  };

  const handleDeleteGoal = (goalId: number) => {
    setGoals(goals.filter((goal) => goal.id !== goalId));
  };

  const handleNewEvent = () => {
    setShowNewEventModal(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEvents([...events, { ...newEvent, id: events.length + 1 }]);
    setNewEvent({ id: 0, title: '', description: '', date: new Date() });
    setShowNewEventModal(false);
  };

  const toggleGoalCompletion = (goalId: number) => {
    setGoals(
      goals.map((goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  const addReminder = (date: Date) => {
    setGoalReminders([...goalReminders, date]);
  };

  const removeReminder = (index: number) => {
    setGoalReminders(goalReminders.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-20 w-full h-full bg-white p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center py-6 border-b border-gray-200">
      <div>
  <h1 className="text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem] text-gray-900">Academic Planner</h1>
  <div className="flex space-x-4 mt-4">
    <button
      className="text-white bg-black px-4 py-2 rounded-md flex items-center"
      onClick={handleNewGoal}
    >
      <FontAwesomeIcon icon={faPlus} className="mr-2" />
      New Goal
    </button>
    <button
      className="text-white bg-black px-4 py-2 rounded-md flex items-center"
      onClick={handleNewEvent}
    >
      <FontAwesomeIcon icon={faPlus} className="mr-2" />
      New Event
    </button>
  </div>
</div>

      </header>
      <main className="w-full max-w-4xl mx-auto mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        className={`text-xs ${goal.completed ? 'text-green-600' : 'text-gray-600'}`}
                        onClick={() => toggleGoalCompletion(goal.id)}
                      >
                        {goal.completed ? 'Completed' : 'Complete'}
                      </button>
                      <button
                        className="text-xs text-blue-600"
                        onClick={() => handleEditGoal(goal)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="text-xs text-red-600"
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
                    onClick={() => removeReminder(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => addReminder(new Date())}
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
                    onClick={() => removeReminder(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => addReminder(new Date())}
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
                placeholder="Enter event title"
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
                placeholder="Enter event description"
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
                placeholderText="Select event date"
              />
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
    </div>
  );
};

export default Planner;
