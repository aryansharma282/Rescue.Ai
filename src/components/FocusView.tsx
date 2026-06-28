import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Zap, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Flame, 
  Trophy, 
  RefreshCw,
  Plus,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { Task } from '../types';
import Confetti from './Confetti';

interface FocusViewProps {
  tasks: Task[];
  userName: string;
  onAddTask: (task: { title: string; priority: any; dueDate: string }) => void;
}

export default function FocusView({ tasks, userName, onAddTask }: FocusViewProps) {
  // Session Configuration State
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [duration, setDuration] = useState<number>(25); // in minutes
  const [activeSound, setActiveSound] = useState<string>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);

  // Active Session State
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [infractions, setInfractions] = useState<number>(0);
  const [wasTabBlurred, setWasTabBlurred] = useState<boolean>(false);

  // Completion & Report State
  const [isSessionFinished, setIsSessionFinished] = useState<boolean>(false);
  const [sessionCompletedSuccessfully, setSessionCompletedSuccessfully] = useState<boolean>(false);
  const [showLocalConfetti, setShowLocalConfetti] = useState<boolean>(false);
  const [loadingCoaching, setLoadingCoaching] = useState<boolean>(false);
  const [coachingFeedback, setCoachingFeedback] = useState<string>('');

  // Stats Tracked locally (persisted in localStorage for streak and score)
  const [focusStreak, setFocusStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('rescue_focus_streak') || '0', 10);
  });
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState<number>(() => {
    return parseInt(localStorage.getItem('rescue_total_focus_mins') || '0', 10);
  });

  // Refs for audio and timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthesizerNodesRef = useRef<any[]>([]);
  const isTabActiveRef = useRef<boolean>(true);

  // Uncompleted tasks list
  const activeTasks = tasks.filter(t => !t.completed);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopSynthesizer();
    };
  }, []);

  // Sync volume changes to synthesized audio
  useEffect(() => {
    if (audioContextRef.current) {
      updateSynthesizerVolume();
    }
  }, [volume, isMuted]);

  // Audio synthesis using Web Audio API (100% client-side, procedural, zero external files)
  const startSynthesizer = (soundType: string) => {
    stopSynthesizer();
    if (soundType === 'none' || isMuted) return;

    try {
      // Lazy init AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
      mainGain.connect(ctx.destination);
      synthesizerNodesRef.current.push(mainGain);

      if (soundType === 'binaural') {
        // Binaural beats (Alpha/Theta state: 200Hz in left ear, 210Hz in right ear)
        // Split stereo channel
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(180, ctx.currentTime); // Left frequency

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(190, ctx.currentTime); // Right frequency (+10Hz binaural beat)

        const gainL = ctx.createGain();
        gainL.gain.setValueAtTime(0.5, ctx.currentTime);
        const gainR = ctx.createGain();
        gainR.gain.setValueAtTime(0.5, ctx.currentTime);

        oscL.connect(gainL);
        oscR.connect(gainR);

        // Connect to channels
        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);

        merger.connect(mainGain);

        oscL.start();
        oscR.start();

        synthesizerNodesRef.current.push(oscL, oscR, gainL, gainR, merger);
      } 
      else if (soundType === 'drone') {
        // Deep Cosmic Drone (Ambient phase cluster of detuned saw/sine oscillators)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(90, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(90.5, ctx.currentTime);

        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(180.2, ctx.currentTime);

        // Gentle filter to keep it deep and warm
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        // Low frequency oscillator (LFO) for breathing effect
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // Extremely slow cycle: 10s

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(mainGain.gain); // modulate volume

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(mainGain);

        osc1.start();
        osc2.start();
        osc3.start();
        lfo.start();

        synthesizerNodesRef.current.push(osc1, osc2, osc3, filter, lfo, lfoGain);
      } 
      else if (soundType === 'ocean') {
        // Procedural ocean waves (Pinkish-White noise modulated by a very slow LFO filter)
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink-noise approximation filter
          output[i] = (lastOut * 0.95 + white * 0.05);
          lastOut = output[i];
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.Q.setValueAtTime(1, ctx.currentTime);

        // Ocean Wave LFO (Modulate filter cutoff from 150Hz to 800Hz every 8 seconds)
        const waveLfo = ctx.createOscillator();
        waveLfo.type = 'sine';
        waveLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 second wave

        const waveLfoGain = ctx.createGain();
        waveLfoGain.gain.setValueAtTime(250, ctx.currentTime); // Sweep range

        waveLfo.connect(waveLfoGain);
        waveLfoGain.connect(filter.frequency); // Modulate cutoff

        noiseNode.connect(filter);
        filter.connect(mainGain);

        noiseNode.start();
        waveLfo.start();

        synthesizerNodesRef.current.push(noiseNode, filter, waveLfo, waveLfoGain);
      }
    } catch (e) {
      console.error('Failed to spin up procedural synthesizer:', e);
    }
  };

  const updateSynthesizerVolume = () => {
    try {
      const mainGain = synthesizerNodesRef.current.find(n => n instanceof GainNode);
      if (mainGain) {
        mainGain.gain.setValueAtTime(isMuted ? 0 : volume, audioContextRef.current?.currentTime || 0);
      }
    } catch (e) {
      console.warn('Volume sync ignored:', e);
    }
  };

  const stopSynthesizer = () => {
    synthesizerNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
      } catch (e) {}
    });
    synthesizerNodesRef.current = [];
  };

  // Synthesize warning beep when they break the Focus Lock contract (tab change)
  const playWarningBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime); // Low buzz warning
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Warning beep failed:', e);
    }
  };

  // Synthesize dynamic chime sound when session successfully finishes
  const playVictoryChime = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.6); // C6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.6); // E6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Victory chime failed:', e);
    }
  };

  // Visibility Tracking Setup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isSessionActive || isPaused || isSessionFinished) return;

      if (document.hidden) {
        isTabActiveRef.current = false;
        setInfractions((prev) => prev + 1);
        setWasTabBlurred(true);
        playWarningBeep();
      } else {
        isTabActiveRef.current = true;
      }
    };

    const handleWindowBlur = () => {
      if (!isSessionActive || isPaused || isSessionFinished) return;
      isTabActiveRef.current = false;
      setInfractions((prev) => prev + 1);
      setWasTabBlurred(true);
      playWarningBeep();
    };

    const handleWindowFocus = () => {
      isTabActiveRef.current = true;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isSessionActive, isPaused, isSessionFinished]);

  // Launch Focus Mode
  const handleStartSession = () => {
    // If no task selected and no custom goal written, auto set default
    const taskName = getActiveTaskTitle() || 'Deep Study Session';
    
    setTimeLeft(duration * 60);
    setInfractions(0);
    setWasTabBlurred(false);
    setIsSessionActive(true);
    setIsPaused(false);
    setIsSessionFinished(false);

    // Audio context start
    startSynthesizer(activeSound);

    // Start timer interval
    startTimer();
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          handleSessionCompletion(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startTimer();
      if (activeSound !== 'none') {
        startSynthesizer(activeSound);
      }
    } else {
      setIsPaused(true);
      stopTimer();
      stopSynthesizer();
    }
  };

  const handleForceQuit = () => {
    stopTimer();
    stopSynthesizer();
    handleSessionCompletion(false);
  };

  // Fetch report card feedback from Gemini API
  const generateAIReport = async (taskTitle: string, mins: number, completed: boolean, infs: number, integrity: number) => {
    setLoadingCoaching(true);
    setCoachingFeedback('');
    try {
      const response = await fetch('/api/focus-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          taskTitle,
          durationMins: mins,
          completed,
          infractions: infs,
          integrityScore: integrity
        })
      });
      const data = await response.json();
      if (data && data.feedback) {
        setCoachingFeedback(data.feedback);
      } else {
        throw new Error('No feedback returned');
      }
    } catch (err) {
      console.error('Failed to fetch AI feedback:', err);
      // Fallback
      if (completed) {
        setCoachingFeedback(`Superb work, ${userName}! You successfully maintained your focus on "${taskTitle}" for ${mins} minutes. Staying on screen is tough, but you fought the distraction impulse!`);
      } else {
        setCoachingFeedback(`No sweat, ${userName}! Every step counts. Maintaining focus is like training a muscle—the more you practice, the stronger it gets. Let's conquer a quick 5-minute study block next time!`);
      }
    } finally {
      setLoadingCoaching(false);
    }
  };

  const handleSessionCompletion = (successfullyCompleted: boolean) => {
    setIsSessionActive(false);
    setIsSessionFinished(true);
    setSessionCompletedSuccessfully(successfullyCompleted);
    stopSynthesizer();

    const taskTitle = getActiveTaskTitle() || 'Focus Block';
    const finalIntegrityScore = calculateIntegrityScore(successfullyCompleted, infractions);

    if (successfullyCompleted) {
      // Success triggers
      playVictoryChime();
      setShowLocalConfetti(true);

      // Save stats
      const newMins = totalFocusedMinutes + duration;
      const newStreak = focusStreak + 1;
      setTotalFocusedMinutes(newMins);
      setFocusStreak(newStreak);
      localStorage.setItem('rescue_total_focus_mins', newMins.toString());
      localStorage.setItem('rescue_focus_streak', newStreak.toString());
    } else {
      // Quit early resets streak
      setFocusStreak(0);
      localStorage.setItem('rescue_focus_streak', '0');
    }

    // Call Gemini API Focus Report card
    generateAIReport(taskTitle, duration, successfullyCompleted, infractions, finalIntegrityScore);
  };

  // Helper functions
  const getActiveTaskTitle = () => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      return task ? task.title : '';
    }
    return customGoal;
  };

  const calculateIntegrityScore = (completed: boolean, infs: number) => {
    if (!completed) return 0;
    const base = 100 - (infs * 15);
    return Math.max(0, base);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSoundChange = (sound: string) => {
    setActiveSound(sound);
    if (isSessionActive && !isPaused) {
      startSynthesizer(sound);
    }
  };

  return (
    <div className="w-full relative min-h-[500px]" id="focus_guard_container">
      {/* Dynamic Confetti for completed focus session */}
      {showLocalConfetti && (
        <Confetti active={showLocalConfetti} onClose={() => setShowLocalConfetti(false)} />
      )}

      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b dark:border-neutral-800 border-neutral-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold dark:text-white text-neutral-900 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#ffde1a] fill-[#ffde1a]/10" />
            <span>Focus Guard Lock-In Arena</span>
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Activate visual lock-in timers with real-time distraction defense, tab tracking, and procedural neural audio beats.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center space-x-4 mt-3 md:mt-0">
          <div className="flex items-center space-x-1.5 dark:bg-neutral-900/60 bg-white border dark:border-neutral-800 border-neutral-200 px-3 py-1.5 rounded-lg">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500/10" />
            <div className="text-left">
              <span className="block text-[10px] font-bold font-mono text-neutral-500 uppercase leading-none">Streak</span>
              <span className="text-xs font-semibold dark:text-white text-neutral-900">{focusStreak} Sessions</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 dark:bg-neutral-900/60 bg-white border dark:border-neutral-800 border-neutral-200 px-3 py-1.5 rounded-lg">
            <Trophy className="w-4 h-4 text-[#ffde1a] fill-[#ffde1a]/10" />
            <div className="text-left">
              <span className="block text-[10px] font-bold font-mono text-neutral-500 uppercase leading-none">Total Time</span>
              <span className="text-xs font-semibold dark:text-white text-neutral-900">{totalFocusedMinutes} mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 1: CONFIGURATION */}
      {!isSessionActive && !isSessionFinished && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Left panel: Task selection & custom goal */}
          <div className="lg:col-span-7 space-y-6">
            <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-sm font-semibold dark:text-white text-neutral-800 mb-4 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffde1a]" />
                <span>1. Select Your Lock-In Objective</span>
              </h3>

              {/* Task list selection */}
              <div className="space-y-3">
                <label className="block text-xs font-mono font-bold dark:text-neutral-400 text-neutral-600 uppercase tracking-wide">
                  Select Active Task
                </label>
                
                {activeTasks.length > 0 ? (
                  <select
                    value={selectedTaskId}
                    onChange={(e) => {
                      setSelectedTaskId(e.target.value);
                      if (e.target.value) setCustomGoal('');
                    }}
                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border dark:border-neutral-800 border-neutral-200 text-sm rounded-lg p-2.5 outline-none dark:text-white text-neutral-800 focus:border-[#ffde1a]"
                  >
                    <option value="">-- Choose an active task from your board --</option>
                    {activeTasks.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.priority}] {t.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-lg border dark:border-neutral-900 border-neutral-100 flex items-center justify-between">
                    <span>No uncompleted tasks found in your system.</span>
                  </div>
                )}

                <div className="flex items-center justify-center my-2 text-xs text-neutral-400 font-mono">
                  <span className="border-b dark:border-neutral-800 border-neutral-200 w-full"></span>
                  <span className="px-3 shrink-0">OR CREATE CUSTOM GOAL</span>
                  <span className="border-b dark:border-neutral-800 border-neutral-200 w-full"></span>
                </div>

                {/* Custom Goal Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold dark:text-neutral-400 text-neutral-600 uppercase tracking-wide">
                    Custom Goal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Study React components, No Instagram scrolling..."
                    value={customGoal}
                    onChange={(e) => {
                      setCustomGoal(e.target.value);
                      if (e.target.value) setSelectedTaskId('');
                    }}
                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border dark:border-neutral-800 border-neutral-200 text-sm rounded-lg p-2.5 outline-none dark:text-white text-neutral-800 focus:border-[#ffde1a]"
                  />
                </div>
              </div>
            </div>

            {/* Neural White Noise & Audio Controls */}
            <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-sm font-semibold dark:text-white text-neutral-800 mb-4 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffde1a]" />
                <span>2. Procedural Brainwave Audio (Optional)</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'none', label: 'Silence', desc: 'No background audio' },
                  { id: 'binaural', label: 'Binaural Beats', desc: 'Alpha Waves detuning' },
                  { id: 'drone', label: 'Cosmic Drone', desc: 'Deep cosmic hum' },
                  { id: 'ocean', label: 'Ocean Waves', desc: 'Swell noise filter' }
                ].map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundChange(sound.id)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between h-24 transition-all duration-150 cursor-pointer ${
                      activeSound === sound.id 
                        ? 'dark:bg-[#ffde1a]/10 bg-neutral-100 border-[#ffde1a] dark:text-white text-neutral-900' 
                        : 'dark:bg-neutral-900/20 bg-neutral-50/50 border-neutral-200 dark:border-neutral-800/80 hover:bg-neutral-100/50 hover:dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div className="font-semibold text-xs leading-none">
                      {sound.label}
                    </div>
                    <div className="text-[10px] text-neutral-500 leading-tight">
                      {sound.desc}
                    </div>
                  </button>
                ))}
              </div>

              {activeSound !== 'none' && (
                <div className="mt-4 pt-4 border-t dark:border-neutral-800 border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg dark:bg-neutral-900 bg-neutral-100 hover:dark:bg-neutral-800 cursor-pointer dark:text-neutral-400 text-neutral-600 hover:text-neutral-900 hover:dark:text-white"
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider dark:text-neutral-400 text-neutral-600">
                      Volume Control
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-1/2 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ffde1a]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Time duration slider & start button */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold dark:text-white text-neutral-800 mb-4 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffde1a]" />
                  <span>3. Lock-In Duration Contract</span>
                </h3>

                {/* Big dial readout */}
                <div className="text-center py-6">
                  <div className="text-5xl font-mono font-bold dark:text-white text-neutral-900">
                    {duration} <span className="text-sm text-neutral-400 font-sans font-medium uppercase tracking-widest">MINS</span>
                  </div>
                  <div className="text-xs text-neutral-400 font-mono mt-1 uppercase tracking-wider">
                    Total Focus Commitment
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-4">
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ffde1a]"
                  />

                  {/* Preset Quick Tabs */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[10, 15, 25, 45, 60].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setDuration(preset)}
                        className={`py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
                          duration === preset
                            ? 'bg-[#ffde1a] border-[#ffde1a] text-black font-bold'
                            : 'dark:bg-neutral-900 bg-neutral-50 dark:border-neutral-800 border-neutral-200 dark:text-neutral-400 text-neutral-600 hover:dark:bg-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning message explaining the lock contract */}
                <div className="mt-6 p-3 rounded-lg dark:bg-neutral-950/40 bg-orange-50/40 border dark:border-neutral-900/80 border-orange-100 flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    <strong>Focus Guard Visibility Protocol Active:</strong> To avoid distracting social media alerts or impulse browsing, if you switch browser tabs, leave this application, or lock your phone, an infraction warning tone will sound and reduce your session integrity.
                  </div>
                </div>
              </div>

              {/* Start Session Button */}
              <button
                onClick={handleStartSession}
                disabled={!selectedTaskId && !customGoal}
                className={`w-full py-3.5 mt-6 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2 shadow-sm ${
                  (selectedTaskId || customGoal)
                    ? 'bg-[#ffde1a] text-black hover:bg-[#ffe34d] active:scale-[0.98]'
                    : 'bg-neutral-200 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border dark:border-neutral-800'
                }`}
              >
                <Zap className="w-4 h-4 fill-black/10" />
                <span>Initiate Focus Lock-In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: ACTIVE SESSION ARENA */}
      {isSessionActive && (
        <div className="dark:bg-[#121212] bg-white border-2 dark:border-neutral-800 border-neutral-200 rounded-2xl p-6 md:p-10 text-center relative overflow-hidden animate-in zoom-in-95 duration-300 shadow-lg min-h-[500px] flex flex-col justify-between">
          
          {/* Top Info Banner */}
          <div className="flex flex-col items-center space-y-1.5 z-10">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 dark:border-emerald-500/20 border-emerald-500/30 px-3 py-1 rounded-full border">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase font-bold tracking-widest">
                VISIBILITY GUARD: REINFORCED
              </span>
            </div>
            <h3 className="text-lg font-semibold dark:text-white text-neutral-900 mt-2">
              Focusing on: <span className="text-[#ffde1a] underline decoration-wavy decoration-[#ffde1a]/30">{getActiveTaskTitle()}</span>
            </h3>
          </div>

          {/* Distraction Alert Indicator Overlay if recently blurred */}
          {wasTabBlurred && (
            <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-300 pointer-events-none">
              <div className="dark:bg-neutral-950 bg-white border border-red-500 rounded-xl p-4 shadow-xl max-w-sm flex items-center space-x-3 pointer-events-auto">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce shrink-0" />
                <div className="text-left">
                  <h4 className="text-sm font-bold dark:text-white text-neutral-900 leading-tight">Focus Interrupted!</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    You tabbed away or left the screen. Keep your focus on your active contract to maximize productivity!
                  </p>
                  <button
                    onClick={() => setWasTabBlurred(false)}
                    className="mt-2 text-[10px] font-mono uppercase text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    I am back now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Central Timer Readout */}
          <div className="my-6 py-6 flex flex-col items-center justify-center relative z-10">
            {/* Visual timer radial outline simulation */}
            <div className="relative w-56 h-56 rounded-full border-[6px] dark:border-neutral-800 border-neutral-100 flex flex-col items-center justify-center shadow-inner">
              <div className={`absolute inset-1.5 rounded-full border border-dashed dark:border-neutral-800/80 border-neutral-200 ${isPaused ? '' : 'animate-spin'}`} style={{ animationDuration: '60s' }} />
              
              <div className="text-5xl font-mono font-bold dark:text-white text-neutral-900 tracking-tight leading-none">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono mt-2 tracking-widest uppercase">
                {isPaused ? 'SESSION PAUSED' : 'STRICT TIME REMAINING'}
              </div>
            </div>
          </div>

          {/* Infractions Tracker & Ambient controls */}
          <div className="space-y-4 max-w-md mx-auto z-10 w-full">
            <div className="grid grid-cols-2 gap-4">
              {/* Infractions readout */}
              <div className={`p-2.5 rounded-xl border text-center transition-colors duration-200 ${
                infractions > 0 
                  ? 'bg-red-500/5 border-red-500/20 text-red-500' 
                  : 'dark:bg-neutral-900/40 bg-neutral-50 border-neutral-200 dark:border-neutral-800'
              }`}>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Tab Infractions
                </div>
                <div className="text-xl font-mono font-bold mt-0.5">
                  {infractions}
                </div>
              </div>

              {/* Integrity score live representation */}
              <div className="p-2.5 rounded-xl dark:bg-neutral-900/40 bg-neutral-50 border border-neutral-200 dark:border-neutral-800 text-center">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Integrity Rating
                </div>
                <div className={`text-xl font-mono font-bold mt-0.5 ${
                  calculateIntegrityScore(true, infractions) >= 80 
                    ? 'text-emerald-500' 
                    : calculateIntegrityScore(true, infractions) >= 50 
                      ? 'text-yellow-500' 
                      : 'text-red-500'
                }`}>
                  {calculateIntegrityScore(true, infractions)}%
                </div>
              </div>
            </div>

            {/* In-Session sound switcher */}
            <div className="dark:bg-neutral-950/50 bg-neutral-50/50 border dark:border-neutral-900 border-neutral-200/50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-semibold dark:text-neutral-400 text-neutral-600">Ambient Background Sound:</span>
              <div className="flex space-x-1">
                {[
                  { id: 'none', label: 'Mute' },
                  { id: 'binaural', label: 'Binaural' },
                  { id: 'drone', label: 'Drone' },
                  { id: 'ocean', label: 'Ocean' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSoundChange(s.id)}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                      activeSound === s.id
                        ? 'bg-[#ffde1a] text-black font-bold'
                        : 'dark:bg-neutral-900 bg-white dark:text-neutral-400 text-neutral-600 hover:dark:bg-neutral-800 hover:bg-neutral-100 border dark:border-transparent border-neutral-200/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Action controls */}
            <div className="flex items-center justify-center space-x-4 pt-2">
              <button
                onClick={handleTogglePause}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border dark:border-neutral-800 border-neutral-200 hover:dark:bg-neutral-800 hover:bg-neutral-50 dark:text-neutral-300 text-neutral-700 font-mono text-xs font-bold uppercase cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Square className="w-3.5 h-3.5 fill-current" />}
                <span>{isPaused ? 'Resume Session' : 'Pause Focus'}</span>
              </button>

              <button
                onClick={handleForceQuit}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Exit Early</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: REPORT CARD VIEW */}
      {isSessionFinished && (
        <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-2xl p-6 md:p-8 text-center animate-in zoom-in-95 duration-300 shadow-md max-w-2xl mx-auto">
          
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${
              sessionCompletedSuccessfully 
                ? 'dark:bg-[#ffde1a]/10 bg-[#ffde1a]/20 text-[#ffde1a]' 
                : 'bg-red-500/10 text-red-500'
            }`}>
              {sessionCompletedSuccessfully ? <Award className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
            </div>
          </div>

          <h3 className="text-2xl font-bold dark:text-white text-neutral-900 font-display">
            {sessionCompletedSuccessfully ? 'Focus Session Conquered!' : 'Lock-In Disrupted'}
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Goal: <span className="font-semibold">{getActiveTaskTitle()}</span>
          </p>

          {/* Session Stats Details Grid */}
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-neutral-50 dark:bg-neutral-950/60 p-3 rounded-xl border dark:border-neutral-900 border-neutral-100">
              <span className="block text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider leading-none">Focus Time</span>
              <span className="text-lg font-mono font-bold dark:text-white text-neutral-900 mt-1 block">
                {sessionCompletedSuccessfully ? `${duration}m` : 'Partially'}
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-950/60 p-3 rounded-xl border dark:border-neutral-900 border-neutral-100">
              <span className="block text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider leading-none">Tab Infractions</span>
              <span className="text-lg font-mono font-bold dark:text-white text-neutral-900 mt-1 block">
                {infractions}
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-950/60 p-3 rounded-xl border dark:border-neutral-900 border-neutral-100">
              <span className="block text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider leading-none">Integrity Rating</span>
              <span className={`text-lg font-mono font-bold mt-1 block ${
                calculateIntegrityScore(sessionCompletedSuccessfully, infractions) >= 80 
                  ? 'text-emerald-500' 
                  : calculateIntegrityScore(sessionCompletedSuccessfully, infractions) >= 50 
                    ? 'text-yellow-500' 
                    : 'text-red-500'
              }`}>
                {calculateIntegrityScore(sessionCompletedSuccessfully, infractions)}%
              </span>
            </div>
          </div>

          {/* AI Coaching Report Section */}
          <div className="border dark:border-neutral-800 border-neutral-100 dark:bg-neutral-900/30 bg-neutral-50/50 rounded-xl p-5 text-left mb-6 relative">
            <div className="absolute top-3.5 right-3.5 flex items-center space-x-1 bg-[#ffde1a]/10 px-2 py-0.5 rounded border border-[#ffde1a]/20">
              <Sparkles className="w-3 h-3 text-[#ffde1a]" />
              <span className="text-[9px] text-[#ffde1a] font-mono uppercase font-bold tracking-wider">Rescue Coach</span>
            </div>

            <h4 className="text-xs font-bold font-mono uppercase dark:text-neutral-400 text-neutral-500 tracking-wider">
              Rescue.AI Reflection Report
            </h4>

            {loadingCoaching ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <RefreshCw className="w-5 h-5 text-[#ffde1a] animate-spin" />
                <span className="text-xs text-neutral-400 font-mono">Analyzing lock-in performance...</span>
              </div>
            ) : (
              <p className="text-sm dark:text-neutral-300 text-neutral-700 leading-relaxed mt-2 italic">
                "{coachingFeedback}"
              </p>
            )}
          </div>

          {/* Back Action buttons */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setIsSessionFinished(false);
                setCoachingFeedback('');
              }}
              className="px-6 py-2.5 rounded-lg bg-[#ffde1a] text-black font-mono text-xs font-bold uppercase hover:bg-[#ffe34d] active:scale-[0.98] cursor-pointer"
            >
              Start New Focus Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
