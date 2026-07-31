"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import type { StarterActionResult } from "@/lib/action-decomposition";

type ApiResult = StarterActionResult & { source: "ai" | "fallback"; warning?: string; error?: string };

export function StudyHome() {
  const data = useStudyData(); const router = useRouter(); const params = useSearchParams();
  const [taskTitle, setTaskTitle] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { const suggested = params.get("task"); if (suggested) setTaskTitle(suggested); }, [params]);
  async function begin(event: FormEvent) { event.preventDefault(); const title = taskTitle.trim(); if (!title || loading) return; setLoading(true); setMessage(""); try {
    const response = await fetch("/api/next-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: title, preferredMinutes: data.settings.starterMinutes }) });
    const result = await response.json() as ApiResult; if (!response.ok || !result.starterAction) throw new Error(result.error || "暂时无法准备启动动作。");
    const task = data.createTask(title); data.actions.savePlan({ taskId: task.id, updatedAt: new Date().toISOString(), source: result.source, steps: [{ id: crypto.randomUUID(), title: result.starterAction.title, description: result.starterAction.instruction, estimatedMinutes: result.starterAction.estimatedMinutes }] }); router.push(`/session?task=${task.id}`);
  } catch (error) { setMessage(error instanceof Error ? error.message : "暂时无法准备启动动作，请重试。"); } finally { setLoading(false); } }
  if (!data.ready) return null;
  return <AppShell settings={data.settings}><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 sm:py-20"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">StudyPilot · 学习启动器</p><h1 className="mt-5 font-display text-[clamp(3.25rem,8vw,5.6rem)] leading-[.9] tracking-[-.07em]">你现在<br />准备做什么？</h1><p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">不用规划整天。把眼前这件事交给我，我们从真正能开始的一小段进入状态。</p><form onSubmit={begin} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8"><label htmlFor="task" className="text-sm font-semibold">我现在准备做</label><input id="task" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} autoFocus disabled={loading} placeholder="例如：做第 52 章的听力" className="mt-3 w-full border-b border-[#d7d7ce] bg-transparent py-3 text-xl outline-none placeholder:text-[#aaa9a0] disabled:opacity-60" /><p className="mt-3 text-xs leading-relaxed text-[#85857D]">AI 只会准备一段约 {data.settings.starterMinutes} 分钟的启动单元，不会给你一整套计划。</p>{message && <p role="status" className="mt-3 text-sm text-[#a74d3d]">{message}</p>}<button type="submit" disabled={loading || !taskTitle.trim()} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{loading ? "正在准备第一步…" : "准备开始"}</button></form></section></AppShell>;
}
