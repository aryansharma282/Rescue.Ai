import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Task } from '../types';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <CalendarIcon className="text-[#ffde1a]" />
          <h2 className="font-display font-medium text-xl dark:text-white text-neutral-900">Calendar</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, idx) => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, today);
            
            return (
              <div key={idx} className={`flex flex-col min-h-[120px] rounded-lg border p-3 ${isToday ? 'border-[#ffde1a] bg-[#ffde1a]/5' : 'dark:border-neutral-800 border-neutral-200 dark:bg-[#1a1a1a] bg-neutral-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-medium uppercase ${isToday ? 'text-[#ffde1a]' : 'text-neutral-500'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? 'text-[#ffde1a]' : 'dark:text-white text-neutral-900'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {dayTasks.map(t => (
                    <div key={t.id} className="text-xs dark:bg-neutral-800/80 bg-white px-2 py-1.5 rounded border dark:border-neutral-700 border-neutral-200 truncate dark:text-neutral-300 text-neutral-700 shadow-sm">
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length === 0 && (
                    <div className="text-xs text-neutral-400 dark:text-neutral-600 text-center mt-4">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
