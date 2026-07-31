"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";
import { getSuggestion } from "@/lib/state-switch";

export function StudyHome() {
  const data = useStudyData(); const router = useRouter(); const params = useSearchParams(); const { locale } = useLanguage();
  const [taskTitle, setTaskTitle] = useState("");
  const existingTask = useMemo(() => data.tasks.find((task) => !task.completed), [data.tasks]);
  const taskName = existingTask?.title || taskTitle; const suggestion = getSuggestion(locale);
  const copy = locale === "zh" ? { eyebrow: "FIRSTPILOT", title: "先进入状态。", description: "你知道要做什么。我们只帮你跨过开始前的一分钟。", goal: "今天的目标", placeholder: "例如：雅思听力", suggestionLabel: "AI 建议", readyButton: "开始专注" } : { eyebrow: "FIRSTPILOT", title: "Get into the flow.", description: "You already know what to do. We'll only help you cross the first minute.", goal: "Today's goal", placeholder: "For example: IELTS listening", suggestionLabel: "AI Suggestion", readyButton: "Start Focus" };
  useEffect(() => { const suggested = params.get("task"); if (suggested) setTaskTitle(suggested); }, [params]);
  function begin(event: FormEvent) { event.preventDefault(); const task = existingTask ?? (taskTitle.trim() ? data.createTask(taskTitle.trim()) : null); if (task) router.push(`/session?task=${task.id}`); }
  if (!data.ready) return null;
  return <AppShell settings={data.settings}><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 sm:py-20">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">{copy.eyebrow}</p><h1 className="mt-5 font-display text-[clamp(3.25rem,8vw,5.6rem)] leading-[.9] tracking-[-.07em]">{copy.title}</h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">{copy.description}</p>
    <form onSubmit={begin} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold text-[#77776f]">{copy.goal}</p>{existingTask ? <p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{existingTask.title}</p> : <input aria-label={copy.goal} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} autoFocus placeholder={copy.placeholder} className="mt-3 w-full border-b border-[#d7d7ce] bg-transparent py-3 text-xl outline-none placeholder:text-[#aaa9a0]" />}
      <div className="mt-8 rounded-2xl bg-[#f1f1ec] p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7B7B73]">{copy.suggestionLabel}</p><p className="mt-3 text-lg font-semibold tracking-[-.03em]">{suggestion}</p></div><button type="submit" disabled={!taskName.trim()} className="mt-7 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{copy.readyButton}</button>
    </form>
  </section></AppShell>;
}
