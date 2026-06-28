import React, { useState } from 'react';
import { Trash2, Clock, Plus, Flame, Check, Sparkles, Bell, BellOff } from 'lucide-react';
import { Habit } from '../types';

interface HabitsWidgetProps {
  habits: Habit[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (habitData: { name: string; startTime?: string; endTime?: string; alarmEnabled?: boolean }) => void;
  onToggleAlarm: (id: string) => void;
}

export default function HabitsWidget({ habits, onToggle, onDelete, onAdd, onToggleAlarm }: HabitsWidgetProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const playClickSound = (isCompleting: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      if (isCompleting) {
        // High-quality positive, clear dynamic check pluck (ascending double click)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.004);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.08);

        setTimeout(() => {
          try {
            const ctx2 = new AudioContextClass();
            const osc2 = ctx2.createOscillator();
            const gainNode2 = ctx2.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1450, ctx2.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1750, ctx2.currentTime + 0.07);
            gainNode2.gain.setValueAtTime(0, ctx2.currentTime);
            gainNode2.gain.linearRampToValueAtTime(0.1, ctx2.currentTime + 0.004);
            gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.1);
            osc2.connect(gainNode2);
            gainNode2.connect(ctx2.destination);
            osc2.start();
            osc2.stop(ctx2.currentTime + 0.11);
          } catch (e) {}
        }, 40);
      } else {
        // Single light physical woodblock style feedback for unchecking
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.03);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.003);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn('Sound effect play bypassed:', e);
    }
  };

  const handleToggleHabit = (habitId: string, currentlyCompleted: boolean) => {
    playClickSound(!currentlyCompleted);
    onToggle(habitId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    onAdd({
      name: newHabitName.trim(),
      startTime: startTime ? startTime : undefined,
      endTime: endTime ? endTime : undefined,
      alarmEnabled: startTime ? alarmEnabled : false,
    });

    setNewHabitName('');
    setStartTime('');
    setEndTime('');
    setAlarmEnabled(false);
    setIsAdding(false);
  };

  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.completed).length;
  const percentCompleted = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  return (
    <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:dark:border-neutral-700/60 hover:border-neutral-300">
      {/* Glow highlight effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffde1a]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-[#ffde1a]/10 text-[#ffde1a] rounded-lg">
            <Flame size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold dark:text-white text-neutral-900 text-base">Daily Habits</h3>
            <p className="text-xs dark:text-neutral-500 text-neutral-500">Track and build your routines</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#ffde1a]/15 text-[#ffde1a] border border-[#ffde1a]/20 px-2 py-0.5 rounded-full">
          Streak Active
        </span>
      </div>

      {/* Progress Section */}
      {totalHabits > 0 && (
        <div className="mb-5 space-y-2 dark:bg-[#171717] bg-neutral-50 p-3 rounded-lg border dark:border-neutral-800/40 border-neutral-200">
          <div className="flex justify-between items-center text-xs">
            <span className="dark:text-neutral-400 text-neutral-600 font-medium flex items-center space-x-1">
              <Sparkles size={12} className="text-[#ffde1a]" />
              <span>Daily Target</span>
            </span>
            <span className="font-mono font-bold dark:text-white text-neutral-900">
              {completedHabits}/{totalHabits} completed ({percentCompleted}%)
            </span>
          </div>
          <div className="w-full h-2 dark:bg-neutral-800 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ffd31a] to-[#ffde1a] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,222,26,0.3)]"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {habits.length === 0 ? (
          <div className="text-center py-6 border border-dashed dark:border-neutral-800 border-neutral-300 rounded-lg">
            <p className="text-sm dark:text-neutral-500 text-neutral-500">No habits added yet</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-2 text-xs text-[#ffde1a] font-medium hover:underline flex items-center justify-center mx-auto space-x-1"
            >
              <Plus size={14} />
              <span>Create your first habit</span>
            </button>
          </div>
        ) : (
          habits.map(habit => (
            <div 
              key={habit.id}
              className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                habit.completed 
                  ? 'dark:bg-neutral-900/40 bg-neutral-50 dark:border-neutral-800/60 border-neutral-200/60 opacity-70' 
                  : 'dark:bg-[#181818] bg-white dark:border-neutral-800/80 border-neutral-200 hover:dark:border-neutral-700/60 hover:border-neutral-300 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Custom Checkbox */}
                <button
                  onClick={() => handleToggleHabit(habit.id, habit.completed || false)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                    habit.completed
                      ? 'bg-[#ffde1a] border-[#ffde1a] text-black shadow-[0_0_8px_rgba(255,222,26,0.2)]'
                      : 'dark:border-neutral-700 border-neutral-300 hover:border-[#ffde1a] bg-transparent'
                  }`}
                >
                  {habit.completed && <Check size={12} strokeWidth={3} />}
                </button>

                <div className="min-w-0">
                  <p className={`text-sm font-medium transition-all ${
                    habit.completed ? 'line-through text-neutral-500' : 'dark:text-neutral-200 text-neutral-800'
                  }`}>
                    {habit.name}
                  </p>
                  {(habit.startTime || habit.endTime) && (
                    <div className="flex items-center space-x-1 text-[10px] dark:text-neutral-500 text-neutral-500 mt-0.5 font-mono">
                      <Clock size={10} className="dark:text-neutral-600 text-neutral-400" />
                      <span>{habit.startTime || '00:00'} - {habit.endTime || '23:59'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                {habit.startTime && (
                  <button
                    onClick={() => onToggleAlarm(habit.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      habit.alarmEnabled
                        ? 'text-[#ffde1a] bg-[#ffde1a]/10 hover:bg-[#ffde1a]/20 border border-[#ffde1a]/20'
                        : 'text-neutral-400 hover:text-neutral-300 dark:hover:bg-neutral-800/60 hover:bg-neutral-100 border border-transparent'
                    }`}
                    title={habit.alarmEnabled ? "Alarm Reminder Enabled (Click to Disable)" : "Enable Alarm Reminder (Optional)"}
                  >
                    {habit.alarmEnabled ? <Bell size={13} className="animate-pulse" /> : <BellOff size={13} />}
                  </button>
                )}

                <button
                  onClick={() => onDelete(habit.id)}
                  className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:dark:bg-neutral-800/60 hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Delete habit"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Habit Form */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t dark:border-neutral-800/80 border-neutral-200 space-y-3 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            required
            placeholder="Habit name (e.g., Meditation)"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="w-full dark:bg-neutral-900 bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-xs px-3 py-2 outline-none transition-colors"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] dark:text-neutral-500 text-neutral-600 mb-1 font-medium">Start Time (Optional)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full dark:bg-neutral-900 bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-xs px-2 py-1.5 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] dark:text-neutral-500 text-neutral-600 mb-1 font-medium">End Time (Optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full dark:bg-neutral-900 bg-white border dark:border-neutral-800 border-neutral-200 rounded-lg focus:border-[#ffde1a] dark:text-white text-neutral-900 text-xs px-2 py-1.5 outline-none font-mono"
              />
            </div>
          </div>

          {startTime && (
            <div className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-900/40 p-2 rounded-lg border dark:border-neutral-800/40 border-neutral-200/60 transition-all duration-300">
              <input
                type="checkbox"
                id="new-habit-alarm"
                checked={alarmEnabled}
                onChange={(e) => setAlarmEnabled(e.target.checked)}
                className="rounded text-[#ffde1a] focus:ring-[#ffde1a] h-3.5 w-3.5 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 cursor-pointer"
              />
              <label htmlFor="new-habit-alarm" className="text-[10px] dark:text-neutral-400 text-[#ffde1a] font-semibold cursor-pointer select-none">
                Enable Alarm notification ⏰ (Optional)
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setAlarmEnabled(false);
              }}
              className="px-2.5 py-1.5 text-neutral-500 dark:hover:text-white hover:text-neutral-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#ffde1a] hover:bg-[#e0c310] text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Save Habit
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 w-full border border-dashed dark:border-neutral-800 border-neutral-300 rounded-lg py-2 text-xs dark:text-neutral-400 text-neutral-600 hover:dark:text-white hover:text-neutral-900 hover:dark:border-neutral-700 hover:border-neutral-400 hover:dark:bg-neutral-900/20 hover:bg-neutral-50 transition-all flex items-center justify-center space-x-1"
        >
          <Plus size={14} className="text-[#ffde1a]" />
          <span>Add New Habit</span>
        </button>
      )}
    </div>
  );
}
