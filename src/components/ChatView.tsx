import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Bell, Sparkles, HelpCircle } from 'lucide-react';
import { Task, Habit } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isRescue?: boolean;
  rescueTaskId?: string;
  rescueTaskTitle?: string;
  rescueSubTasks?: string[];
}

interface ChatViewProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  rescueTaskToInit: Task | null;
  onClearRescueTask: () => void;
  onAddSubTasks: (taskId: string, subTasks: string[]) => void;
  messages: Message[];
  onSaveMessages: (messages: Message[]) => void;
  tasks: Task[];
  habits: Habit[];
  userName: string;
  userAge: number;
}

export default function ChatView({ 
  onAddTask, 
  rescueTaskToInit, 
  onClearRescueTask,
  onAddSubTasks,
  messages,
  onSaveMessages,
  tasks,
  habits,
  userName,
  userAge
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedPlans, setAppliedPlans] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle incoming Rescue action from Dashboard
  useEffect(() => {
    if (rescueTaskToInit) {
      const text = `🚨 SOS Rescue! I'm struggling with this task:
📌 **${rescueTaskToInit.title}**
${rescueTaskToInit.description ? `📝 *${rescueTaskToInit.description}*` : ''}

Please help me break the procrastination block! Provide warm advice, a quick mindset shift, and a step-by-step 3-step micro-plan.`;

      const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
      triggerRescue(rescueTaskToInit, userMsg);
      onClearRescueTask();
    }
  }, [rescueTaskToInit]);

  const triggerRescue = async (task: Task, userMsg: Message) => {
    setLoading(true);
    
    // Read fresh history from local storage directly if available, to guarantee NO race conditions on instant mount
    let freshHistory = messages;
    try {
      const stored = localStorage.getItem('rescue_ai_chat_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          freshHistory = parsed;
        }
      }
    } catch (e) {}

    const updatedMessages = [...freshHistory, userMsg];
    onSaveMessages(updatedMessages);

    try {
      // 1. Fetch Chat API for empathetic productivity coaching
      const chatPromise = fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          tasks,
          habits,
          userName,
          userAge
        })
      }).then(r => r.json());

      // 2. Fetch Rescue API for exact structured micro-tasks
      const rescuePromise = fetch('/api/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.description || '' })
      }).then(r => r.json());

      // Fetch both concurrently for optimal performance
      const [chatData, rescueData] = await Promise.all([chatPromise, rescuePromise]);

      let modelText = chatData.text || "Let's take this task step-by-step. Remember, action cures fear!";
      
      const rescueMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText,
        isRescue: true,
        rescueTaskId: task.id,
        rescueTaskTitle: task.title,
        rescueSubTasks: rescueData.tasks || []
      };

      const finalMessages = [...updatedMessages, rescueMsg];
      onSaveMessages(finalMessages);
    } catch (e) {
      console.error(e);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `I started working on a rescue plan for "${task.title}", but had some issues connecting to the brain. Let's try breaking it down into simple, 5-minute segments. What's the easiest starting step?`
      };
      const finalMessages = [...updatedMessages, errorMsg];
      onSaveMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    onSaveMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          tasks,
          habits,
          userName,
          userAge
        })
      });
      
      const data = await response.json();
      if (data.text) {
        let modelText = data.text;
        
        // Parse <TASK> tag if generated
        const taskRegex = /<TASK>(.*?)<\/TASK>/s;
        const match = modelText.match(taskRegex);
        if (match) {
          try {
            const taskData = JSON.parse(match[1]);
            onAddTask({
              title: taskData.title || 'New Task',
              description: taskData.description || '',
              priority: (taskData.priority?.toUpperCase() || 'MEDIUM') as any,
              dueDate: new Date(Date.now() + 86400000).toISOString(),
              category: 'Chat',
            });
            modelText = modelText.replace(taskRegex, '').trim() + "\n\n**✅ I've added this task to your board!**";
          } catch (e) {
            console.error("Failed to parse task JSON", e);
          }
        }

        const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: modelText };
        const finalMessages = [...updatedMessages, modelMsg];
        onSaveMessages(finalMessages);
      }
    } catch (e) {
      console.error(e);
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: "Oops, something went wrong. Try again." };
      const finalMessages = [...updatedMessages, errMsg];
      onSaveMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const clearChatHistory = () => {
    if (confirm("Are you sure you want to clear your AI conversation and rescue history?")) {
      const defaults: Message[] = [
        { 
          id: '1', 
          role: 'model', 
          text: "Hello! I'm your Rescue.AI assistant. Tell me about a task you need to do, and I'll help you define it. Or tap 'Rescue Me' on any task in your home dashboard to get custom mental tips and schedule subtasks!" 
        }
      ];
      onSaveMessages(defaults);
      setAppliedPlans({});
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] md:h-[650px] dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-sm">
      {/* Chat header */}
      <div className="p-4 border-b dark:border-neutral-800 border-neutral-200 dark:bg-[#1a1a1a] bg-neutral-50 flex justify-between items-center">
        <div>
          <h2 className="font-display font-medium text-lg dark:text-white text-neutral-900 flex items-center space-x-2">
            <Bot size={20} className="text-[#ffde1a]" />
            <span>AI Coach & Rescue Center</span>
          </h2>
          <p className="text-xs dark:text-neutral-500 text-neutral-550">Your supportive productivity companion and procrastinator rescue team</p>
        </div>
        <button 
          onClick={clearChatHistory}
          className="text-xs dark:text-neutral-500 text-neutral-500 hover:text-red-555 font-mono transition-colors border dark:border-neutral-800/80 border-neutral-200 hover:dark:border-red-900/30 hover:border-red-200 px-2.5 py-1.5 rounded-lg dark:bg-neutral-900/40 bg-white shadow-sm cursor-pointer"
        >
          Clear History
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-[#ffde1a] text-black' : 'dark:bg-neutral-800 bg-neutral-200 dark:text-white text-neutral-700'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-1">
                <div className={`p-3.5 rounded-xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-[#ffde1a] text-black rounded-tr-none font-medium shadow-[0_2px_8px_rgba(255,222,26,0.15)]' 
                    : 'dark:bg-neutral-800 bg-neutral-100 dark:text-neutral-200 text-neutral-800 rounded-tl-none whitespace-pre-wrap leading-relaxed'
                }`}>
                  {m.text}

                  {/* Rescue Card Plan Container */}
                  {m.isRescue && m.rescueSubTasks && m.rescueSubTasks.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t dark:border-neutral-700/60 border-neutral-300 space-y-3 max-w-sm animate-in fade-in zoom-in-95">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles size={13} className="text-[#ffde1a] animate-pulse" />
                        <span className="text-[10px] text-[#ffde1a] font-mono tracking-widest font-bold uppercase">
                          Actionable Rescue Schedule
                        </span>
                      </div>
                      <div className="space-y-2 dark:bg-neutral-900/50 bg-white p-3 rounded-lg border dark:border-neutral-700/40 border-neutral-200 shadow-sm">
                        {m.rescueSubTasks.map((st, i) => (
                          <div key={i} className="flex items-start space-x-2 text-xs dark:text-neutral-300 text-neutral-705">
                            <span className="font-mono text-[#ffde1a] font-bold text-[10px] dark:bg-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border dark:border-neutral-700 border-neutral-200">
                              Step {i + 1}
                            </span>
                            <span className="font-medium flex-1 pt-0.5 leading-snug">{st}</span>
                          </div>
                        ))}
                      </div>
                      
                      {appliedPlans[m.id] ? (
                        <div className="p-2 text-center text-xs bg-green-950/20 border border-green-800/40 text-green-400 rounded-lg font-medium flex items-center justify-center space-x-1.5">
                          <span>✓ Applied to task successfully!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onAddSubTasks(m.rescueTaskId!, m.rescueSubTasks!);
                            setAppliedPlans(prev => ({ ...prev, [m.id]: true }));
                          }}
                          className="w-full bg-[#ffde1a] hover:bg-[#e0c310] text-black font-bold text-xs py-2 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-black/20"
                        >
                          <span>Accept & Schedule on "{m.rescueTaskTitle || 'Task'}"</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className={`text-[9px] dark:text-neutral-600 text-neutral-400 px-1 font-mono ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(Number(m.id) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center dark:bg-neutral-800 bg-neutral-200 dark:text-white text-neutral-700 flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="space-y-1">
                <div className="p-3 rounded-xl dark:bg-neutral-800 bg-neutral-100 dark:text-neutral-400 text-neutral-600 rounded-tl-none flex items-center space-x-1.5 shadow-sm">
                  <span className="text-xs dark:text-neutral-500 text-neutral-500 font-medium">Rescue.AI is formulating advice...</span>
                  <div className="flex space-x-1 pt-0.5">
                    <div className="w-1.5 h-1.5 bg-[#ffde1a] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#ffde1a] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 bg-[#ffde1a] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input controls */}
      <div className="p-4 border-t dark:border-neutral-800 border-neutral-200 dark:bg-[#1a1a1a] bg-neutral-50">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Talk to your productivity coach or describe your blocks..."
            className="flex-1 dark:bg-neutral-900 bg-white border dark:border-neutral-700 border-neutral-300 rounded-lg px-4 py-2.5 text-sm dark:text-white text-neutral-900 focus:outline-none focus:border-[#ffde1a] transition-colors dark:placeholder:text-neutral-600 placeholder:text-neutral-400"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#ffde1a] text-black p-2.5 rounded-lg hover:bg-[#e0c310] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
