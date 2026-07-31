import type { LearningSession, LearningTask, StartEvent } from "@/src/core";
import { calculateArchive, dayKey } from "./archive-analytics";

export function calculateStats(tasks: LearningTask[], history: LearningSession[], starts: StartEvent[] = []) {
  const archive = calculateArchive(history, starts);
  const today = archive.daily.find((record) => record.day === dayKey(new Date()));
  return {
    todayDuration: today?.focusSeconds ?? 0,
    todayCompleted: tasks.filter((task) => task.completed && task.completedAt && dayKey(task.completedAt) === dayKey(new Date())).length,
    totalDuration: archive.totalFocusSeconds,
    totalCompleted: archive.completedActions,
    actionCount: archive.actionCount,
    starts: archive.starts,
  };
}
