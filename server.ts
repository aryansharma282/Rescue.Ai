import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { WebSocketServer } from "ws";
import http from 'http';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/rescue", async (req, res) => {
    try {
      const { title, description } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a productivity expert. The user is struggling to start the task: '${title}'. Break this task down into exactly 3 small, highly specific, and actionable micro-tasks. Return ONLY a valid JSON array of strings, with no markdown, no code blocks, and no extra text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      const responseText = response.text || "[]";
      let parsedTasks = [];
      try {
        parsedTasks = JSON.parse(responseText.trim());
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        const match = responseText.match(/\[.*\]/s);
        if (match) {
          parsedTasks = JSON.parse(match[0]);
        } else {
          return res.status(500).json({ error: "Invalid response format from AI" });
        }
      }

      res.json({ tasks: parsedTasks });
    } catch (error) {
      console.error("Rescue API error:", error);
      res.status(500).json({ error: "Rescue API failed. Please try again." });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, tasks = [], habits = [], userName = "User", userAge = 25 } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is required" });

      const ai = new GoogleGenAI({ apiKey });
      
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      const lastMessage = messages[messages.length - 1].text;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [...history, { role: 'user', parts: [{ text: lastMessage }]}],
        config: {
          systemInstruction: `You are an AI assistant and an empathetic, world-class productivity coach in a task management app called Rescue.AI.
          You help users manage tasks, defeat procrastination, and break down complex items.
          
          [Current User Memory Context]:
          - Name: ${userName}
          - Age: ${userAge}
          - Active Tasks in App: ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, completed: t.completed, priority: t.priority })))}
          - Active Habits in App: ${JSON.stringify(habits.map((h: any) => ({ name: h.name, startTime: h.startTime, endTime: h.endTime, alarmEnabled: h.alarmEnabled, streak: h.streak })))}

          Address the user warmly by their name "${userName}" when appropriate.
          
          If the user is sending an SOS Rescue request (indicated by "🚨 SOS Rescue!"), you MUST provide an extremely high-quality response containing:
          1. **Empathy & Warmth**: Validate their feelings of overwhelm or procrastination. Be warm, supportive, and kind.
          2. **Productivity Mindset Shift**: Provide a quick, memorable mindset shift (like "The 5-Minute Rule", "Imperfect Action", "Implementation Intentions", or "Temptation Bundling") tailored to the specific task.
          3. **Brief Explanation & Detailed Advice**: Explain in 2-3 sentences WHY this specific task feels difficult to start, and give high-level, practical advice or suggestions on how they can make it easier to complete.
          4. Ensure the output is visually engaging, formatted with clear markdown, bolding, and clean spacings.
          
          For normal chat interactions: help the user define their tasks, ask clarifying questions (like urgency, context, subject matter), and when enough info is gathered, you can output exactly this tag to add it to their dashboard:
          <TASK>{"title": "Task Name", "description": "Details", "priority": "urgent" | "high" | "medium" | "low"}</TASK>`,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Chat API failed." });
    }
  });

  app.post("/api/analyze-habits", async (req, res) => {
    try {
      const { habits } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is required" });

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an AI productivity coach. Analyze these habits: ${JSON.stringify(habits)}.
      Provide a single, short observation about their habits, and a single, short actionable suggestion to improve their routine.
      Return ONLY a JSON object with this exact structure: {"observation": "...", "suggestion": "..."}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      let parsed = { observation: "You are doing great!", suggestion: "Keep up the good work!" };
      const text = response.text || "";
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      } catch (e) {
        console.error("Failed to parse habit analysis:", e);
      }

      res.json(parsed);
    } catch (error) {
      console.error("Habit analysis error:", error);
      res.status(500).json({ error: "Failed to analyze habits." });
    }
  });

  app.post("/api/focus-report", async (req, res) => {
    try {
      const { userName = "User", taskTitle = "Study Block", durationMins = 25, completed = true, infractions = 0, integrityScore = 100 } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is required" });

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a warm, supportive productivity coach inside Rescue.AI.
      A user named '${userName}' just finished or exited a "Focus Guard Lock-In" session.
      Session stats:
      - Task: "${taskTitle}"
      - Intended Duration: ${durationMins} minutes
      - Completed successfully: ${completed ? 'YES' : 'NO (left early)'}
      - Tab changes/distractions: ${infractions} times
      - Focus Integrity Score: ${integrityScore}%

      Write a short, engaging, highly empathetic coaching feedback note (max 80 words).
      - If completed with 100% integrity, praise their iron clad focus and call them a Lock-In Master.
      - If completed but with distractions, praise their completion but suggest turning off phone notifications / closing tabs next time with empathy.
      - If they left early, be extremely kind, supportive, explain that failure is just data, and encourage them to try a smaller 5-minute block.
      
      Return ONLY a JSON object with this exact structure: {"feedback": "Your personalized coaching feedback here"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      let parsed = { feedback: "Incredible effort! Every minute you spend focusing is a major step toward building strong neural habits. Keep showing up for yourself!" };
      const text = response.text || "";
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      } catch (e) {
        console.error("Failed to parse focus report feedback:", e);
      }

      res.json(parsed);
    } catch (error) {
      console.error("Focus report error:", error);
      res.status(500).json({ error: "Failed to generate focus report." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs) => {
    let session: any = null;
    let clientTasks: any[] = [];
    let clientHabits: any[] = [];
    let clientUsername: string = "User";
    let clientAge: number = 25;

    console.log("[WebSocket] Client connected to /live");
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[WebSocket] GEMINI_API_KEY is not defined");
        clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is missing on the server. Please check your secrets." }));
        clientWs.close();
        return;
      }
      
      console.log("[WebSocket] Connecting to Gemini Multimodal Live API with tools enabled...");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a warm, empathetic, and energetic AI productivity assistant in Rescue.AI. You have full capability to manage the user's tasks and daily habits via tool calling. " +
            "When asked to see or check tasks or habits, call get_current_state to view them. " +
            "When asked to add, complete/toggle, or delete tasks or habits, call the corresponding tools and confirm what you did briefly. " +
            "You can also toggle habit alarms (optional alarms only, when a start time is provided) and switch between application tabs (dashboard, calendar, chat, audio, growth, settings) using change_tab. " +
            "Keep your spoken responses brief, helpful, and natural, since this is a voice-to-voice conversation. Speak enthusiastically and supportively!",
          tools: [
            {
              functionDeclarations: [
                {
                  name: "get_current_state",
                  description: "Get the current list of tasks and daily habits, including their IDs, titles, names, start/end times, and completion status.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "add_task",
                  description: "Add a new task to the user's task list.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "The title of the task" },
                      description: { type: Type.STRING, description: "Detailed description of the task (optional)" },
                      priority: { type: Type.STRING, description: "Priority level of the task: 'low', 'medium', 'high', 'urgent' (optional, default 'medium')" },
                      dueDate: { type: Type.STRING, description: "Optional ISO-8601 date string when this task is due (optional)" }
                    },
                    required: ["title"]
                  }
                },
                {
                  name: "toggle_task",
                  description: "Toggle the completion state of an existing task by its ID.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      taskId: { type: Type.STRING, description: "The ID of the task to toggle" }
                    },
                    required: ["taskId"]
                  }
                },
                {
                  name: "delete_task",
                  description: "Delete an existing task by its ID.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      taskId: { type: Type.STRING, description: "The ID of the task to delete" }
                    },
                    required: ["taskId"]
                  }
                },
                {
                  name: "add_habit",
                  description: "Add a new daily habit. Habit alarms can optionally be enabled only if a start time is provided.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "The name of the habit (e.g. Gym, Read, Study)" },
                      startTime: { type: Type.STRING, description: "The start time in 24-hour HH:MM format (optional, e.g. '08:30')" },
                      endTime: { type: Type.STRING, description: "The end time in 24-hour HH:MM format (optional, e.g. '09:30')" },
                      alarmEnabled: { type: Type.BOOLEAN, description: "Enable optional alarm notification for this habit if start time is specified (optional, default false)" }
                    },
                    required: ["name"]
                  }
                },
                {
                  name: "toggle_habit",
                  description: "Toggle the completion state of a daily habit by its ID.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      habitId: { type: Type.STRING, description: "The ID of the habit to toggle" }
                    },
                    required: ["habitId"]
                  }
                },
                {
                  name: "delete_habit",
                  description: "Delete an existing daily habit by its ID.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      habitId: { type: Type.STRING, description: "The ID of the habit to delete" }
                    },
                    required: ["habitId"]
                  }
                },
                {
                  name: "toggle_habit_alarm",
                  description: "Toggle the alarm reminder setting for a daily habit by its ID.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      habitId: { type: Type.STRING, description: "The ID of the habit to toggle its alarm for" }
                    },
                    required: ["habitId"]
                  }
                },
                {
                  name: "change_tab",
                  description: "Switch the application active tab/screen view.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      tabName: { type: Type.STRING, description: "The name of the target tab: 'dashboard', 'calendar', 'chat', 'audio', 'growth', 'settings'" }
                    },
                    required: ["tabName"]
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            // Check for function/tool call
            if (message.toolCall?.functionCalls) {
              for (const call of message.toolCall.functionCalls) {
                const { name, args, id } = call as any;
                console.log(`[WebSocket] Gemini called tool: ${name} with args:`, args);
                
                let result: any = { success: true };
                
                try {
                  if (name === "get_current_state") {
                    result = {
                      tasks: clientTasks,
                      habits: clientHabits
                    };
                  } else if (name === "add_task") {
                    clientWs.send(JSON.stringify({
                      type: "add_task",
                      task: {
                        title: args.title,
                        description: args.description || "",
                        priority: (args.priority || "MEDIUM").toUpperCase(),
                        dueDate: args.dueDate || undefined
                      }
                    }));
                    result = { success: true, message: `Task "${args.title}" has been successfully added.` };
                  } else if (name === "toggle_task") {
                    clientWs.send(JSON.stringify({
                      type: "toggle_task",
                      taskId: args.taskId
                    }));
                    result = { success: true, message: `Task completed/toggled.` };
                  } else if (name === "delete_task") {
                    clientWs.send(JSON.stringify({
                      type: "delete_task",
                      taskId: args.taskId
                    }));
                    result = { success: true, message: `Task deleted.` };
                  } else if (name === "add_habit") {
                    clientWs.send(JSON.stringify({
                      type: "add_habit",
                      habit: {
                        name: args.name,
                        startTime: args.startTime || undefined,
                        endTime: args.endTime || undefined,
                        alarmEnabled: args.alarmEnabled || false
                      }
                    }));
                    result = { success: true, message: `Habit "${args.name}" has been successfully added.` };
                  } else if (name === "toggle_habit") {
                    clientWs.send(JSON.stringify({
                      type: "toggle_habit",
                      habitId: args.habitId
                    }));
                    result = { success: true, message: `Habit completed/toggled.` };
                  } else if (name === "delete_habit") {
                    clientWs.send(JSON.stringify({
                      type: "delete_habit",
                      habitId: args.habitId
                    }));
                    result = { success: true, message: `Habit deleted.` };
                  } else if (name === "toggle_habit_alarm") {
                    clientWs.send(JSON.stringify({
                      type: "toggle_habit_alarm",
                      habitId: args.habitId
                    }));
                    result = { success: true, message: `Habit alarm toggled.` };
                  } else if (name === "change_tab") {
                    clientWs.send(JSON.stringify({
                      type: "change_tab",
                      tabName: args.tabName
                    }));
                    result = { success: true, message: `App tab switched to "${args.tabName}".` };
                  } else {
                    result = { error: `Unknown tool name: ${name}` };
                  }
                } catch (err: any) {
                  console.error(`Error executing tool ${name}:`, err);
                  result = { error: err.message || "Failed to execute tool call." };
                }
                
                // Send response back to Gemini Live session
                if (session) {
                  try {
                    await session.sendToolResponse({
                      functionResponses: [{
                        id: id,
                        name: name,
                        response: {
                          output: result
                        }
                      }]
                    });
                    console.log(`[WebSocket] Sent tool response back to Gemini for: ${name}`);
                  } catch (e) {
                    console.error("[WebSocket] Error sending tool response to Gemini:", e);
                  }
                }
              }
            }

            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      console.log("[WebSocket] Gemini Multimodal Live API session established successfully.");

      // If we already received state_init before session was ready, send it now
      if (clientTasks.length > 0 || clientHabits.length > 0 || clientUsername !== "User") {
        try {
          session.sendClientContent({
            turns: [{
              role: "user",
              parts: [{
                text: `[System Update - Live State Memory]
Current user: ${clientUsername} (Age: ${clientAge})
The following is the latest active state of the user's dashboard. Keep this in your memory:
Active Tasks: ${JSON.stringify(clientTasks.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed, dueDate: t.dueDate })))}
Active Habits: ${JSON.stringify(clientHabits.map((h: any) => ({ id: h.id, name: h.name, startTime: h.startTime, endTime: h.endTime, alarmEnabled: h.alarmEnabled, streak: h.streak })))}`
              }]
            }],
            turnComplete: false
          });
          console.log("[WebSocket] Sent initial state memory to Gemini Live session upon connection.");
        } catch (err) {
          console.error("[WebSocket] Error sending initial state memory to session:", err);
        }
      }

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === "state_init" || parsed.type === "state_update") {
            clientTasks = parsed.tasks || [];
            clientHabits = parsed.habits || [];
            clientUsername = parsed.userName || "User";
            clientAge = parsed.userAge || 25;
            console.log(`[WebSocket] State synchronized: ${clientTasks.length} tasks, ${clientHabits.length} habits for user ${clientUsername}.`);
            
            if (session) {
              try {
                session.sendClientContent({
                  turns: [{
                    role: "user",
                    parts: [{
                      text: `[System Update - Live State Memory]
Current user: ${clientUsername} (Age: ${clientAge})
The following is the latest active state of the user's dashboard. Keep this in your memory:
Active Tasks: ${JSON.stringify(clientTasks.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed, dueDate: t.dueDate })))}
Active Habits: ${JSON.stringify(clientHabits.map((h: any) => ({ id: h.id, name: h.name, startTime: h.startTime, endTime: h.endTime, alarmEnabled: h.alarmEnabled, streak: h.streak })))}`
                    }]
                  }],
                  turnComplete: false
                });
                console.log("[WebSocket] Sent updated state memory to Gemini Live session.");
              } catch (err) {
                console.error("[WebSocket] Error sending state update to Gemini session:", err);
              }
            }
            return;
          }

          const { audio } = parsed;
          if (audio && session) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("[WebSocket] Error processing client message:", e);
        }
      });

      clientWs.on("close", () => {
        console.log("[WebSocket] Client disconnected. Cleaning up session...");
        if (session) {
          try {
            session.close();
          } catch (e) {
            console.error("[WebSocket] Error closing Gemini session:", e);
          }
        }
      });
    } catch (error: any) {
      console.error("[WebSocket] Live API connection error:", error);
      try {
        clientWs.send(JSON.stringify({ error: error?.message || "Failed to establish Gemini Live connection." }));
      } catch (e) {}
      clientWs.close();
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
