import { ActionEngine } from "./action-engine";
import { GoalEngine } from "./goal-engine";
import { HistoryEngine } from "./history-engine";
import { LaterStartEngine } from "./later-start-engine";
import { ProgressEngine } from "./progress-engine";
import { ResumeEngine } from "./resume-engine";
import { RuleDecisionEngine, type DecisionEngine } from "./decision-engine";
import { LocalStorageEngine, storageKeys } from "./storage-engine";
import { TaskEngine } from "./task-engine";
import type { BreathingSession, LearningSession, StartEvent, UserProfile } from "./domain";

export class StudyPilotCore {
  readonly goals;
  readonly tasks;
  readonly progress;
  readonly history;
  readonly resume;
  readonly actions;
  readonly laterStarts;
  private readonly decision;
  private readonly storage;

  constructor(decision: DecisionEngine = new RuleDecisionEngine()) {
    const storage = new LocalStorageEngine();
    this.goals = new GoalEngine(storage);
    this.tasks = new TaskEngine(storage);
    this.progress = new ProgressEngine();
    this.history = new HistoryEngine(storage);
    this.resume = new ResumeEngine(storage);
    this.actions = new ActionEngine(storage);
    this.laterStarts = new LaterStartEngine(storage);
    this.decision = decision;
    this.storage = storage;
  }

  getNextAction() {
    return this.decision.getNextAction({ tasks: this.tasks.list(), resume: this.resume.restore() });
  }

  profile() {
    const saved = this.storage.get<Partial<UserProfile>>(storageKeys.profile, {});
    return { name: "学习者", dailyTargetMinutes: 120, theme: "light", starterMinutes: 5, breathingFrequency: "first", breathingGroups: 1, continueMode: "free", ...saved } as UserProfile;
  }

  saveProfile(profile: UserProfile) { this.storage.set(storageKeys.profile, profile); }
  clearAll() { Object.values(storageKeys).forEach((key) => this.storage.remove(key)); }

  finishSession(session: LearningSession, completeTask = false) {
    this.history.record(session);
    if (completeTask && session.taskId) this.tasks.complete(session.taskId);
    this.resume.clear();
  }

  recordStart(event: StartEvent) { this.history.recordStart(event); }
  recordBreath(session: BreathingSession) { this.history.recordBreath(session); }
}

export const studyPilotCore = new StudyPilotCore();
