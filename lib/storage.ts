import type { Settings, StudyGoal, StudySession, StudyTask } from "./types";

const keys = { tasks: "studypilot.tasks", history: "studypilot.history", goals: "studypilot.goals", settings: "studypilot.settings" };
const defaults: Settings = { name: "Xiaotian", dailyTargetMinutes: 120, theme: "light" };
function read<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function write<T>(key: string, value: T) { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)); }
export const loadTasks = () => read<StudyTask[]>(keys.tasks, []);
export const saveTasks = (tasks: StudyTask[]) => write(keys.tasks, tasks);
export const loadHistory = () => read<StudySession[]>(keys.history, []);
export const saveHistory = (history: StudySession[]) => write(keys.history, history);
export const loadGoals = () => read<StudyGoal[]>(keys.goals, []);
export const saveGoals = (goals: StudyGoal[]) => write(keys.goals, goals);
export const loadSettings = () => read<Settings>(keys.settings, defaults);
export const saveSettings = (settings: Settings) => write(keys.settings, settings);
export const clearAllData = () => { if (typeof window !== "undefined") Object.values(keys).forEach(key => window.localStorage.removeItem(key)); };
