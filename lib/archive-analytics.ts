import type { BreathingSession, LearningSession, StartEvent } from "@/src/core";

export type DailyArchive = { day: string; actions: number; focusSeconds: number; starts: number; breaths: number; breathSeconds: number };
export type ArchiveSummary = { totalFocusSeconds: number; totalBreathSeconds: number; breathCount: number; actionCount: number; completedActions: number; starts: number; activeDays: number; daily: DailyArchive[]; encouragement: string };

export function dayKey(date: string | Date): string { const value = new Date(date); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
export function formatFocus(seconds: number): string { if (seconds < 60) return `${Math.max(0, seconds)} 秒`; const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours} 小时${minutes ? ` ${minutes} 分钟` : ""}` : `${minutes} 分钟`; }

export function calculateArchive(sessions: LearningSession[], startEvents: StartEvent[] = [], breathingSessions: BreathingSession[] = []): ArchiveSummary {
  const completed = sessions.filter((session) => session.completed);
  const byDay = new Map<string, { actions: number; focusSeconds: number; starts: number; breaths: number; breathSeconds: number }>();
  const ensure = (day: string) => byDay.get(day) ?? { actions: 0, focusSeconds: 0, starts: 0, breaths: 0, breathSeconds: 0 };
  completed.forEach((session) => { const day = dayKey(session.finishedAt); const item = ensure(day); item.actions += 1; item.focusSeconds += Math.max(0, session.durationSeconds); byDay.set(day, item); });
  startEvents.forEach((event) => { const day = dayKey(event.startedAt); const item = ensure(day); item.starts += 1; byDay.set(day, item); });
  breathingSessions.forEach((session) => { const day = dayKey(session.startedAt); const item = ensure(day); item.breaths += 1; item.breathSeconds += Math.max(0, session.durationSeconds); byDay.set(day, item); });
  const daily = [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([day, item]) => ({ day, ...item }));
  const totalFocusSeconds = completed.reduce((sum, item) => sum + Math.max(0, item.durationSeconds), 0);
  const totalBreathSeconds = breathingSessions.reduce((sum, item) => sum + Math.max(0, item.durationSeconds), 0);
  const actionCount = startEvents.length; const completedActions = completed.length;
  let encouragement = "每一次开始都会被记录在这里。今天先完成一小段就好。";
  if (totalFocusSeconds >= 3600) encouragement = `你已经投入了 ${formatFocus(totalFocusSeconds)}。这些时间都是给自己的积累。`;
  else if (actionCount >= 5) encouragement = `你已经启动了 ${actionCount} 次。你没有等待完美动力，而是一次次选择开始。`;
  else if (completedActions) encouragement = `你已经完成了 ${completedActions} 个动作。小小的步骤正在变成真实的进步。`;
  return { totalFocusSeconds, totalBreathSeconds, breathCount: breathingSessions.length, actionCount, completedActions, starts: startEvents.length, activeDays: daily.length, daily, encouragement };
}
