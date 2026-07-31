export interface StorageEngine { get<T>(key: string, fallback: T): T; set<T>(key: string, value: T): void; remove(key: string): void; }
export class LocalStorageEngine implements StorageEngine {
  get<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
  set<T>(key: string, value: T) { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)); }
  remove(key: string) { if (typeof window !== "undefined") window.localStorage.removeItem(key); }
}
export const storageKeys = { goals: "studypilot.goals", tasks: "studypilot.tasks", history: "studypilot.history", starts: "studypilot.starts", breaths: "studypilot.breaths", reflections: "studypilot.reflections", profile: "studypilot.settings", resume: "studypilot.resume", actionPlans: "studypilot.action-plans", laterStarts: "studypilot.later-starts" } as const;
