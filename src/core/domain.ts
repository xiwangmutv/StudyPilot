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
export type SessionReflection = { id: string; taskId?: string; taskTitle: string; feeling: "顺" | "一般" | "难"; memory: string; createdAt: string };

export type ActionStep = { id: string; title: string; description: string; estimatedMinutes: number };
export type TransitionStep = { id: string; instruction: string };
export type BlockerCategory = "physical" | "emotional" | "cognitive" | "environmental" | "perfectionism" | "ready";
export type ActionLifecycle = "pending" | "completed" | "skipped" | "ineffective";
/** A durable record prevents the Action Loop from re-suggesting completed guidance. */
export type ActionRecord = {
  id: string;
  instruction: string;
  blockerCategory: BlockerCategory;
  status: ActionLifecycle;
  createdAt: string;
  resolvedAt?: string;
};
export type ActionPlan = {
  taskId: string;
  steps: ActionStep[];
  transitionSteps?: TransitionStep[];
  /** Context for one local Action Loop launch; never sent anywhere except the configured AI provider. */
  situation?: string;
  completedTransitionSteps?: string[];
  actionHistory?: ActionRecord[];
  updatedAt: string;
  source?: "ai" | "fallback";
};
export type ResumeState = { taskId?: string; actionIndex?: number; positionSeconds: number; startedAt?: string; updatedAt: string };
/** A small preference: the Action Loop may suggest a breath when it is useful. */
export type BreathingAssistPreference = "allow" | "never";
export type UserProfile = {
  name: string;
  dailyTargetMinutes: number;
  theme: "light" | "dark";
  avatar?: string;
  starterMinutes: 3 | 5 | 8;
  breathingAssist: BreathingAssistPreference;
};
export type NextAction = { kind: "resume" | "start"; task: LearningTask; reason: string };
export type LaterStartItem = { id: string; title: string; createdAt: string };
export type DecisionUser = { tasks: LearningTask[]; resume: ResumeState | null };
