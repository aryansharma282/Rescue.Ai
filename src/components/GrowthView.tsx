import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Habit } from '../types';
import { Bot, Sparkles } from 'lucide-react';

export default function GrowthView({ habits }: { habits: Habit[] }) {
  const [data, setData] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<{ observation: string, suggestion: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate dummy history data for the graph
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      history.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completionRate: Math.floor(Math.random() * 60) + 40, // 40-100%
      });
    }
    setData(history);
  }, []);

  useEffect(() => {
    if (habits.length === 0) return;
    
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/analyze-habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habits })
        });
        const json = await res.json();
        if (json.observation) {
          setAnalysis(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [habits]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-display font-medium text-xl dark:text-white text-neutral-900 mb-1">Growth & Tracking</h2>
        <p className="text-sm dark:text-neutral-500 text-neutral-500 mb-6">Track your daily habits and review AI suggestions for your routine.</p>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffde1a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffde1a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-[#2a2a2a]" vertical={false} />
              <XAxis dataKey="day" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#ffde1a' }}
              />
              <Area type="monotone" dataKey="completionRate" stroke="#ffde1a" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dark:bg-[#121212] bg-white border dark:border-neutral-800 border-neutral-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-display font-medium text-lg dark:text-white text-neutral-900 mb-4 flex items-center space-x-2">
          <Bot size={18} className="text-[#ffde1a]" />
          <span>AI Routine Suggestions</span>
        </h3>
        <div className="space-y-4">
          {loading ? (
            <div className="p-4 dark:bg-[#1a1a1a] bg-neutral-50 rounded-lg border dark:border-[#ffde1a]/20 border-neutral-200 shadow-sm flex items-center space-x-3">
              <Sparkles size={16} className="text-[#ffde1a] animate-pulse" />
              <p className="text-sm dark:text-neutral-400 text-neutral-600">Analyzing your recent habits...</p>
            </div>
          ) : analysis ? (
            <div className="p-4 dark:bg-[#1a1a1a] bg-neutral-50 rounded-lg border dark:border-[#ffde1a]/20 border-neutral-200 shadow-sm">
              <p className="text-sm dark:text-neutral-300 text-neutral-800">
                <span className="text-[#ffde1a] font-bold">Observation:</span> {analysis.observation}
              </p>
              <p className="text-sm dark:text-neutral-400 text-neutral-600 mt-2">
                <span className="font-medium dark:text-white text-neutral-900">Suggestion:</span> {analysis.suggestion}
              </p>
            </div>
          ) : (
            <div className="p-4 dark:bg-[#1a1a1a] bg-neutral-50 rounded-lg border dark:border-[#ffde1a]/20 border-neutral-200 shadow-sm">
              <p className="text-sm dark:text-neutral-300 text-neutral-800">
                <span className="text-[#ffde1a] font-bold">Observation:</span> You consistently complete your 'Hydration' habit but often miss 'Gym' on Wednesdays.
              </p>
              <p className="text-sm dark:text-neutral-400 text-neutral-600 mt-2">
                <span className="font-medium dark:text-white text-neutral-900">Suggestion:</span> Try shifting your Gym schedule to mornings on Wednesdays, or scheduling a lighter workout to maintain consistency.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
