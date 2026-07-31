"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";
import { firstFocusLabel, firstFocusSeconds } from "@/lib/focus-duration";

type Phase = "focusing" | "complete";

export function SessionPage() {
  const data = useStudyData(); const { locale } = useLanguage(); const taskId = useSearchParams().get("task");
  const [phase, setPhase] = useState<Phase>("focusing"); const [remaining, setRemaining] = useState(0); const [elapsed, setElapsed] = useState(0); const started = useRef(false);
  const task = useMemo(() => data.tasks.find((item) => item.id === taskId), [data.tasks, taskId]); const seconds = firstFocusSeconds(data.settings); const zh = locale === "zh";
  useEffect(() => { if (!data.ready || !task || started.current) return; started.current = true; data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: task.title, startedAt: new Date().toISOString() }); setRemaining(seconds); }, [data, seconds, task]);
  useEffect(() => { if (phase !== "focusing" || !started.current) return; const id = window.setInterval(() => { setRemaining((v) => Math.max(0, v - 1)); setElapsed((v) => v + 1); }, 1000); return () => window.clearInterval(id); }, [phase]);
  useEffect(() => { if (phase === "focusing" && elapsed > 0 && remaining === 0) finishFocus(); }, [elapsed, phase, remaining]);
  function startFocus() { if (!task) return; data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: task.title, startedAt: new Date().toISOString() }); setElapsed(0); setRemaining(seconds); setPhase("focusing"); }
  function finishFocus() { if (!task) return; data.finishSession({ id: crypto.randomUUID(), taskId: task.id, taskTitle: task.title, startedAt: new Date(Date.now() - elapsed * 1000).toISOString(), finishedAt: new Date().toISOString(), durationSeconds: elapsed, completed: true }); setPhase("complete"); }
  if (!data.ready || !task) return <AppShell settings={data.settings}><section className="py-24 text-center">{zh ? "这次启动已经结束。" : "This start has already ended."}<Link className="ml-2 underline" href="/">{zh ? "回到首页" : "Back home"}</Link></section></AppShell>;
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  return <AppShell settings={data.settings} minimal><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 text-center">
    {phase === "focusing" && <div><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">{zh ? "专注中" : "FOCUSING"}</p><h1 className="mx-auto mt-6 max-w-xl text-3xl font-semibold sm:text-5xl">{task.title}</h1><div className="mt-12 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{clock}</div><p className="mt-5 text-sm text-[#77776f]">{zh ? `${firstFocusLabel(data.settings, locale)}，按你的节奏继续。` : `${firstFocusLabel(data.settings, locale)}. Keep going at your own pace.`}</p><button onClick={finishFocus} className="mt-12 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "结束专注" : "Finish focus"}</button></div>}
    {phase === "complete" && <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">FIRSTPILOT</p><h1 className="mx-auto mt-6 max-w-xl font-display text-[clamp(3rem,8vw,5rem)] leading-[.95] tracking-[-.06em]">{zh ? "很好。" : "Nice."}</h1><p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">{zh ? "你已经进入状态了。" : "You're in the flow now."}</p><div className="mt-10 flex justify-center gap-3"><button onClick={startFocus} className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "继续" : "Continue"}</button><Link href="/" className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">{zh ? "今天就到这里" : "Finish for today"}</Link></div></div>}
  </section></AppShell>;
}
