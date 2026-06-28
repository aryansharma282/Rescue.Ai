/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, Calendar, Tag, AlertTriangle, ArrowRight, Clock, Bell } from 'lucide-react';
import { Task, TaskPriority, Habit } from '../types';

interface TaskInputProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'completed'>) => void;
  habits: Habit[];
}

export default function TaskInput({ onAddTask, onAddHabit, habits }: TaskInputProps) {
  const [entryType, setEntryType] = useState<'TASK' | 'HABIT'>('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState('General');
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(30);
  const [habitAlarmEnabled, setHabitAlarmEnabled] = useState(false);

  const priorities: { value: TaskPriority; label: string; color: string; border: string }[] = [
    { value: 'LOW', label: 'Low', color: 'dark:bg-neutral-800 bg-neutral-100 dark:text-neutral-400 text-neutral-600', border: 'dark:border-neutral-700 border-neutral-200' },
    { value: 'MEDIUM', label: 'Medium', color: 'dark:bg-neutral-700 bg-neutral-200 dark:text-white text-neutral-800', border: 'dark:border-neutral-600 border-neutral-300' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-500 text-white', border: 'border-orange-500' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-[#ffde1a] text-black', border: 'border-[#ffde1a]' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(entryType === 'TASK' ? 'Task Title is required.' : 'Habit Name is required.');
      return;
    }

    if (entryType === 'HABIT') {
      if (!startTime || !endTime) {
        setError('Start Time and End Time are required for Daily Habits.');
        return;
      }
      onAddHabit({
        name: title.trim(),
        startTime,
        endTime,
        alarmEnabled: habitAlarmEnabled,
      });
      setTitle('');
      setDescription('');
      setCategory('General');
      setPriority('MEDIUM');
      setStartTime('');
      setEndTime('');
      setHabitAlarmEnabled(false);
      return;
    }

    if (!dueDate) {
      setError('Deadline is required.');
      return;
    }

    onAddTask({
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      dueDate,
      priority,
      category: category.trim() || 'General',
      reminderMinutes: reminderMinutes !== -1 ? reminderMinutes : undefined,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('MEDIUM');
    setCategory('General');
    setReminderMinutes(30);
  };

  const collisionHabit = (entryType === 'TASK' && dueDate && Array.isArray(habits)) 
    ? habits.find(h => {
        if (!h || !h.startTime || !h.endTime) return false;
        // dueDate format is generally "YYYY-MM-DDTHH:mm"
        const timeParts = dueDate.split('T');
        if (timeParts.length < 2) return false;
        const timeVal = timeParts[1]; // HH:mm
        return timeVal >= h.startTime && timeVal <= h.endTime;
      })
    : null;

  return (
    <div className="dark:bg-[#121212] bg-white dark:border-neutral-800 border-neutral-200 rounded-xl p-6 md:p-8 shadow-lg">
      <div className="flex items-center space-x-3 border-b dark:border-neutral-800 border-neutral-200 pb-4 mb-6">
        <div className="w-6 h-6 bg-[#ffde1a] rounded-full text-black flex items-center justify-center font-medium text-lg">
          +
        </div>
        <h2 className="font-display font-medium text-xl dark:text-white text-neutral-900">
          Add New Task
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        {collisionHabit && (
          <div className="bg-[#ffde1a]/10 border border-[#ffde1a]/30 rounded-lg p-3 flex items-start space-x-2 text-[#ffde1a] text-sm">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <p>
              <strong>Warning:</strong> This overlaps with your <strong>{collisionHabit.name}</strong> time. AI will schedule around this.
            </p>
          </div>
        )}

        {/* Entry Type Selector */}
        <div className="flex dark:bg-[#1a1a1a] bg-neutral-100 rounded-lg p-1 border dark:border-neutral-800 border-neutral-200">
          <button
            type="button"
            onClick={() => setEntryType('TASK')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${entryType === 'TASK' ? 'bg-[#ffde1a] text-black shadow' : 'dark:text-neutral-500 text-neutral-500 hover:dark:text-neutral-300 hover:text-neutral-750'}`}
          >
            Deadline Task
          </button>
          <button
            type="button"
            onClick={() => setEntryType('HABIT')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${entryType === 'HABIT' ? 'bg-[#ffde1a] text-black shadow' : 'dark:text-neutral-500 text-neutral-500 hover:dark:text-neutral-300 hover:text-neutral-755'}`}
          >
            Daily Habit
          </button>
        </div>

        {/* Task Title - Bold display input */}
        <div className="space-y-2">
          <label htmlFor="task-title" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500">
            {entryType === 'TASK' ? 'Task Title' : 'Habit Name'}
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={entryType === 'TASK' ? 'e.g., Complete Math Assignment' : 'e.g., Drink 2L Water'}
            className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] focus:ring-1 focus:ring-[#ffde1a] dark:text-white text-neutral-900 text-base px-4 py-3 outline-none transition-all dark:placeholder:text-neutral-600 placeholder:text-neutral-400"
          />
        </div>

        {/* Task Notes / Description */}
        {entryType === 'TASK' && (
          <div className="space-y-2">
            <label htmlFor="task-description" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500">
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, steps, or notes..."
              className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] focus:ring-1 focus:ring-[#ffde1a] dark:text-white text-neutral-900 text-sm p-4 outline-none transition-all dark:placeholder:text-neutral-600 placeholder:text-neutral-400"
            />
          </div>
        )}

        {/* Priority & Category & Date/Time Grid */}
        {entryType === 'TASK' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Date & Time Picker */}
            <div className="space-y-2">
              <label htmlFor="task-deadline" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
                <Calendar size={14} className="text-neutral-500" />
                <span>Due Date</span>
              </label>
              <input
                id="task-deadline"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-sm px-4 py-3 outline-none transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <label htmlFor="task-category" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
                <Tag size={14} className="text-neutral-500" />
                <span>Category</span>
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-sm px-4 py-3 outline-none transition-colors"
              >
                <option value="General">General</option>
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
              </select>
            </div>

            {/* Reminder Selection */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label htmlFor="task-reminder" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
                <Bell size={14} className="text-neutral-500" />
                <span>Reminder Alert</span>
              </label>
              <select
                id="task-reminder"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-sm px-4 py-3 outline-none transition-colors"
              >
                <option value="-1">No Reminder</option>
                <option value="0">At time of event</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

          </div>
        )}

        {/* Priority Selector */}
        {entryType === 'TASK' && (
          <div className="space-y-2">
            <span className="block text-sm font-medium dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
              <AlertTriangle size={14} className="text-neutral-500" />
              <span>Priority Level</span>
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {priorities.map((item) => {
                const isSelected = priority === item.value;
                return (
                  <button
                    id={`priority-btn-${item.value.toLowerCase()}`}
                    key={item.value}
                    type="button"
                    onClick={() => setPriority(item.value)}
                    className={`
                      py-2.5 px-3 rounded-lg text-sm font-medium text-center cursor-pointer transition-all duration-150 border
                      ${isSelected 
                        ? `${item.color} ${item.border}` 
                        : 'dark:bg-[#1a1a1a] bg-white dark:text-neutral-400 text-neutral-600 dark:border-neutral-800 border-neutral-200 hover:dark:bg-[#222] hover:bg-neutral-50 hover:dark:text-neutral-300 hover:text-neutral-800'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {entryType === 'HABIT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="habit-start" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
                  <Clock size={14} className="text-neutral-500" />
                  <span>Start Time</span>
                </label>
                <input
                  id="habit-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-sm px-4 py-3 outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="habit-end" className="block text-sm font-medium dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
                  <Clock size={14} className="text-neutral-500" />
                  <span>End Time</span>
                </label>
                <input
                  id="habit-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full dark:bg-[#1a1a1a] bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-sm px-4 py-3 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-neutral-50 dark:bg-[#1a1a1a] p-3 rounded-lg border dark:border-neutral-800 border-neutral-200 transition-all duration-300">
              <input
                type="checkbox"
                id="habit-alarm-toggle"
                checked={habitAlarmEnabled}
                onChange={(e) => setHabitAlarmEnabled(e.target.checked)}
                className="rounded text-[#ffde1a] focus:ring-[#ffde1a] h-4 w-4 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 cursor-pointer"
              />
              <label htmlFor="habit-alarm-toggle" className="text-sm dark:text-[#ffde1a] text-[#ffde1a] font-semibold cursor-pointer select-none">
                Enable Habit Alarm / Reminder notification ⏰ (Optional)
              </label>
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-4">
          <button
            id="add-task-btn"
            type="submit"
            className="w-full bg-[#ffde1a] hover:bg-[#e0c310] text-black font-medium text-base rounded-lg py-3.5 px-6 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Add Task</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
