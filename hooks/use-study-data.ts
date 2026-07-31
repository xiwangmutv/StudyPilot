"use client";

import { useCallback, useEffect, useState } from "react";
import { studyPilotCore } from "@/src/core";
import type { BreathingSession, Goal, LaterStartItem, LearningSession, LearningTask, StartEvent, UserProfile } from "@/src/core";

const defaultProfile: UserProfile = { name: "学习者", dailyTargetMinutes: 120, theme: "light", starterMinutes: 5, breathingFrequency: "first", breathingGroups: 1, continueMode: "free" };

export function useStudyData() {
  const [tasks, setTasks] = useState<LearningTask[]>([]);
  const [history, setHistory] = useState<LearningSession[]>([]);
  const [starts, setStarts] = useState<StartEvent[]>([]);
  const [breaths, setBreaths] = useState<BreathingSession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [laterStarts, setLaterStarts] = useState<LaterStartItem[]>([]);
  const [settings, setSettings] = useState<UserProfile>(defaultProfile);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setTasks(studyPilotCore.tasks.list());
    setHistory(studyPilotCore.history.list());
    setStarts(studyPilotCore.history.migrateStartsFromSessions());
    setBreaths(studyPilotCore.history.breaths());
    setGoals(studyPilotCore.goals.list());
    setLaterStarts(studyPilotCore.laterStarts.list());
    setSettings(studyPilotCore.profile());
  }, []);

  useEffect(() => { refresh(); setReady(true); }, [refresh]);
  const updateTasks = useCallback((next: LearningTask[]) => { studyPilotCore.tasks.save(next); setTasks(next); }, []);
  const updateHistory = useCallback((next: LearningSession[]) => { studyPilotCore.history.replace(next); setHistory(next); }, []);
  const updateGoals = useCallback((next: Goal[]) => { studyPilotCore.goals.replace(next); setGoals(next); }, []);
  const updateSettings = useCallback((next: UserProfile) => { studyPilotCore.saveProfile(next); setSettings(next); }, []);
  const createTask = useCallback((title: string) => { const task = studyPilotCore.tasks.create(title, 10); refresh(); return task; }, [refresh]);
  const finishSession = useCallback((session: LearningSession, completeTask = false) => { studyPilotCore.finishSession(session, completeTask); refresh(); }, [refresh]);
  const recordStart = useCallback((event: StartEvent) => { studyPilotCore.recordStart(event); refresh(); }, [refresh]);
  const recordBreath = useCallback((session: BreathingSession) => { studyPilotCore.recordBreath(session); refresh(); }, [refresh]);
  const addLaterStart = useCallback((title: string) => { const item = studyPilotCore.laterStarts.add(title); refresh(); return item; }, [refresh]);
  const removeLaterStart = useCallback((id: string) => { studyPilotCore.laterStarts.remove(id); refresh(); }, [refresh]);
  const saveResume = useCallback((taskId: string | undefined, seconds: number, startedAt?: string, actionIndex = 0) => studyPilotCore.resume.save(taskId, seconds, startedAt, actionIndex), []);

  return { tasks, history, starts, breaths, goals, laterStarts, settings, ready, updateTasks, updateHistory, updateGoals, updateSettings, createTask, finishSession, recordStart, recordBreath, saveResume, addLaterStart, removeLaterStart, refresh, actions: studyPilotCore.actions, resume: ready ? studyPilotCore.resume.restore() : null, nextAction: ready ? studyPilotCore.getNextAction() : null };
}
