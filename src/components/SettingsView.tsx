import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  ShieldAlert, 
  Moon, 
  Sun, 
  RotateCcw, 
  Users, 
  Cpu, 
  Check, 
  AlertTriangle,
  Clock,
  Volume2
} from 'lucide-react';

interface SettingsViewProps {
  onResetApp: () => void;
  userName: string;
  userAge: number;
  onUpdateProfile: (name: string, age: number) => void;
  isDarkMode: boolean;
  onToggleDarkMode: (enabled: boolean) => void;
  morningAlarmTime: string;
  morningAlarmEnabled: boolean;
  onUpdateMorningAlarm: (time: string, enabled: boolean) => void;
  onTestAlarm: () => void;
}

export default function SettingsView({ 
  onResetApp, 
  userName, 
  userAge, 
  onUpdateProfile,
  isDarkMode,
  onToggleDarkMode,
  morningAlarmTime,
  morningAlarmEnabled,
  onUpdateMorningAlarm,
  onTestAlarm
}: SettingsViewProps) {
  // Profile Details
  const [name, setName] = useState(userName);
  const [age, setAge] = useState(userAge.toString());
  const [profileSaved, setProfileSaved] = useState(false);

  // Alerts & Notifications
  const [criticalPush, setCriticalPush] = useState(() => {
    return localStorage.getItem('rescue_settings_critical_push') !== 'false';
  });
  const [aiNudges, setAiNudges] = useState(() => {
    return localStorage.getItem('rescue_settings_ai_nudges') !== 'false';
  });

  // Rescue AI Preferences
  const [alertSensitivity, setAlertSensitivity] = useState(() => {
    return localStorage.getItem('rescue_settings_sensitivity') || 'Proactive';
  });
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    return localStorage.getItem('rescue_settings_contacts') || 'Sarah (Partner) - 555-0199';
  });
  const [aiActionMode, setAiActionMode] = useState(() => {
    return localStorage.getItem('rescue_settings_action_mode') || 'Autopilot';
  });

  // Saving settings inside individual triggers
  useEffect(() => {
    localStorage.setItem('rescue_settings_critical_push', criticalPush.toString());
  }, [criticalPush]);

  useEffect(() => {
    localStorage.setItem('rescue_settings_ai_nudges', aiNudges.toString());
  }, [aiNudges]);

  useEffect(() => {
    localStorage.setItem('rescue_settings_sensitivity', alertSensitivity);
  }, [alertSensitivity]);

  useEffect(() => {
    localStorage.setItem('rescue_settings_contacts', emergencyContacts);
  }, [emergencyContacts]);

  useEffect(() => {
    localStorage.setItem('rescue_settings_action_mode', aiActionMode);
  }, [aiActionMode]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ageNum = parseInt(age, 10) || 25;
    onUpdateProfile(name.trim(), ageNum);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Settings Intro Title */}
      <div className="space-y-1 border-b dark:border-neutral-800 border-neutral-200 pb-5">
        <h2 className="text-2xl font-display font-medium dark:text-white text-neutral-900 tracking-tight">
          System Preferences
        </h2>
        <p className="text-sm dark:text-neutral-500 text-neutral-500">
          Configure Rescue.AI notification priorities, sensitivity level, and emergency overrides.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Profile & Appearance */}
        <div className="space-y-8">
          
          {/* Profile Details Card */}
          <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-600 font-bold mb-4 flex items-center space-x-2">
              <User size={16} className="text-[#ffde1a]" />
              <span>Profile Details</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs dark:text-neutral-400 text-neutral-500 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800 border-neutral-200 focus:border-[#ffde1a]/40 rounded-lg p-2.5 dark:text-white text-neutral-950 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs dark:text-neutral-400 text-neutral-500 mb-1.5">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800 border-neutral-200 focus:border-[#ffde1a]/40 rounded-lg p-2.5 dark:text-white text-neutral-950 text-sm outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#ffde1a] hover:bg-[#e0c310] text-black font-bold text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {profileSaved ? (
                  <>
                    <Check size={14} />
                    <span>Saved Successfully</span>
                  </>
                ) : (
                  <span>Update Profile Info</span>
                )}
              </button>
            </form>
          </div>

          {/* App Appearance Card */}
          <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-600 font-bold mb-4 flex items-center space-x-2">
              {isDarkMode ? <Moon size={16} className="text-[#ffde1a]" /> : <Sun size={16} className="text-[#ffde1a]" />}
              <span>App Appearance</span>
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm dark:text-white text-neutral-900 font-medium">Sleek Light / Dark Mode</p>
                <p className="text-xs dark:text-neutral-500 text-neutral-500 mt-0.5">Toggle high-contrast twilight visual frames.</p>
              </div>
              
              <button
                onClick={() => onToggleDarkMode(!isDarkMode)}
                className="dark:bg-neutral-800 bg-neutral-100 dark:hover:bg-neutral-700 hover:bg-neutral-200 border dark:border-neutral-700 border-neutral-200 p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {isDarkMode ? (
                  <div className="flex items-center space-x-1.5 text-[#ffde1a]">
                    <Moon size={16} />
                    <span className="text-xs font-mono font-bold">Dark</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-[#ffde1a]">
                    <Sun size={16} />
                    <span className="text-xs font-mono font-bold">Light</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Morning Wake-Up Alarm & Reminders Card */}
          <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-600 font-bold mb-4 flex items-center space-x-2">
              <Clock size={16} className="text-[#ffde1a]" />
              <span>Morning Wake-Up Alarm</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm dark:text-white text-neutral-900 font-medium">Daily Alarm Enabled</p>
                  <p className="text-xs dark:text-neutral-500 text-neutral-500 mt-0.5">Play dynamic chimes and beeps at morning wake-up.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateMorningAlarm(morningAlarmTime, !morningAlarmEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${morningAlarmEnabled ? 'bg-[#ffde1a]' : 'dark:bg-neutral-800 bg-neutral-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black dark:bg-white shadow ring-0 transition duration-200 ease-in-out ${morningAlarmEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="border-t dark:border-neutral-800/60 border-neutral-200/80 pt-4">
                <label className="block text-xs dark:text-neutral-400 text-neutral-500 mb-1.5 font-medium">Wake-up Alarm Time</label>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={morningAlarmTime}
                    disabled={!morningAlarmEnabled}
                    onChange={(e) => onUpdateMorningAlarm(e.target.value, morningAlarmEnabled)}
                    className="flex-1 dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800 border-neutral-200 focus:border-[#ffde1a]/40 rounded-lg p-2.5 dark:text-white text-neutral-950 text-sm outline-none transition-colors font-mono disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={onTestAlarm}
                    className="bg-[#ffde1a]/15 text-[#ffde1a] hover:bg-[#ffde1a]/25 border border-[#ffde1a]/30 rounded-lg px-4 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
                    title="Test alarm beep sound"
                  >
                    <Volume2 size={14} />
                    <span>Test Beep</span>
                  </button>
                </div>
              </div>

              <div className="border-t dark:border-neutral-800/60 border-neutral-200/80 pt-4">
                <div className="p-3 dark:bg-[#171717] bg-neutral-50 border dark:border-neutral-800/40 border-neutral-200/80 rounded-lg flex items-start space-x-2.5">
                  <span className="text-xs text-[#ffde1a] font-bold">ℹ️</span>
                  <p className="text-[11px] dark:text-neutral-400 text-neutral-500 leading-relaxed">
                    <strong>Task & Habit Nudges:</strong> A physical <strong>"bip-bip" audio chime</strong> will sound when a scheduled habit is scheduled to start or whenever a task approaches its reminder deadline!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Preferences & Notifications */}
        <div className="space-y-8">
          
          {/* Alerts & Notifications Card */}
          <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-600 font-bold mb-4 flex items-center space-x-2">
              <Bell size={16} className="text-[#ffde1a]" />
              <span>Alerts & Notifications</span>
            </h3>

            <div className="space-y-5">
              {/* Toggle 1: Critical Push */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 pr-4">
                  <label className="text-sm dark:text-white text-neutral-900 font-medium block">Critical Alarm Pushes</label>
                  <span className="text-xs dark:text-neutral-500 text-neutral-500 block leading-relaxed">
                    Instantly play loud chimes and override silent slots when high priority tasks approach.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCriticalPush(!criticalPush)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${criticalPush ? 'bg-[#ffde1a]' : 'dark:bg-neutral-800 bg-neutral-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black dark:bg-white shadow ring-0 transition duration-200 ease-in-out ${criticalPush ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 2: AI Alerts */}
              <div className="flex items-start justify-between border-t dark:border-neutral-800/60 border-neutral-200/80 pt-4">
                <div className="space-y-0.5 pr-4">
                  <label className="text-sm dark:text-white text-neutral-900 font-medium block">AI Real-time Nudges</label>
                  <span className="text-xs dark:text-neutral-500 text-neutral-500 block leading-relaxed">
                    Trigger periodic automated recommendations and task-rescue plans based on habits.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiNudges(!aiNudges)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${aiNudges ? 'bg-[#ffde1a]' : 'dark:bg-neutral-800 bg-neutral-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black dark:bg-white shadow ring-0 transition duration-200 ease-in-out ${aiNudges ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Rescue AI Preferences Card */}
          <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-mono uppercase tracking-wider dark:text-neutral-400 text-neutral-600 font-bold mb-4 flex items-center space-x-2">
              <ShieldAlert size={16} className="text-[#ffde1a]" />
              <span>Rescue AI Preferences</span>
            </h3>

            <div className="space-y-4">
              {/* Alert Sensitivity */}
              <div className="space-y-1.5">
                <label className="block text-xs dark:text-neutral-400 text-neutral-500">Alert Sensitivity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Mild', 'Proactive', 'Urgent'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAlertSensitivity(level)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        alertSensitivity === level 
                          ? 'bg-[#ffde1a]/15 text-[#ffde1a] border-[#ffde1a]/30'
                          : 'dark:bg-[#181818] bg-neutral-50 dark:text-neutral-400 text-neutral-600 dark:border-neutral-800 border-neutral-200 hover:dark:text-white hover:text-neutral-900 hover:border-neutral-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Action Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs dark:text-neutral-400 text-neutral-500">AI Action Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Copilot', desc: 'Nudges and suggestions' },
                    { id: 'Autopilot', desc: 'Auto-reschedules subtasks' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAiActionMode(mode.id)}
                      className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                        aiActionMode === mode.id 
                          ? 'bg-[#ffde1a]/15 text-[#ffde1a] border-[#ffde1a]/30'
                          : 'dark:bg-[#181818] bg-neutral-50 dark:text-neutral-400 text-neutral-600 dark:border-neutral-800 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center space-x-1">
                        <Cpu size={12} />
                        <span>{mode.id}</span>
                      </div>
                      <div className="text-[10px] dark:text-neutral-500 text-neutral-500 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-1.5">
                <label className="block text-xs dark:text-neutral-400 text-neutral-500 flex items-center space-x-1.5">
                  <Users size={12} />
                  <span>Emergency Overrides & Contacts</span>
                </label>
                <input
                  type="text"
                  value={emergencyContacts}
                  onChange={(e) => setEmergencyContacts(e.target.value)}
                  className="w-full dark:bg-[#181818] bg-neutral-50 border dark:border-neutral-800 border-neutral-200 focus:border-[#ffde1a]/40 rounded-lg p-2.5 dark:text-white text-neutral-950 text-xs outline-none transition-colors"
                  placeholder="Contact Name & Number"
                />
                <span className="text-[10px] dark:text-neutral-600 text-neutral-500 block leading-normal">
                  These contacts receive SMS notifications automatically through active agent guards if emergencies arise.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Dangerous/Advanced Zone */}
      <div className="dark:bg-red-500/5 bg-red-500/5 border dark:border-red-500/20 border-red-500/20 rounded-xl p-6 mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-500">Reset Application Storage</h4>
            <p className="text-xs dark:text-neutral-500 text-neutral-500 mt-0.5 max-w-md leading-relaxed">
              Resets all locally saved items (tasks, habits, user onboarding details). This will trigger the onboarding flow upon next reload.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Are you absolutely sure you want to reset the app? This clears all state.')) {
              onResetApp();
            }
          }}
          className="bg-red-500/10 hover:bg-red-500/25 text-red-500 border border-red-500/20 hover:border-red-500/40 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all active:scale-[0.98] cursor-pointer self-stretch md:self-auto justify-center"
        >
          <RotateCcw size={14} />
          <span>Reset and Clear Data</span>
        </button>
      </div>

    </div>
  );
}
