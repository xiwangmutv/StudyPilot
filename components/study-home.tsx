"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";
import { recommendStateSwitch, type StateContext } from "@/lib/state-switch";

export function StudyHome() {
  const data = useStudyData(); const router = useRouter(); const params = useSearchParams(); const { locale } = useLanguage();
  const [taskTitle, setTaskTitle] = useState(""); const [context, setContext] = useState<StateContext>("ready");
  const existingTask = useMemo(() => data.tasks.find((task) => !task.completed), [data.tasks]);
  const taskName = existingTask?.title || taskTitle; const suggestion = recommendStateSwitch(context, locale);
  const copy = locale === "zh" ? { eyebrow: "FIRSTPILOT", title: "先进入状态。", description: "你知道要做什么。我们只帮你跨过开始前的一分钟。", goal: "今天的目标", placeholder: "例如：雅思听力", context: "现在感觉怎么样？（可选）", ready: "可以开始", tired: "有点累", distracted: "容易分心", overwhelmed: "脑子很乱", switchLabel: "先做这一件", readyButton: "我准备好了" } : { eyebrow: "FIRSTPILOT", title: "Get into the flow.", description: "You already know what to do. We'll only help you cross the first minute.", goal: "Today's goal", placeholder: "For example: IELTS listening", context: "How are you arriving? (optional)", ready: "Ready to begin", tired: "A little tired", distracted: "Distracted", overwhelmed: "Mind feels full", switchLabel: "Do this first", readyButton: "I'm Ready" };
  useEffect(() => { const suggested = params.get("task"); if (suggested) setTaskTitle(suggested); }, [params]);
  function begin(event: FormEvent) { event.preventDefault(); const task = existingTask ?? (taskTitle.trim() ? data.createTask(taskTitle.trim()) : null); if (task) router.push(`/session?task=${task.id}&switch=${context}`); }
  if (!data.ready) return null;
  return <AppShell settings={data.settings}><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 sm:py-20">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">{copy.eyebrow}</p><h1 className="mt-5 font-display text-[clamp(3.25rem,8vw,5.6rem)] leading-[.9] tracking-[-.07em]">{copy.title}</h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">{copy.description}</p>
    <form onSubmit={begin} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold text-[#77776f]">{copy.goal}</p>{existingTask ? <p className="mt-2 text-2xl font-semibold tracking-[-.04em]">{existingTask.title}</p> : <input aria-label={copy.goal} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} autoFocus placeholder={copy.placeholder} className="mt-3 w-full border-b border-[#d7d7ce] bg-transparent py-3 text-xl outline-none placeholder:text-[#aaa9a0]" />}
      <p className="mt-8 text-sm font-semibold">{copy.context}</p><div className="mt-3 flex flex-wrap gap-2">{(["ready", "tired", "distracted", "overwhelmed"] as StateContext[]).map((option) => <button type="button" key={option} onClick={() => setContext(option)} className={`rounded-full border px-4 py-2 text-sm transition ${context === option ? "border-ink bg-ink text-white" : "border-[#deded6] bg-[#fafaf7] hover:border-[#bdbdb4]"}`}>{copy[option]}</button>)}</div>
      <div className="mt-8 rounded-2xl bg-[#f1f1ec] p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7B7B73]">{copy.switchLabel} · {suggestion.seconds}s</p><p className="mt-3 text-xl font-semibold tracking-[-.03em]">{suggestion.title}</p><p className="mt-2 text-sm leading-relaxed text-[#6B6B63]">{suggestion.detail}</p></div><button type="submit" disabled={!taskName.trim()} className="mt-7 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{copy.readyButton}</button>
    </form>
  </section></AppShell>;
}
