export type StudyTask = { id: string; title: string; completed: boolean; createdAt: string; completedAt?: string };
export type StudySession = { id: string; taskId?: string; taskTitle: string; startedAt: string; finishedAt: string; durationSeconds: number; completed: boolean };
export type StudyGoal = { id: string; title: string; createdAt: string };
export type Settings = { name: string; dailyTargetMinutes: number; theme: "light" | "dark" };
