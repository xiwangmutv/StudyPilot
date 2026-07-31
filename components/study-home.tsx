"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import type { StateTransitionResult } from "@/lib/state-transition";

type ApiResult = StateTransitionResult & { source: "ai" | "fallback"; warning?: string; error?: string };
type Screen = "goal" | "state";

export function StudyHome() {
  const data = useStudyData();
  const router = useRouter();
  const params = useSearchParams();
  const [screen, setScreen] = useState<Screen>("goal");
  const [taskTitle, setTaskTitle] = useState("");
  const [blocker, setBlocker] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { const suggested = params.get("task"); if (suggested) setTaskTitle(suggested); }, [params]);

  function next(event: FormEvent) { event.preventDefault(); if (taskTitle.trim()) setScreen("state"); }

  async function begin(event: FormEvent) {
    event.preventDefault();
    const title = taskTitle.trim();
    const situation = blocker.trim();
    if (!title || !situation || loading) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/next-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: title, blocker: situation, completedSteps: [], preferredMinutes: data.settings.starterMinutes }) });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.nextStep) throw new Error(result.error || "暂时无法准备这次开始，请重试。");
      const task = data.createTask(title);
      data.actions.savePlan({
        taskId: task.id,
        updatedAt: new Date().toISOString(),
        source: result.source,
        situation,
        completedTransitionSteps: [],
        actionHistory: result.nextStep.readyForWork ? [] : [{
          id: crypto.randomUUID(),
          instruction: result.nextStep.instruction,
          blockerCategory: result.nextStep.blockerCategory,
          status: "pending",
          createdAt: new Date().toISOString(),
        }],
        transitionSteps: result.nextStep.readyForWork ? [] : [{ id: crypto.randomUUID(), instruction: result.nextStep.instruction }],
        steps: result.starterAction ? [{ id: crypto.randomUUID(), title: result.starterAction.title, description: result.starterAction.instruction, estimatedMinutes: result.starterAction.estimatedMinutes }] : [],
      });
      router.push(`/session?task=${task.id}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "暂时无法准备这次开始，请重试。"); }
    finally { setLoading(false); }
  }

  if (!data.ready) return null;
  return <AppShell settings={data.settings}><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 sm:py-20">
    {screen === "goal" ? <>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">FirstPilot · Your AI Action Guide</p>
      <h1 className="mt-5 font-display text-[clamp(3.25rem,8vw,5.6rem)] leading-[.9] tracking-[-.07em]">今天想<br />开始什么？</h1>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">帮助你从“想开始”，走到“已经开始”。不用规划全部，只处理眼前最大的阻碍。</p>
      <form onSubmit={next} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8">
        <label htmlFor="task" className="text-sm font-semibold">我想开始……</label>
        <input id="task" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} autoFocus placeholder="例如：做雅思听力、写代码、学习做饭" className="mt-3 w-full border-b border-[#d7d7ce] bg-transparent py-3 text-xl outline-none placeholder:text-[#aaa9a0]" />
        <button type="submit" disabled={!taskTitle.trim()} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">下一步</button>
      </form>
    </> : <>
      <button onClick={() => setScreen("goal")} className="w-fit text-sm text-[#77776f] hover:text-ink">← 返回</button>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">先不解决全部</p>
      <h1 className="mt-5 font-display text-[clamp(3rem,8vw,5rem)] leading-[.92] tracking-[-.07em]">现在卡在哪？</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#6B6B63]">用自己的话说就好。例如：“我很累、很困、也有点饿。” 我每次只带你走一步。</p>
      <form onSubmit={begin} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8">
        <label htmlFor="blocker" className="text-sm font-semibold">现在是什么情况？</label>
        <textarea id="blocker" value={blocker} onChange={(event) => setBlocker(event.target.value)} autoFocus rows={4} placeholder="例如：我躺在床上刷手机，想做听力，但是一点都不想动。" className="mt-3 w-full resize-none rounded-2xl border border-[#deded6] bg-[#fafaf7] p-4 leading-relaxed outline-none placeholder:text-[#aaa9a0] focus:border-[#bdbdb4]" />
        {message && <p role="status" className="mt-3 text-sm text-[#a74d3d]">{message}</p>}
        <button type="submit" disabled={loading || !blocker.trim()} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{loading ? "正在准备下一步…" : "带我开始"}</button>
      </form>
    </>}
  </section></AppShell>;
}
