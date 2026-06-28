import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { TaskPriority } from '../types';

interface VoiceViewProps {
  tasks: any[];
  habits: any[];
  userName: string;
  userAge: number;
  onAddTask: (task: { title: string; description?: string; priority: TaskPriority; dueDate?: string }) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddHabit: (habit: { name: string; startTime?: string; endTime?: string; alarmEnabled?: boolean }) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabitAlarm: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function VoiceView({
  tasks,
  habits,
  userName,
  userAge,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
  onToggleHabitAlarm,
  setActiveTab,
}: VoiceViewProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio queue for smooth playback
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const pcmToBase64 = (pcmData: Float32Array) => {
    const buffer = new ArrayBuffer(pcmData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcmData.length; i++) {
      let s = Math.max(-1, Math.min(1, pcmData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buffer = bytes.buffer;
      const audioData = new Int16Array(buffer);
      const float32Data = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32Data[i] = audioData[i] / 0x8000;
      }
      const audioBuffer = outputAudioCtxRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      
      audioQueueRef.current.push(audioBuffer);
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const playNextInQueue = () => {
    if (!outputAudioCtxRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;
    const source = outputAudioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioCtxRef.current.destination);

    const currentTime = outputAudioCtxRef.current.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextInQueue();
    };
  };

  const connect = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMessage("Connection error occurred. Please try again.");
      };

      ws.onopen = () => {
        source.connect(processor);
        processor.connect(inputCtx.destination);
        setIsConnected(true);
        setIsConnecting(false);
        // Send initial state to the server so Gemini has context
        ws.send(JSON.stringify({
          type: "state_init",
          tasks,
          habits,
          userName,
          userAge
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            console.error("Error from server:", msg.error);
            setErrorMessage(msg.error);
            cleanup(true);
            return;
          }
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            audioQueueRef.current = [];
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
          }
          
          // Tool commands executed on the client side
          if (msg.type === "add_task" && msg.task) {
            onAddTask(msg.task);
          } else if (msg.type === "toggle_task" && msg.taskId) {
            onToggleTask(msg.taskId);
          } else if (msg.type === "delete_task" && msg.taskId) {
            onDeleteTask(msg.taskId);
          } else if (msg.type === "add_habit" && msg.habit) {
            onAddHabit(msg.habit);
          } else if (msg.type === "toggle_habit" && msg.habitId) {
            onToggleHabit(msg.habitId);
          } else if (msg.type === "delete_habit" && msg.habitId) {
            onDeleteHabit(msg.habitId);
          } else if (msg.type === "toggle_habit_alarm" && msg.habitId) {
            onToggleHabitAlarm(msg.habitId);
          } else if (msg.type === "change_tab" && msg.tabName) {
            setActiveTab(msg.tabName);
          }
        } catch (e) {
          console.error("Error parsing websocket message:", e);
        }
      };

      ws.onclose = () => {
        cleanup(true); // Preserve the error message if set
      };
    } catch (e: any) {
      console.error(e);
      let errorMsg = "Failed to access microphone. Please ensure microphone access is granted.";
      if (e?.message) {
        errorMsg += ` (${e.message})`;
      }
      setErrorMessage(errorMsg);
      cleanup(true);
    }
  };

  const cleanup = (keepError = false) => {
    setIsConnected(false);
    setIsConnecting(false);
    if (!keepError) {
      setErrorMessage(null);
    }
    if (processorRef.current && inputAudioCtxRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (e) {}
      outputAudioCtxRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    audioQueueRef.current = [];
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "state_update",
        tasks,
        habits,
        userName,
        userAge
      }));
    }
  }, [tasks, habits, userName, userAge, isConnected]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] md:h-[600px] dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 shadow-sm">
      <div className="w-24 h-24 rounded-full dark:bg-[#1a1a1a] bg-neutral-100 flex items-center justify-center mb-6 relative">
        {isConnected ? (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-[#ffde1a] animate-ping opacity-20"></div>
            <div className="absolute inset-2 rounded-full bg-[#ffde1a]/20 animate-pulse"></div>
            <Mic size={40} className="text-[#ffde1a] relative z-10" />
          </>
        ) : (
          <MicOff size={40} className="text-neutral-400 dark:text-neutral-600" />
        )}
      </div>
      
      <h2 className="font-display text-2xl font-medium dark:text-white text-neutral-900 mb-2">
        Voice Conversation
      </h2>
      <p className="dark:text-neutral-500 text-neutral-600 max-w-sm mb-8">
        Talk to Rescue.AI in real-time. Ask questions, get task suggestions, or plan your day through a natural conversation.
      </p>

      {errorMessage && (
        <div className="mb-6 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-sm max-w-sm animate-in fade-in zoom-in-95">
          {errorMessage}
        </div>
      )}

      <button
        onClick={isConnected ? () => cleanup() : connect}
        disabled={isConnecting}
        className={`px-8 py-3 rounded-full font-bold transition-all flex items-center space-x-2 ${
          isConnected 
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
            : 'bg-[#ffde1a] text-black hover:bg-[#e0c310] hover:scale-105'
        }`}
      >
        {isConnecting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Connecting...</span>
          </>
        ) : isConnected ? (
          <>
            <MicOff size={18} />
            <span>End Conversation</span>
          </>
        ) : (
          <>
            <Mic size={18} />
            <span>Start Voice Chat</span>
          </>
        )}
      </button>
    </div>
  );
}
