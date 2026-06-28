/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Inbox,
  CalendarDays,
  LineChart,
  MessageSquare,
  Mic,
  Settings,
  Shield
} from 'lucide-react';
import { Habit } from '../types';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  habits: Habit[];
  toggleHabit: (habitId: string) => void;
  userName?: string;
  onSettingsClick?: () => void;
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  habits, 
  toggleHabit,
  userName,
  onSettingsClick
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Inbox },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'audio', label: 'Voice', icon: Mic },
    { id: 'focus', label: 'Focus Guard', icon: Shield },
    { id: 'growth', label: 'Growth', icon: LineChart },
  ];

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e] bg-[#f8fafc] dark:text-[#f5f5f5] text-neutral-800 flex flex-col md:flex-row font-sans pb-20 md:pb-0 transition-colors duration-200">
      {/* Mobile Header */}
      <header className="md:hidden dark:bg-[#121212] bg-white border-b dark:border-neutral-800 border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <Logo className="w-8 h-8" tile />
          <span className="font-display font-medium dark:text-white text-neutral-900 text-sm">
            {activeTab === 'dashboard' ? `Hey ${userName || 'User'} ⚡` : 'Rescue.AI'}
          </span>
        </div>

        {/* Pulsing indicator and Settings button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-500 font-mono uppercase font-bold tracking-wider">Active</span>
          </div>
          <button 
            onClick={onSettingsClick} 
            className="p-1.5 dark:text-neutral-400 text-neutral-500 hover:dark:text-white hover:text-neutral-900 rounded-lg hover:dark:bg-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex inset-y-0 left-0 z-40 w-64 dark:bg-[#121212] bg-white border-r dark:border-neutral-800 border-neutral-200 flex-col justify-between transition-colors duration-200">
        <div>
          {/* Logo / Brand Header */}
          <div className="px-5 py-5 flex items-center space-x-3">
            <Logo className="w-8 h-8" tile />
            <span className="font-display font-medium text-lg dark:text-white text-neutral-900">
              Rescue.AI
            </span>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-2">
            <div className="text-[10px] dark:text-neutral-500 text-neutral-400 font-mono tracking-widest font-bold mb-2 uppercase">
              Core Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center px-3 py-3 text-sm text-left rounded-lg
                    transition-all duration-150 cursor-pointer
                    ${isActive 
                      ? 'dark:bg-neutral-800/80 bg-neutral-100 dark:text-white text-neutral-900 font-medium border border-neutral-200/50 dark:border-transparent' 
                      : 'bg-transparent dark:text-neutral-400 text-neutral-600 hover:dark:bg-neutral-800/50 hover:bg-neutral-50 hover:text-neutral-900'
                    }
                  `}
                >
                  <Icon size={18} className="mr-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t dark:border-neutral-800 border-neutral-200 space-y-4">
          <div className="dark:bg-[#1a1a1a] bg-neutral-100 rounded-lg p-3 text-center border dark:border-transparent border-neutral-200/60">
            <div className="text-xs dark:text-neutral-500 text-neutral-500 flex items-center justify-center space-x-1.5">
              <Clock size={12} className="text-[#ffde1a]" />
              <span>Current Time</span>
            </div>
            <div className="text-lg font-mono font-medium dark:text-white text-neutral-900 mt-1">
              {currentTime || '00:00:00'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 dark:bg-[#0b0b0b] bg-[#f8fafc] min-h-[calc(100vh-60px)] md:min-h-screen transition-colors duration-200">
        {/* Top bar (Desktop) */}
        <header className="hidden md:flex border-b dark:border-neutral-800 border-neutral-200 dark:bg-[#121212]/30 bg-white px-8 py-5 items-center justify-between transition-colors duration-200">
          <div>
            {activeTab === 'dashboard' ? (
              <div>
                <h1 className="font-display font-medium text-xl dark:text-white text-neutral-900">
                  Hey {userName || 'User'} ⚡
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    Rescue AI is active and monitoring
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-display font-medium text-xl dark:text-white text-neutral-900">
                  {activeTab === 'settings' ? 'System Settings' : (navItems.find(i => i.id === activeTab)?.label || 'Overview')}
                </h1>
                <p className="text-sm dark:text-neutral-500 text-neutral-500 mt-0.5">
                  {activeTab === 'settings' 
                    ? 'Configure system parameters, alert notifications, and profile details.'
                    : 'Manage your daily tasks and focus sessions.'}
                </p>
              </div>
            )}
          </div>

          {/* Header Action Button */}
          <div>
            <button
              onClick={onSettingsClick}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg border transition-all cursor-pointer text-xs font-semibold uppercase tracking-wider font-mono ${
                activeTab === 'settings'
                  ? 'bg-[#ffde1a] border-[#ffde1a] text-black font-bold shadow-[0_0_12px_rgba(255,222,26,0.15)] animate-pulse'
                  : 'dark:bg-neutral-900 bg-white dark:border-neutral-800 border-neutral-200 dark:text-neutral-300 text-neutral-600 hover:dark:bg-neutral-800 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
              title="Settings"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </div>
        </header>

        {/* Children Render Pane */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto relative">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full dark:bg-[#121212] bg-white border-t dark:border-neutral-800 border-neutral-200 flex justify-around items-center py-2 px-2 z-50 pb-safe shadow-lg transition-colors duration-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-[64px] ${isActive ? 'text-[#ffde1a]' : 'dark:text-neutral-500 text-neutral-500 hover:dark:text-neutral-300 hover:text-neutral-800'}`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
