import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import TaskInput from './components/TaskInput';
import CalendarView from './components/CalendarView';
import ChatView from './components/ChatView';
import VoiceView from './components/VoiceView';
import FocusView from './components/FocusView';
import GrowthView from './components/GrowthView';
import HabitsWidget from './components/HabitsWidget';
import Confetti from './components/Confetti';
import Onboarding from './components/Onboarding';
import SettingsView from './components/SettingsView';
import { Task, TaskPriority, SubTask, Habit } from './types';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Tag,
  Hourglass,
  CheckCircle,
  Inbox,
  Plus,
  X,
  Bell,
  Clock
} from 'lucide-react';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Complete Math Assignment',
    description: 'Finish chapters 4 and 5 exercises. Focus on calculus applications.',
    dueDate: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 16),
    priority: 'URGENT',
    completed: false,
    createdAt: new Date().toISOString(),
    category: 'Study'
  },
  {
    id: 'task-2',
    title: 'Pay Electricity Bill',
    description: 'Due on the 15th. Check the portal for the latest invoice amount.',
    dueDate: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16),
    priority: 'HIGH',
    completed: false,
    createdAt: new Date().toISOString(),
    category: 'Personal'
  },
  {
    id: 'task-3',
    title: 'Prepare for Interview',
    description: 'Review typical system design questions and practice behavioral answers.',
    dueDate: new Date(Date.now() + 48 * 3600000).toISOString().slice(0, 16),
    priority: 'MEDIUM',
    completed: true,
    createdAt: new Date().toISOString(),
    category: 'Career'
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([
    { id: 'h1', name: 'Gym', completed: false, startTime: '18:00', endTime: '19:30' },
    { id: 'h2', name: 'Hydration', completed: false },
    { id: 'h3', name: 'Study', completed: false },
    { id: 'h4', name: 'Diet', completed: false }
  ]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [rescuingTasks, setRescuingTasks] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rescueTaskToInit, setRescueTaskToInit] = useState<Task | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Morning Wake-Up Alarm State
  const [morningAlarmTime, setMorningAlarmTime] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rescue_morning_alarm_time') || '07:00';
    }
    return '07:00';
  });

  const [morningAlarmEnabled, setMorningAlarmEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rescue_morning_alarm_enabled') === 'true';
    }
    return false;
  });

  // Active alarm modal state
  const [activeAlarm, setActiveAlarm] = useState<{
    id: string;
    title: string;
    type: 'WAKEUP' | 'HABIT' | 'TASK' | 'TEST';
    timeLabel?: string;
  } | null>(null);

  // Alarm sound control
  const alarmIntervalRef = useRef<any>(null);

  const startAlarmSound = () => {
    if (alarmIntervalRef.current) return;
    
    const playBeep = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        
        const playSingleBeep = (timeOffset: number, freq = 880) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
          gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + timeOffset + 0.015);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.18);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(ctx.currentTime + timeOffset);
          osc.stop(ctx.currentTime + timeOffset + 0.22);
        };

        // play 3 fast high-pitch "bip bip bip"
        playSingleBeep(0, 980);
        playSingleBeep(0.18, 980);
        playSingleBeep(0.36, 1100);
      } catch (e) {
        console.warn("Alarm audio failed", e);
      }
    };

    playBeep();
    alarmIntervalRef.current = setInterval(playBeep, 1200);
  };

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (activeAlarm) {
      startAlarmSound();
    } else {
      stopAlarmSound();
    }
    return () => {
      stopAlarmSound();
    };
  }, [activeAlarm]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rescue_settings_dark_mode') !== 'false';
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rescue_settings_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rescue_ai_onboarding_completed') === 'true';
    }
    return true;
  });

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rescue_ai_username') || 'User';
    }
    return 'User';
  });

  const [userAge, setUserAge] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('rescue_ai_userage') || '25', 10);
    }
    return 25;
  });

  const handleCompleteOnboarding = (data: { name: string; age: number; notificationsGranted: boolean }) => {
    setUserName(data.name);
    setUserAge(data.age);
    setIsOnboardingCompleted(true);
    if (data.notificationsGranted) {
      setNotificationPermission('granted');
    }
  };

  const handleUpdateProfile = (name: string, age: number) => {
    setUserName(name);
    setUserAge(age);
    localStorage.setItem('rescue_ai_username', name);
    localStorage.setItem('rescue_ai_userage', age.toString());
  };

  const handleUpdateMorningAlarm = (time: string, enabled: boolean) => {
    setMorningAlarmTime(time);
    setMorningAlarmEnabled(enabled);
    localStorage.setItem('rescue_morning_alarm_time', time);
    localStorage.setItem('rescue_morning_alarm_enabled', enabled.toString());
  };

  const handleTestAlarm = () => {
    setActiveAlarm({
      id: 'test-alarm-' + Date.now(),
      title: 'Auditory Alarm System Test 🔊',
      type: 'TEST',
      timeLabel: 'BIP BIP'
    });
  };

  const handleResetApp = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
    window.location.reload();
  };

  const playSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Dreamy, elegant major pentatonic chime sequence (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        // Instant pleasant pluck attack
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.015);
        // Exponential ringing tail decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.55);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.6);
      });
    } catch (e) {
      console.warn('Success chime playback bypassed or unsupported:', e);
    }
  };

  const triggerSubtasksCompletedCelebration = () => {
    setShowConfetti(true);
    playSuccessSound();
  };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rescue_ai_chat_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load chat history", e);
    }
    setChatMessages([
      { 
        id: '1', 
        role: 'model', 
        text: "Hello! I'm your Rescue.AI assistant. Tell me about a task you need to do, and I'll help you define it. Or tap 'Rescue Me' on any task in your home dashboard to get custom mental tips and schedule subtasks!" 
      }
    ]);
  }, []);

  const saveChatMessages = (newMsgs: any[]) => {
    setChatMessages(newMsgs);
    try {
      localStorage.setItem('rescue_ai_chat_history', JSON.stringify(newMsgs));
    } catch (e) {}
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification("Notifications Enabled!", {
            body: "You will now receive alerts for task due dates and reminders.",
            icon: '/favicon.ico'
          });
        }
      } catch (e) {
        console.error("Error requesting notification permission:", e);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load triggered reminders from localStorage
    let triggered: string[] = [];
    try {
      const stored = localStorage.getItem('taskboard_triggered_alerts');
      if (stored) {
        triggered = JSON.parse(stored);
      }
    } catch (e) {}

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const d = new Date();
      const currentHHMM = d.toTimeString().slice(0, 5); // "HH:MM" local format
      const todayStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      let updated = false;

      // 1. Tasks reminder and due alarms check
      tasks.forEach(task => {
        if (task.completed) return;
        if (!task.dueDate) return;

        const dueTime = new Date(task.dueDate).getTime();
        if (isNaN(dueTime)) return;

        // A. Configured Reminder Check
        if (typeof task.reminderMinutes === 'number' && task.reminderMinutes >= 0) {
          const reminderTime = dueTime - task.reminderMinutes * 60 * 1000;
          const reminderKey = `${task.id}-reminder-${task.reminderMinutes}`;

          // Trigger reminder if within the window and not already triggered
          if (now >= reminderTime && now < dueTime && !triggered.includes(reminderKey)) {
            triggered.push(reminderKey);
            updated = true;

            setActiveAlarm({
              id: reminderKey,
              title: `Upcoming Task Reminder: ${task.title}`,
              type: 'TASK',
              timeLabel: `Due in ${task.reminderMinutes} minutes`
            });

            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(`Task Reminder: ${task.title}`, {
                  body: `Due in ${task.reminderMinutes} minutes. ${task.description || ''}`,
                  tag: reminderKey
                });
              } catch (e) {
                console.error("Failed to show notification:", e);
              }
            }
          }
        }

        // B. Exact Due Time Check
        const dueKey = `${task.id}-due`;
        // Alert if now is past due time but not older than 10 minutes (to avoid stale alerts on reload)
        if (now >= dueTime && now < dueTime + 10 * 60 * 1000 && !triggered.includes(dueKey)) {
          triggered.push(dueKey);
          updated = true;

          setActiveAlarm({
            id: dueKey,
            title: `Task Due Now: ${task.title}`,
            type: 'TASK',
            timeLabel: 'Due Now'
          });

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(`Task Due Now: ${task.title}`, {
                body: task.description || 'This task is now due!',
                tag: dueKey,
                requireInteraction: true
              });
            } catch (e) {
              console.error("Failed to show notification:", e);
            }
          }
        }
      });

      // 2. Morning Wake-up Alarm Check
      if (morningAlarmEnabled && currentHHMM === morningAlarmTime) {
        const morningKey = `morning-alarm-${todayStr}-${currentHHMM}`;
        if (!triggered.includes(morningKey)) {
          triggered.push(morningKey);
          updated = true;

          setActiveAlarm({
            id: `morning-${todayStr}-${currentHHMM}`,
            title: `Morning Wake-Up Alarm! ☀️`,
            type: 'WAKEUP',
            timeLabel: currentHHMM
          });

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification("Rise and Shine! ☀️", {
                body: "It is morning wake-up time! Let's clear your mind and tackle your day.",
                tag: morningKey,
                requireInteraction: true
              });
            } catch (e) {
              console.error("Failed to show morning notification:", e);
            }
          }
        }
      }

      // 3. Habits Start Time Alert Check
      habits.forEach(habit => {
        if (habit.completed) return;
        if (!habit.startTime) return;
        if (!habit.alarmEnabled) return;

        if (habit.startTime === currentHHMM) {
          const habitKey = `habit-${habit.id}-${todayStr}-${currentHHMM}`;
          if (!triggered.includes(habitKey)) {
            triggered.push(habitKey);
            updated = true;

            setActiveAlarm({
              id: `habit-${habit.id}-${todayStr}-${currentHHMM}`,
              title: `Daily Habit Alert: ${habit.name}`,
              type: 'HABIT',
              timeLabel: habit.startTime
            });

            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(`Habit Reminder: ${habit.name}`, {
                  body: `Time to start your habit: ${habit.name} (${habit.startTime})`,
                  tag: habitKey
                });
              } catch (e) {
                console.error("Failed to show habit notification:", e);
              }
            }
          }
        }
      });

      if (updated) {
        try {
          localStorage.setItem('taskboard_triggered_alerts', JSON.stringify(triggered));
        } catch (e) {}
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [tasks, habits, morningAlarmEnabled, morningAlarmTime]);

  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem('taskboard_habits_v2');
      if (storedHabits) {
        try {
          const parsed = JSON.parse(storedHabits);
          if (Array.isArray(parsed)) {
            const validHabits = parsed.filter(h => h && typeof h === 'object' && h.id);
            if (validHabits.length > 0) {
              setHabits(validHabits);
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
  }, []);

  const toggleHabit = (habitId: string) => {
    const newHabits = habits.map(h => h.id === habitId ? { ...h, completed: !h.completed } : h);
    setHabits(newHabits);
    try {
      localStorage.setItem('taskboard_habits_v2', JSON.stringify(newHabits));
    } catch(e) {}
  };

  const handleDeleteHabit = (habitId: string) => {
    const newHabits = habits.filter(h => h.id !== habitId);
    setHabits(newHabits);
    try {
      localStorage.setItem('taskboard_habits_v2', JSON.stringify(newHabits));
    } catch(e) {}
  };

  const handleAddHabitDirect = (habitData: { name: string; startTime?: string; endTime?: string; alarmEnabled?: boolean }) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      completed: false
    };
    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    try {
      localStorage.setItem('taskboard_habits_v2', JSON.stringify(newHabits));
    } catch(e) {}
  };

  const handleToggleHabitAlarm = (habitId: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        return { ...h, alarmEnabled: !h.alarmEnabled };
      }
      return h;
    });
    setHabits(updated);
    try {
      localStorage.setItem('taskboard_habits_v2', JSON.stringify(updated));
    } catch(e) {}
  };

  const handleAddHabit = (habitData: Omit<Habit, 'id' | 'completed'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      completed: false
    };
    const newHabits = [...habits, newHabit];
    setHabits(newHabits);
    try {
      localStorage.setItem('taskboard_habits_v2', JSON.stringify(newHabits));
    } catch(e) {}
    setIsAddModalOpen(false);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('taskboard_tasks');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const validTasks = parsed.filter(t => t && typeof t === 'object' && t.id);
            setTasks(validTasks.length > 0 ? validTasks : INITIAL_TASKS);
          } else {
            setTasks(INITIAL_TASKS);
          }
        } catch (e) {
          setTasks(INITIAL_TASKS);
        }
      } else {
        setTasks(INITIAL_TASKS);
        try {
          localStorage.setItem('taskboard_tasks', JSON.stringify(INITIAL_TASKS));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('localStorage not available');
      setTasks(INITIAL_TASKS);
    }
  }, []);

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    try {
      localStorage.setItem('taskboard_tasks', JSON.stringify(updatedTasks));
    } catch(e) {}
  };

  const assignAvailableTime = (durationMins: number, habits: Habit[], startTimeMs: number): { startTime: string, endTime: string, newStartMs: number } => {
    let currentMs = startTimeMs;
    while (true) {
      const start = new Date(currentMs);
      const end = new Date(currentMs + durationMins * 60 * 1000);
      const startStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

      const collision = habits.some(h => {
        if (!h.startTime || !h.endTime) return false;
        return (startStr >= h.startTime && startStr < h.endTime) ||
               (endStr > h.startTime && endStr <= h.endTime) ||
               (startStr <= h.startTime && endStr >= h.endTime);
      });

      if (!collision) {
        return { startTime: startStr, endTime: endStr, newStartMs: currentMs + durationMins * 60 * 1000 };
      }

      currentMs += 15 * 60 * 1000;
    }
  };

  const handleRescueTask = (task: Task) => {
    setRescueTaskToInit(task);
    setActiveTab('chat');
  };

  const handleApplyRescueSubTasks = (taskId: string, subTasksList: string[]) => {
    const ms15 = 1000 * 60 * 15;
    let nextStartMs = Math.ceil(Date.now() / ms15) * ms15;

    const generatedSubTasks = subTasksList.map((t, idx) => {
      const timeSlot = assignAvailableTime(30, habits, nextStartMs);
      nextStartMs = timeSlot.newStartMs;
      return {
        id: `st-${Date.now()}-${idx}`,
        title: t,
        duration: '30 mins',
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        completed: false
      };
    });

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subTasks: generatedSubTasks };
      }
      return t;
    });

    saveTasks(updated);
  };

  const handleAcceptRescuePlan = (task: Task) => {
    if (!task.subTasks) return;

    const newTasks: Task[] = task.subTasks.map((st, idx) => {
      const today = new Date();
      const [hours, minutes] = st.startTime ? st.startTime.split(':') : ['00', '00'];
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      return {
        id: `task-${Date.now()}-${idx}`,
        title: st.title,
        description: `Part of: ${task.title}`,
        dueDate: today.toISOString(),
        priority: task.priority,
        completed: false,
        createdAt: new Date().toISOString(),
        category: task.category
      };
    });

    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, completed: true, subTasks: undefined };
      }
      return t;
    });

    saveTasks([...updated, ...newTasks]);
  };

  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    let triggeredCelebration = false;
    const updated = tasks.map(task => {
      if (task.id === taskId && task.subTasks) {
        const updatedSubTasks = task.subTasks.map(st => 
          st.id === subTaskId ? { ...st, completed: !st.completed } : st
        );

        const beforeAllCompleted = task.subTasks.every(st => st.completed);
        const afterAllCompleted = updatedSubTasks.every(st => st.completed);

        if (!beforeAllCompleted && afterAllCompleted) {
          triggeredCelebration = true;
        }

        return {
          ...task,
          subTasks: updatedSubTasks
        };
      }
      return task;
    });

    saveTasks(updated);

    if (triggeredCelebration) {
      triggerSubtasksCompletedCelebration();
    }
  };

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setIsAddModalOpen(false);
  };

  const handleToggleTask = (id: string) => {
    let completedNow = false;
    const updated = tasks.map(task => {
      if (task.id === id) {
        if (!task.completed) {
          completedNow = true;
        }
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveTasks(updated);
    if (completedNow) {
      triggerSubtasksCompletedCelebration();
    }
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(task => task.id !== id);
    saveTasks(updated);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const priorityWeight = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const weightA = priorityWeight[a.priority] || 0;
    const weightB = priorityWeight[b.priority] || 0;
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    const validA = !isNaN(timeA) ? timeA : Number.MAX_SAFE_INTEGER;
    const validB = !isNaN(timeB) ? timeB : Number.MAX_SAFE_INTEGER;
    return validA - validB;
  });

  const getPriorityBadgeStyles = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-[#ffde1a]/20 text-[#ffde1a] border-[#ffde1a]/30';
      case 'HIGH':
        return 'bg-orange-500/20 dark:text-orange-400 text-orange-600 border-orange-500/30';
      case 'MEDIUM':
        return 'dark:bg-neutral-700 bg-neutral-200 dark:text-neutral-300 text-neutral-700 dark:border-neutral-600 border-neutral-300';
      case 'LOW':
        return 'dark:bg-neutral-800 bg-neutral-100 dark:text-neutral-500 text-neutral-500 dark:border-neutral-700 border-neutral-200';
    }
  };

  const getCategoryBadgeStyles = (category?: string) => {
    const cat = (category || 'General').toLowerCase();
    switch (cat) {
      case 'personal':
        return 'bg-blue-500/10 dark:text-blue-400 text-blue-600 border-blue-500/20';
      case 'work':
        return 'bg-purple-500/10 dark:text-purple-400 text-purple-600 border-purple-500/20';
      case 'study':
        return 'bg-green-500/10 dark:text-green-400 text-green-600 border-green-500/20';
      case 'health':
        return 'bg-pink-500/10 dark:text-pink-400 text-pink-600 border-pink-500/20';
      default:
        return 'dark:bg-neutral-850 bg-neutral-100 dark:text-neutral-400 text-neutral-600 dark:border-neutral-800 border-neutral-200';
    }
  };

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateStr;
    }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;

  const tasksDueToday = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.dueDate) return false;
    const dueTime = new Date(t.dueDate).getTime();
    if (isNaN(dueTime)) return false;
    return dueTime < todayEnd;
  }).length;

  const tasksDueThisWeek = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.dueDate) return false;
    const dueTime = new Date(t.dueDate).getTime();
    if (isNaN(dueTime)) return false;
    return dueTime < weekEnd;
  }).length;

  if (!isOnboardingCompleted) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      habits={habits} 
      toggleHabit={toggleHabit}
      userName={userName}
      onSettingsClick={() => setActiveTab('settings')}
    >
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4">
          
          {/* Daily Habits Quick View (Mobile optimized) */}
          <div className="lg:hidden col-span-1">
            <HabitsWidget 
              habits={habits} 
              onToggle={toggleHabit} 
              onDelete={handleDeleteHabit} 
              onAdd={handleAddHabitDirect} 
              onToggleAlarm={handleToggleHabitAlarm}
            />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b dark:border-neutral-800 border-neutral-200">
              <h2 className="font-display font-medium text-xl dark:text-white text-neutral-900">To-Do List</h2>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800/80 border-neutral-200 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden group hover:dark:border-neutral-700/60 hover:border-neutral-300 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffde1a]/3 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest dark:text-neutral-400 text-neutral-500 font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffde1a] animate-pulse" />
                    <span>Should Complete Today</span>
                  </span>
                  <p className="text-2xl font-display font-bold dark:text-white text-neutral-900 tracking-tight">{tasksDueToday}</p>
                </div>
                <div className="p-3 bg-[#ffde1a]/10 text-[#ffde1a] rounded-xl border border-[#ffde1a]/15 group-hover:scale-110 transition-transform duration-300">
                  <CheckSquare size={18} />
                </div>
              </div>

              <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800/80 border-neutral-200 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden group hover:dark:border-neutral-700/60 hover:border-neutral-300 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffde1a]/3 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest dark:text-neutral-400 text-neutral-500 font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffde1a] animate-pulse" />
                    <span>Remaining This Week</span>
                  </span>
                  <p className="text-2xl font-display font-bold dark:text-white text-neutral-900 tracking-tight">{tasksDueThisWeek}</p>
                </div>
                <div className="p-3 bg-[#ffde1a]/10 text-[#ffde1a] rounded-xl border border-[#ffde1a]/15 group-hover:scale-110 transition-transform duration-300">
                  <Calendar size={18} />
                </div>
              </div>
            </div>

            {notificationPermission !== 'granted' && (
              <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="p-2 bg-[#ffde1a]/10 text-[#ffde1a] rounded-lg flex-shrink-0">
                    <Bell size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium dark:text-white text-neutral-900">Enable Browser Notifications</h4>
                    <p className="text-xs dark:text-neutral-400 text-neutral-500 mt-0.5">
                      {notificationPermission === 'denied' 
                        ? "Notifications are blocked. Please allow notifications in your browser settings to receive task reminders."
                        : "Get real-time browser alerts when your tasks are due or when reminders trigger."}
                    </p>
                  </div>
                </div>
                {notificationPermission !== 'denied' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-[#ffde1a] hover:bg-[#e0c310] text-black font-medium text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    Enable Alerts
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3">
              {sortedTasks.length === 0 ? (
                <div className="dark:bg-[#121212] bg-white border border-dashed dark:border-neutral-800 border-neutral-300 rounded-xl p-12 text-center shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 dark:bg-[#1a1a1a] bg-neutral-100 rounded-full dark:text-neutral-500 text-neutral-400 mb-4">
                    <Inbox size={24} />
                  </div>
                  <p className="font-medium dark:text-neutral-400 text-neutral-600 text-base">No tasks</p>
                  <p className="text-sm dark:text-neutral-600 text-neutral-400 mt-1">Tap the + button to add a task.</p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`dark:bg-[#121212] bg-white border rounded-xl p-5 relative group flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors shadow-sm ${task.completed ? 'dark:border-neutral-800/50 border-neutral-200/50 opacity-60' : 'dark:border-neutral-800 border-neutral-200'}`}
                  >
                    <div className="flex items-start space-x-4 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-[#ffde1a] hover:text-[#e0c310] transition-transform active:scale-95 cursor-pointer flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle size={22} className="fill-[#ffde1a]/10 text-[#ffde1a]" />
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-full border-2 dark:border-neutral-600 border-neutral-300 hover:border-[#ffde1a] transition-colors" />
                        )}
                      </button>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityBadgeStyles(task.priority)}`}>
                            {task.priority === 'URGENT' ? 'Urgent' : task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                          </span>
                          {task.category && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryBadgeStyles(task.category)}`}>
                              {task.category}
                            </span>
                          )}
                          {!task.completed && !task.subTasks && (
                             <button 
                               onClick={() => handleRescueTask(task)}
                               disabled={rescuingTasks[task.id]}
                               className={`ml-auto flex items-center space-x-1 px-2 py-0.5 rounded-full border border-[#ffde1a]/50 text-[10px] font-medium text-[#ffde1a] hover:bg-[#ffde1a]/10 transition-colors ${rescuingTasks[task.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                             >
                               <Hourglass size={12} />
                               <span>{rescuingTasks[task.id] ? 'AI analyzing...' : 'Rescue Me'}</span>
                             </button>
                           )}
                        </div>

                        <h4 className={`font-medium text-base break-words ${task.completed ? 'line-through dark:text-neutral-500 text-neutral-400' : 'dark:text-white text-neutral-900'}`}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className={`text-sm leading-relaxed ${task.completed ? 'dark:text-neutral-600 text-neutral-400' : 'dark:text-neutral-400 text-neutral-600'}`}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs dark:text-neutral-500 text-neutral-500 pt-1">
                          <div className="flex items-center space-x-1.5">
                            <Calendar size={13} className={task.completed ? 'dark:text-neutral-600 text-neutral-400' : 'text-[#ffde1a]'} />
                            <span className={task.completed ? 'dark:text-neutral-600 text-neutral-400' : 'dark:text-neutral-400 text-neutral-600'}>
                              Due: {formatDeadline(task.dueDate)}
                            </span>
                          </div>
                          {!task.completed && typeof task.reminderMinutes === 'number' && task.reminderMinutes >= 0 && (
                            <div className="flex items-center space-x-1.5 dark:text-neutral-400 text-neutral-500">
                              <Bell size={12} className="text-[#ffde1a]" />
                              <span>
                                Alert {task.reminderMinutes === 0
                                  ? 'at event time'
                                  : task.reminderMinutes === 60
                                  ? '1 hr before'
                                  : task.reminderMinutes === 120
                                  ? '2 hrs before'
                                  : task.reminderMinutes === 1440
                                  ? '1 day before'
                                  : `${task.reminderMinutes} mins before`}
                              </span>
                            </div>
                          )}
                        </div>

                        {task.subTasks && task.subTasks.length > 0 && !task.completed && (
                          <div className="mt-4 pt-3 border-t dark:border-neutral-800 border-neutral-200 space-y-2">
                            <div className="text-[10px] text-[#ffde1a] font-mono tracking-widest font-bold uppercase mb-2">
                              AI Rescue Plan
                            </div>
                            {task.subTasks.map(st => (
                              <div key={st.id} className="flex items-start space-x-3 group/sub">
                                <button onClick={() => handleToggleSubTask(task.id, st.id)} className="mt-0.5 dark:text-neutral-500 text-neutral-400 hover:text-[#ffde1a]">
                                  {st.completed ? <CheckSquare size={16} className="text-[#ffde1a]" /> : <Square size={16} />}
                                </button>
                                <div className={`text-sm flex-1 ${st.completed ? 'line-through dark:text-neutral-600 text-neutral-400' : 'dark:text-neutral-300 text-neutral-700'}`}>
                                  {st.startTime && st.endTime && (
                                    <span className="inline-block px-1.5 py-0.5 rounded dark:bg-neutral-800 bg-neutral-100 text-[#ffde1a] font-mono text-[10px] mr-2">
                                      {st.startTime} - {st.endTime}
                                    </span>
                                  )}
                                  {st.title} {st.duration && <span className="dark:text-neutral-600 text-neutral-400 text-xs ml-1">({st.duration})</span>}
                                </div>
                              </div>
                            ))}
                            <button onClick={() => handleAcceptRescuePlan(task)} className="mt-3 w-full bg-[#ffde1a] text-black text-xs font-bold py-2 rounded-lg hover:bg-[#e0c310] transition-colors cursor-pointer">
                              Accept Rescue Plan
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end self-end md:self-start flex-shrink-0">
                      <button 
                        onClick={() => handleDeleteTask(task.id)} 
                        className="dark:text-neutral-500 text-neutral-400 hover:text-red-400 p-2 rounded-lg hover:dark:bg-neutral-800/80 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Habits Sidebar Widget (Desktop layout side-by-side) */}
          <div className="hidden lg:block lg:col-span-4 self-start">
            <HabitsWidget 
              habits={habits} 
              onToggle={toggleHabit} 
              onDelete={handleDeleteHabit} 
              onAdd={handleAddHabitDirect} 
              onToggleAlarm={handleToggleHabitAlarm}
            />
          </div>
        </div>
      )}

      {activeTab === 'calendar' && <CalendarView tasks={tasks} />}
      {activeTab === 'chat' && (
        <ChatView 
          onAddTask={handleAddTask} 
          rescueTaskToInit={rescueTaskToInit} 
          onClearRescueTask={() => setRescueTaskToInit(null)}
          onAddSubTasks={handleApplyRescueSubTasks}
          messages={chatMessages}
          onSaveMessages={saveChatMessages}
          tasks={tasks}
          habits={habits}
          userName={userName}
          userAge={userAge}
        />
      )}
      {activeTab === 'audio' && (
        <VoiceView 
          tasks={tasks}
          habits={habits}
          userName={userName}
          userAge={userAge}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onAddHabit={handleAddHabitDirect}
          onToggleHabit={toggleHabit}
          onDeleteHabit={handleDeleteHabit}
          onToggleHabitAlarm={handleToggleHabitAlarm}
          setActiveTab={setActiveTab}
        />
      )}
      {activeTab === 'growth' && <GrowthView habits={habits} />}
      {activeTab === 'focus' && (
        <FocusView 
          tasks={tasks}
          userName={userName}
          onAddTask={handleAddTask}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsView 
          onResetApp={handleResetApp} 
          userName={userName} 
          userAge={userAge} 
          onUpdateProfile={handleUpdateProfile} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={setIsDarkMode}
          morningAlarmTime={morningAlarmTime}
          morningAlarmEnabled={morningAlarmEnabled}
          onUpdateMorningAlarm={handleUpdateMorningAlarm}
          onTestAlarm={handleTestAlarm}
        />
      )}

      {/* Floating Action Button (FAB) for adding tasks */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[#ffde1a] hover:bg-[#e0c310] text-black rounded-full flex items-center justify-center shadow-xl shadow-neutral-950/10 dark:shadow-black/50 transition-transform active:scale-95 z-40 cursor-pointer"
      >
        <Plus size={28} />
      </button>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 dark:bg-black/80 bg-neutral-900/60 z-50 flex items-center justify-center p-4">
          <div className="dark:bg-[#121212] bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border dark:border-neutral-800 border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-neutral-800 border-neutral-200 dark:bg-[#1a1a1a] bg-neutral-50">
              <h2 className="font-display font-medium text-lg dark:text-white text-neutral-900">Add New</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 dark:hover:text-white hover:text-neutral-900 cursor-pointer">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <TaskInput onAddTask={handleAddTask} onAddHabit={handleAddHabit} habits={habits} />
            </div>
          </div>
        </div>
      )}

      {/* Confetti celebration container */}
      <Confetti active={showConfetti} onClose={() => setShowConfetti(false)} />

      {/* Active Alarm Modal */}
      {activeAlarm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="dark:bg-[#121212] bg-white w-full max-w-md rounded-2xl p-8 border dark:border-[#ffde1a]/30 border-neutral-200 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
            
            {/* Alarm ring pulse indicator */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ffd31a] to-[#ffde1a] animate-pulse" />
            
            {/* Sun rays pulse or clock icon */}
            <div className="relative flex items-center justify-center w-24 h-24 bg-[#ffde1a]/10 dark:bg-[#ffde1a]/5 rounded-full mb-6 border border-[#ffde1a]/20 animate-bounce duration-1000">
              <div className="absolute inset-0 rounded-full bg-[#ffde1a]/5 animate-ping duration-1000" />
              <Clock size={42} className="text-[#ffde1a] animate-pulse" />
            </div>

            <span className="text-[10px] font-mono tracking-widest font-bold uppercase dark:text-neutral-400 text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full border dark:border-neutral-700 border-neutral-200">
              {activeAlarm.type === 'WAKEUP' ? '☀️ WAKE UP ALARM' : activeAlarm.type === 'HABIT' ? '🔥 HABIT REMINDER' : activeAlarm.type === 'TASK' ? '⏰ TASK REMINDER' : '🔊 TEST BEEP'}
            </span>

            <h2 className="text-xl font-display font-bold dark:text-white text-neutral-900 mt-4 leading-snug">
              {activeAlarm.title}
            </h2>

            {activeAlarm.timeLabel && (
              <p className="text-2xl font-mono font-bold text-[#ffde1a] mt-2 tracking-wide">
                {activeAlarm.timeLabel}
              </p>
            )}

            <p className="text-xs dark:text-neutral-400 text-neutral-500 mt-3 max-w-xs leading-relaxed">
              {activeAlarm.type === 'WAKEUP' 
                ? 'Time to rise, shine, and complete your morning tasks with Rescue.AI!' 
                : activeAlarm.type === 'HABIT'
                ? 'Your scheduled healthy habit is ready! Let’s keep your daily streak alive.'
                : activeAlarm.type === 'TASK'
                ? 'This task requires your active focus. Avoid procrastination!'
                : 'Your auditory alarm system is working flawlessly. Bip bip bip!'}
            </p>

            {/* Alarm Controls */}
            <div className="mt-8 grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => {
                  // Snooze logic: Alarm triggers again in 5 minutes (300000ms)
                  const alarmCopy = { ...activeAlarm, id: 'snoozed-' + Date.now(), timeLabel: 'Snoozed +5m' };
                  setActiveAlarm(null);
                  setTimeout(() => {
                    setActiveAlarm(alarmCopy);
                  }, 300000);
                }}
                className="py-3 px-4 bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 hover:bg-neutral-200 border dark:border-neutral-800 border-neutral-300 dark:text-neutral-300 text-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
              >
                Snooze 5m
              </button>

              <button
                onClick={() => {
                  setActiveAlarm(null);
                }}
                className="py-3 px-4 bg-[#ffde1a] hover:bg-[#e0c310] text-black text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-[#ffde1a]/10 cursor-pointer active:scale-95"
              >
                Dismiss
              </button>
            </div>

            {activeAlarm.type === 'HABIT' && (
              <button
                onClick={() => {
                  // Mark the corresponding habit as completed
                  const parts = activeAlarm.id.split('-'); // id structure: habit-h1-YYYY-MM-DD-HH:MM
                  const habitId = parts[1];
                  if (habitId) {
                    toggleHabit(habitId);
                  }
                  setActiveAlarm(null);
                }}
                className="mt-4 text-xs text-[#ffde1a] font-medium hover:underline flex items-center justify-center space-x-1"
              >
                <span>✨ Mark Habit as Done</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
