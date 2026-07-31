export type Goal = { id: string; title: string; createdAt: string; updatedAt: string };

export type LearningTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  estimatedMinutes?: number;
  parentTaskId?: string;
  position?: number;
};

export type LearningSession = {
  id: string;
  taskId?: string;
  taskTitle: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  completed: boolean;
};

/** A start is recorded when the user deliberately begins an action. */
export type StartEvent = { id: string; taskId?: string; actionTitle: string; startedAt: string };
export type BreathingSession = { id: string; mode: "start" | "focus" | "anxiety" | "sleep"; startedAt: string; durationSeconds: number; groups: number };

export type ActionStep = { id: string; title: string; description: string; estimatedMinutes: number };
export type ActionPlan = { taskId: string; steps: ActionStep[]; updatedAt: string; source?: "ai" | "fallback" };
export type ResumeState = { taskId?: string; actionIndex?: number; positionSeconds: number; startedAt?: string; updatedAt: string };
export type BreathingFrequency = "off" | "first" | "every";
export type ContinueMode = "free" | "guided";
export type UserProfile = { name: string; dailyTargetMinutes: number; theme: "light" | "dark"; avatar?: string; starterMinutes: 3 | 5 | 8; breathingFrequency: BreathingFrequency; breathingGroups: 1 | 2 | 3; continueMode: ContinueMode };
export type NextAction = { kind: "resume" | "start"; task: LearningTask; reason: string };
export type LaterStartItem = { id: string; title: string; createdAt: string };
export type DecisionUser = { tasks: LearningTask[]; resume: ResumeState | null };
