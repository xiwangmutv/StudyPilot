"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";
import type { StateTransitionResult } from "@/lib/state-transition";
import { firstFocusLabel, firstFocusSeconds } from "@/lib/focus-duration";

type Phase = "ready" | "focusing" | "paused" | "reflection" | "barrier" | "next" | "summary";
type ApiResult = StateTransitionResult & { source: "ai" | "fallback"; error?: string };

export function SessionPage() {
  const data = useStudyData();
  const { locale } = useLanguage();
  const taskId = useSearchParams().get("task");
  const [phase, setPhase] = useState<Phase>("ready");
  const [remaining, setRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [barrier, setBarrier] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [coachReason, setCoachReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const task = useMemo(() => data.tasks.find((item) => item.id === taskId), [data.tasks, taskId]);
  const plan = task ? data.actions.getPlan(task) : null;
  const step = task ? data.actions.getStep(task) : null;
  const focusSeconds = firstFocusSeconds(data.settings);
  const zh = locale === "zh";

  useEffect(() => {
    if (phase !== "focusing") return;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "focusing" && remaining === 0 && elapsed > 0) finishFocus();
    // finishFocus moves the phase away from focusing, preventing a second completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, elapsed]);

  function startFocus() {
    if (!task) return;
    data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: step?.title ?? task.title, startedAt: new Date().toISOString() });
    setRemaining(focusSeconds); setElapsed(0); setPhase("focusing");
  }

  function finishFocus() {
    if (!task) return;
    // Completion is decided by the reflection, not by merely stopping the timer.
    data.finishSession({ id: crypto.randomUUID(), taskId: task.id, taskTitle: step?.title ?? task.title, startedAt: new Date(Date.now() - elapsed * 1000).toISOString(), finishedAt: new Date().toISOString(), durationSeconds: elapsed, completed: false });
    setPhase("reflection");
  }

  async function reflect(completed: boolean) {
    if (!task) return;
    if (!completed) { setPhase("barrier"); return; }
    const latestSession = data.history.slice().sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    if (latestSession) data.updateHistory(data.history.map((item) => item.id === latestSession.id ? { ...item, completed: true } : item));
    data.recordReflection({ id: crypto.randomUUID(), taskId: task.id, taskTitle: task.title, feeling: "顺", memory: zh ? "完成了这一步" : "Completed the step", createdAt: new Date().toISOString() });
    await getNextStep(zh ? "我完成了刚才这一步。给我下一件最小、可立刻执行的事。" : "I completed that step. Give me the next smallest thing I can do now.");
  }

  async function submitBarrier() {
    if (!task || !barrier.trim()) return;
    data.recordReflection({ id: crypto.randomUUID(), taskId: task.id, taskTitle: task.title, feeling: "难", memory: barrier.trim(), createdAt: new Date().toISOString() });
    await getNextStep(barrier.trim());
  }

  async function getNextStep(blocker: string) {
    if (!task || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/next-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: task.title, blocker, completedSteps: step ? [step.description] : [], preferredMinutes: data.settings.starterMinutes }) });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.nextStep) throw new Error(result.error || (zh ? "暂时无法准备下一步。" : "We couldn't prepare your next step."));
      setNextStep(result.starterAction?.instruction ?? result.nextStep.instruction);
      setCoachReason(getCoachReason(result.nextStep.blockerCategory, blocker, zh));
      setPhase("next");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (zh ? "暂时无法准备下一步。" : "We couldn't prepare your next step."));
    } finally { setLoading(false); }
  }

  if (!data.ready || !task || !plan) return <AppShell settings={data.settings}><section className="py-24 text-center">{zh ? "这次启动已经结束。" : "This start has already ended."}<Link className="ml-2 underline" href="/">{zh ? "回到首页" : "Back home"}</Link></section></AppShell>;

  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const barrierOptions = zh ? ["我被打断了", "这一步还是太大", "我没有精力", "我不知道怎么做"] : ["I got interrupted", "This is still too big", "I don't have the energy", "I don't know how to do it"];

  return <AppShell settings={data.settings} minimal><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 text-center">
    {phase === "ready" && <CoachCard eyebrow={zh ? "你的下一小步" : "Your next small step"} title={step?.title ?? task.title} text={step?.description ?? ""}><p className="mt-4 text-sm font-semibold text-[#77776f]">{zh ? `专注 ${firstFocusLabel(data.settings)}` : `Focus for ${firstFocusLabel(data.settings)}`}</p><button onClick={startFocus} className="mt-10 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white">{zh ? "开始专注" : "Start focus"}</button></CoachCard>}
    {phase === "focusing" && <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">{zh ? "正在专注" : "FOCUSING"}</p><h1 className="mx-auto mt-6 max-w-xl text-3xl font-semibold sm:text-5xl">{step?.title ?? task.title}</h1><p className="mx-auto mt-5 max-w-lg text-[#77776f]">{step?.description}</p><div className="mt-12 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{clock}</div><button onClick={finishFocus} className="mx-auto mt-12 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "结束并反思" : "Finish & reflect"}</button><button onClick={() => setPhase("paused")} className="mx-auto mt-4 block text-sm text-[#77776f] underline underline-offset-4">{zh ? "暂停" : "Pause"}</button></>}
    {phase === "paused" && <CoachCard eyebrow={zh ? "已暂停" : "PAUSED"} title={step?.title ?? task.title} text={zh ? "准备好时，再回来继续这一小步。" : "Return when you are ready to continue this small step."}><div className="mt-10 flex justify-center gap-3"><button onClick={() => setPhase("focusing")} className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "继续" : "Resume"}</button><button onClick={finishFocus} className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">{zh ? "结束" : "Finish"}</button></div></CoachCard>}
    {phase === "reflection" && <CoachCard eyebrow={zh ? "简短回顾" : "QUICK REFLECTION"} title={zh ? "这一步完成了吗？" : "Did you complete this step?"} text={zh ? "如实回答就好。我们据此决定下一步。" : "Answer honestly. We'll use it to choose the next step."}><div className="mt-10 flex justify-center gap-3"><button onClick={() => void reflect(true)} className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "完成了" : "Yes, I did"}</button><button onClick={() => void reflect(false)} className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">{zh ? "还没有" : "Not yet"}</button></div></CoachCard>}
    {phase === "barrier" && <CoachCard eyebrow={zh ? "找到阻碍" : "NAME THE BARRIER"} title={zh ? "什么挡住了你？" : "What got in the way?"} text={zh ? "选一个，或用自己的话说。" : "Choose one, or describe it briefly."}><div className="mx-auto mt-8 grid max-w-lg gap-2 sm:grid-cols-2">{barrierOptions.map((option) => <button key={option} onClick={() => setBarrier(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm ${barrier === option ? "border-ink bg-[#f1f1ec]" : "border-[#deded6] bg-[#fafaf7]"}`}>{option}</button>)}</div><textarea value={barrier} onChange={(event) => setBarrier(event.target.value)} placeholder={zh ? "或者写下发生了什么" : "Or describe what happened"} rows={3} className="mx-auto mt-4 block w-full max-w-lg resize-none rounded-2xl border border-[#deded6] bg-[#fafaf7] p-4 outline-none" />{error && <p className="mt-3 text-sm text-[#a74d3d]">{error}</p>}<button onClick={() => void submitBarrier()} disabled={!barrier.trim() || loading} className="mt-6 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white disabled:opacity-45">{loading ? (zh ? "正在准备…" : "Preparing…") : (zh ? "给我下一步" : "Show my next step")}</button></CoachCard>}
    {phase === "next" && <div><div className="mx-auto max-w-lg rounded-2xl border border-[#e1e1d9] bg-white px-5 py-4 text-left shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7B7B73]">Coach</p><p className="mt-2 text-sm leading-relaxed text-[#686860]">{coachReason}</p></div><p className="mt-10 text-xs font-semibold tracking-[.16em] text-[#7B7B73]">{zh ? "你的下一步" : "YOUR NEXT STEP"}</p><h1 className="mx-auto mt-5 max-w-xl font-display text-[clamp(3rem,8vw,5rem)] leading-[.95] tracking-[-.06em]">{nextStep}</h1><p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[#6B6B63]">{zh ? "只做这一件事就够了。" : "Just this one thing is enough."}</p><div className="mt-10 flex justify-center gap-3"><Link href="/" className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "我准备好了" : "I'm Ready"}</Link><button onClick={() => setPhase("summary")} className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">{zh ? "今天先跳过" : "Skip for Today"}</button></div></div>}
    {phase === "summary" && <CoachCard eyebrow="FirstPilot" title={zh ? "今天到这里。" : "That's enough for today."} text={zh ? "你已经为下一次开始留下了线索。" : "You've left yourself a clear way back in."}><Link href="/" className="mt-10 inline-block rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">{zh ? "回到首页" : "Back home"}</Link></CoachCard>}
  </section></AppShell>;
}

function CoachCard({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children: React.ReactNode }) {
  return <div><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">{eyebrow}</p><h1 className="mx-auto mt-6 max-w-xl font-display text-[clamp(3rem,8vw,5rem)] leading-[.95] tracking-[-.06em]">{title}</h1><p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[#6B6B63]">{text}</p>{children}</div>;
}

function getCoachReason(category: StateTransitionResult["nextStep"]["blockerCategory"], barrier: string, zh: boolean) {
  const said = barrier.trim();
  const reasons = zh
    ? {
        physical: "你说自己有些累，所以我们从一个轻一点、马上能做的动作开始。",
        emotional: "你说现在有些难受，所以我们先把压力降下来一点。",
        cognitive: "你说不知道从哪里开始，所以这一步只给你一个清楚的起点。",
        environmental: "你说自己容易被打断，所以这一步先帮你腾出一点专注空间。",
        perfectionism: "你说事情感觉太多，所以我们把下一步缩小到刚刚好。",
        ready: "你已经有一点 momentum 了，所以我们把下一步保持简单。",
      }
    : {
        physical: "You said you're feeling tired, so let's start with something light and immediately doable.",
        emotional: "You said this feels hard right now, so let's lower the pressure before asking for more.",
        cognitive: "You said you don't know where to start, so this gives you one clear place to begin.",
        environmental: "You said you're getting pulled away, so this helps create a little space to focus.",
        perfectionism: "You said it feels like too much, so we're making the next move smaller.",
        ready: "You've already created some momentum, so let's keep the next move simple.",
      };
  return said ? `${zh ? `你刚才说：“${said}”` : `You said: “${said}”`} ${reasons[category]}` : reasons[category];
}
