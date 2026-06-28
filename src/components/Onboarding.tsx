import React, { useState } from 'react';
import { Sparkles, Bell, ArrowRight, User, Calendar } from 'lucide-react';
import Logo from './Logo';

interface OnboardingProps {
  onComplete: (data: { name: string; age: number; notificationsGranted: boolean }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setError('Please enter a valid age.');
      return;
    }
    setError('');
    setStep(2);
  };

  const requestNotifications = async () => {
    let granted = false;
    if (typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        granted = permission === 'granted';
      } catch (e) {
        console.error('Notification permission request bypassed:', e);
      }
    }
    completeOnboarding(granted);
  };

  const completeOnboarding = (notificationsGranted: boolean) => {
    const ageNum = parseInt(age, 10) || 25;
    
    // Save locally
    localStorage.setItem('rescue_ai_username', name.trim());
    localStorage.setItem('rescue_ai_userage', ageNum.toString());
    localStorage.setItem('rescue_ai_onboarding_completed', 'true');
    localStorage.setItem('rescue_ai_notifications_enabled', notificationsGranted ? 'true' : 'false');
    
    onComplete({
      name: name.trim(),
      age: ageNum,
      notificationsGranted
    });
  };

  return (
    <div className="fixed inset-0 z-50 dark:bg-[#0a0a0a] bg-neutral-100 flex items-center justify-center p-4 overflow-y-auto">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ffde1a]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Logo className="w-6 h-6" tile />
            <span className="font-mono text-[10px] tracking-widest text-neutral-500 font-bold uppercase">
              Rescue.AI Init
            </span>
          </div>
          <div className="flex space-x-1.5">
            <div className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 1 ? 'bg-[#ffde1a]' : 'dark:bg-neutral-800 bg-neutral-200'}`} />
            <div className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[#ffde1a]' : 'dark:bg-neutral-800 bg-neutral-200'}`} />
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-start">
                <Logo className="w-14 h-14" tile />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 bg-[#ffde1a]/10 text-[#ffde1a] px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                  <Sparkles size={11} />
                  <span>Onboarding</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-medium dark:text-white text-neutral-900 tracking-tight">
                  Welcome to Rescue.AI
                </h1>
                <p className="dark:text-neutral-400 text-neutral-600 text-sm leading-relaxed">
                  Let AI handle the emergencies. Organize your heavy work, automate reminders, and stay focused.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-500 font-bold">
                  What should we call you?
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your name"
                    className="w-full dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800 border-neutral-200 focus:border-[#ffde1a]/50 rounded-xl py-3 pl-10 pr-4 dark:text-white text-neutral-900 text-sm outline-none transition-colors dark:placeholder:text-neutral-600 placeholder:text-neutral-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Age Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-500 font-bold">
                  Your Age
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                    className="w-full dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800 border-neutral-200 focus:border-[#ffde1a]/50 rounded-xl py-3 pl-10 pr-4 dark:text-white text-neutral-900 text-sm outline-none transition-colors dark:placeholder:text-neutral-600 placeholder:text-neutral-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#ffde1a] hover:bg-[#e0c310] text-black text-sm font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#ffde1a]/10 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Initialize Assistant</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-start">
                <Logo className="w-14 h-14" tile />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 bg-[#ffde1a]/10 text-[#ffde1a] px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                  <Bell size={11} />
                  <span>Security & Alerts</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-medium dark:text-white text-neutral-900 tracking-tight">
                  Keep App Updated
                </h1>
                <p className="dark:text-neutral-400 text-neutral-600 text-sm leading-relaxed">
                  Rescue AI needs notifications to send you instant alerts and critical updates.
                </p>
              </div>
            </div>

            <div className="dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800/80 border-neutral-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start space-x-3 text-xs dark:text-neutral-400 text-neutral-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffde1a] mt-1.5 flex-shrink-0" />
                <p>Instant alarms when a priority task's deadline is approaching.</p>
              </div>
              <div className="flex items-start space-x-3 text-xs dark:text-neutral-400 text-neutral-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffde1a] mt-1.5 flex-shrink-0" />
                <p>AI micro-reminders to nudge you to drink water or exercise.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={requestNotifications}
                className="w-full bg-[#ffde1a] hover:bg-[#e0c310] text-black text-sm font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#ffde1a]/10 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Enable Notifications</span>
                <Bell size={16} />
              </button>

              <button
                onClick={() => completeOnboarding(false)}
                className="w-full dark:bg-neutral-900 bg-white hover:dark:bg-neutral-800 hover:bg-neutral-50 border dark:border-neutral-800 border-neutral-200 hover:dark:border-neutral-700 hover:border-neutral-300 dark:text-neutral-400 text-neutral-600 hover:dark:text-white hover:text-neutral-900 text-sm font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
