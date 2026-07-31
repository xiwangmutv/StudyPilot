"use client";

import { useCallback, useEffect, useState } from "react";
import { firstPilotCore } from "@/src/core";
import type { BreathingSession, Goal, LaterStartItem, LearningSession, LearningTask, SessionReflection, StartEvent, UserProfile } from "@/src/core";

const defaultProfile: UserProfile = { name: "学习者", dailyTargetMinutes: 120, theme: "light", starterMinutes: 5, breathingAssist: "allow" };

export function useStudyData() {
  const [tasks, setTasks] = useState<LearningTask[]>([]);
  const [history, setHistory] = useState<LearningSession[]>([]);
  const [starts, setStarts] = useState<StartEvent[]>([]);
  const [breaths, setBreaths] = useState<BreathingSession[]>([]);
  const [reflections, setReflections] = useState<SessionReflection[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [laterStarts, setLaterStarts] = useState<LaterStartItem[]>([]);
  const [settings, setSettings] = useState<UserProfile>(defaultProfile);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setTasks(firstPilotCore.tasks.list());
    setHistory(firstPilotCore.history.list());
    setStarts(firstPilotCore.history.migrateStartsFromSessions());
    setBreaths(firstPilotCore.history.breaths());
    setReflections(firstPilotCore.history.reflections());
    setGoals(firstPilotCore.goals.list());
    setLaterStarts(firstPilotCore.laterStarts.list());
    setSettings(firstPilotCore.profile());
  }, []);

  useEffect(() => { refresh(); setReady(true); }, [refresh]);
  const updateTasks = useCallback((next: LearningTask[]) => { firstPilotCore.tasks.save(next); setTasks(next); }, []);
  const updateHistory = useCallback((next: LearningSession[]) => { firstPilotCore.history.replace(next); setHistory(next); }, []);
  const updateGoals = useCallback((next: Goal[]) => { firstPilotCore.goals.replace(next); setGoals(next); }, []);
  const updateSettings = useCallback((next: UserProfile) => { firstPilotCore.saveProfile(next); setSettings(next); }, []);
  const createTask = useCallback((title: string) => { const task = firstPilotCore.tasks.create(title, 10); refresh(); return task; }, [refresh]);
  const finishSession = useCallback((session: LearningSession, completeTask = false) => { firstPilotCore.finishSession(session, completeTask); refresh(); }, [refresh]);
  const recordStart = useCallback((event: StartEvent) => { firstPilotCore.recordStart(event); refresh(); }, [refresh]);
  const recordBreath = useCallback((session: BreathingSession) => { firstPilotCore.recordBreath(session); refresh(); }, [refresh]);
  const recordReflection = useCallback((reflection: SessionReflection) => { firstPilotCore.recordReflection(reflection); refresh(); }, [refresh]);
  const addLaterStart = useCallback((title: string) => { const item = firstPilotCore.laterStarts.add(title); refresh(); return item; }, [refresh]);
  const removeLaterStart = useCallback((id: string) => { firstPilotCore.laterStarts.remove(id); refresh(); }, [refresh]);
  const saveResume = useCallback((taskId: string | undefined, seconds: number, startedAt?: string, actionIndex = 0) => firstPilotCore.resume.save(taskId, seconds, startedAt, actionIndex), []);

  return { tasks, history, starts, breaths, reflections, goals, laterStarts, settings, ready, updateTasks, updateHistory, updateGoals, updateSettings, createTask, finishSession, recordStart, recordBreath, recordReflection, saveResume, addLaterStart, removeLaterStart, refresh, actions: firstPilotCore.actions, resume: ready ? firstPilotCore.resume.restore() : null, nextAction: ready ? firstPilotCore.getNextAction() : null };
}
