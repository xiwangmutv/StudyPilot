"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";
import type { StateTransitionResult } from "@/lib/state-transition";

type ApiResult = StateTransitionResult & { source: "ai" | "fallback"; warning?: string; error?: string };
type Screen = "goal" | "barrier";

export function StudyHome() {
  const data = useStudyData(); const router = useRouter(); const params = useSearchParams(); const { locale, messages: t } = useLanguage();
  const [screen, setScreen] = useState<Screen>("goal"); const [taskTitle, setTaskTitle] = useState(""); const [blocker, setBlocker] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  const barrierOptions = locale === "zh" ? ["我很累", "感觉太多了", "不知道从哪开始", "总被分心"] : ["I'm tired", "It feels overwhelming", "I don't know where to start", "I'm distracted"];
  const otherBarrier = locale === "zh" ? "或用自己的话说" : "Or describe it in your own words";
  const tinyStepTitle = locale === "zh" ? "眼前的一小步" : "Your next small step";

  useEffect(() => { const suggested = params.get("task"); if (suggested) setTaskTitle(suggested); }, [params]);
  function next(event: FormEvent) { event.preventDefault(); if (taskTitle.trim()) setScreen("barrier"); }
  async function begin(event: FormEvent) {
    event.preventDefault(); const title = taskTitle.trim(); const situation = blocker.trim(); if (!title || !situation || loading) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/next-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: title, blocker: situation, completedSteps: [], preferredMinutes: data.settings.starterMinutes }) });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.nextStep) throw new Error(result.error || t.home.error);
      const task = data.createTask(title);
      // The coach gives exactly one concrete next step, then the focus view takes over.
      const tinyStep = result.starterAction ?? { title: tinyStepTitle, instruction: result.nextStep.instruction, estimatedMinutes: data.settings.starterMinutes };
      data.actions.savePlan({ taskId: task.id, updatedAt: new Date().toISOString(), source: result.source, situation, completedTransitionSteps: [], actionHistory: [], transitionSteps: [], steps: [{ id: crypto.randomUUID(), title: tinyStep.title, description: tinyStep.instruction, estimatedMinutes: tinyStep.estimatedMinutes }] });
      router.push(`/session?task=${task.id}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : t.home.error); } finally { setLoading(false); }
  }
  if (!data.ready) return null;
  return <AppShell settings={data.settings}><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 sm:py-20">
    {screen === "goal" ? <>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">FirstPilot · {t.home.eyebrow}</p><h1 className="mt-5 whitespace-pre-line font-display text-[clamp(3.25rem,8vw,5.6rem)] leading-[.9] tracking-[-.07em]">{t.home.title}</h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">{t.home.description}</p>
      <form onSubmit={next} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8"><label htmlFor="task" className="text-sm font-semibold">{t.home.taskLabel}</label><input id="task" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} autoFocus placeholder={t.home.taskPlaceholder} className="mt-3 w-full border-b border-[#d7d7ce] bg-transparent py-3 text-xl outline-none placeholder:text-[#aaa9a0]" /><button type="submit" disabled={!taskTitle.trim()} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{t.home.next}</button></form>
    </> : <>
      <button onClick={() => setScreen("goal")} className="w-fit text-sm text-[#77776f] hover:text-ink">{t.home.back}</button><p className="mt-10 text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">{t.home.stateEyebrow}</p><h1 className="mt-5 font-display text-[clamp(3rem,8vw,5rem)] leading-[.92] tracking-[-.07em]">{t.home.stateTitle}</h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-[#6B6B63]">{t.home.stateDescription}</p>
      <form onSubmit={begin} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8"><label className="text-sm font-semibold">{t.home.blockerLabel}</label><div className="mt-4 grid gap-2 sm:grid-cols-2">{barrierOptions.map((option) => <button type="button" key={option} onClick={() => setBlocker(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${blocker === option ? "border-ink bg-[#f1f1ec]" : "border-[#deded6] bg-[#fafaf7] hover:border-[#bdbdb4]"}`}>{option}</button>)}</div><label htmlFor="blocker" className="mt-5 block text-sm font-semibold">{otherBarrier}</label><textarea id="blocker" value={blocker} onChange={(event) => setBlocker(event.target.value)} rows={3} placeholder={t.home.blockerPlaceholder} className="mt-3 w-full resize-none rounded-2xl border border-[#deded6] bg-[#fafaf7] p-4 leading-relaxed outline-none placeholder:text-[#aaa9a0] focus:border-[#bdbdb4]" />{message && <p role="status" className="mt-3 text-sm text-[#a74d3d]">{message}</p>}<button type="submit" disabled={loading || !blocker.trim()} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{loading ? t.home.preparing : t.home.start}</button></form>
    </>}
  </section></AppShell>;
}
