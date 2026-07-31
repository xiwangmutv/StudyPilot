import type { BreathingSession, LearningSession, StartEvent } from "./domain";
import { storageKeys, type StorageEngine } from "./storage-engine";

export class HistoryEngine {
  constructor(private readonly storage: StorageEngine) {}

  list() { return this.storage.get<LearningSession[]>(storageKeys.history, []).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)); }
  record(session: LearningSession) { this.storage.set(storageKeys.history, [session, ...this.list()]); }
  replace(sessions: LearningSession[]) { this.storage.set(storageKeys.history, sessions); }
  starts() { return this.storage.get<StartEvent[]>(storageKeys.starts, []).sort((a, b) => b.startedAt.localeCompare(a.startedAt)); }
  recordStart(event: StartEvent) { this.storage.set(storageKeys.starts, [event, ...this.starts()]); }
  breaths() { return this.storage.get<BreathingSession[]>(storageKeys.breaths, []).sort((a, b) => b.startedAt.localeCompare(a.startedAt)); }
  recordBreath(session: BreathingSession) { this.storage.set(storageKeys.breaths, [session, ...this.breaths()]); }
  migrateStartsFromSessions() {
    const existing = this.starts();
    if (existing.length || !this.list().length) return existing;
    const migrated = this.list().map((session) => ({
      id: `migrated-${session.id}`,
      taskId: session.taskId,
      actionTitle: session.taskTitle,
      startedAt: session.startedAt,
    }));
    this.storage.set(storageKeys.starts, migrated);
    return migrated;
  }
  totalSeconds() { return this.list().reduce((sum, session) => sum + session.durationSeconds, 0); }
}
