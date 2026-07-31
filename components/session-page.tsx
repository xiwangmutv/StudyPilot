"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { advanceBreathing, breathingModes, initialBreathingState, patternDuration, type BreathingState } from "@/lib/breathing";
import { formatFocus } from "@/lib/archive-analytics";
import { LatestRequest } from "@/lib/latest-request";
import type { StateTransitionResult } from "@/lib/state-transition";
import { alignInstructionDuration, firstFocusLabel, firstFocusSeconds } from "@/lib/focus-duration";
import { shouldOfferBreathing } from "@/lib/start-assist";

type Phase = "transition" | "resolving" | "ritual-countdown" | "breathe" | "ready" | "starter" | "starter-paused" | "starter-complete" | "free" | "free-complete" | "summary";
type ApiResult = StateTransitionResult & { source: "ai" | "fallback"; error?: string };

const labels = { inhale: "吸气", holdIn: "吸后停顿", exhale: "呼气", holdOut: "呼后停顿", ready: "完成" } as const;

export function SessionPage() {
  const data = useStudyData();
  const taskId = useSearchParams().get("task");
  const [phase, setPhase] = useState<Phase>("transition");
  const [loadingNext, setLoadingNext] = useState(false);
  const [message, setMessage] = useState("");
  const [breathing, setBreathing] = useState<BreathingState>(() => initialBreathingState(breathingModes.start.pattern));
  const [countdown, setCountdown] = useState(3);
  const [seconds, setSeconds] = useState(0);
  const [starterRemaining, setStarterRemaining] = useState(0);
  const [starterSeconds, setStarterSeconds] = useState(0);
  const latestRequest = useRef(new LatestRequest());
  const requestInFlight = useRef(false);
  const ritualStartedAt = useRef<string | null>(null);
  const ritualRecorded = useRef(false);

  const task = useMemo(() => data.tasks.find((item) => item.id === taskId), [data.tasks, taskId]);
  const plan = task ? data.actions.getPlan(task) : null;
  const starter = task ? data.actions.getStep(task, 0) : null;
  const configuredStarterSeconds = firstFocusSeconds(data.settings);
  const configuredStarterLabel = firstFocusLabel(data.settings);
  const starterDescription = starter ? alignInstructionDuration(starter.description, data.settings) : "";
  const pendingAction = plan?.actionHistory?.find((action) => action.status === "pending");
  const transitionInstruction = pendingAction?.instruction;
  const pattern = breathingModes.start.pattern;
  // Breathing is an optional Action Loop tool, never a mandatory ritual.
  // The setting is read here so "不使用呼吸" changes actual flow behavior.
  const isBreathingStep = shouldOfferBreathing(transitionInstruction, data.settings);

  useEffect(() => {
    if (data.ready && phase === "transition" && !transitionInstruction) setPhase(starter ? "ready" : "summary");
  }, [data.ready, phase, starter, transitionInstruction]);

  useEffect(() => () => latestRequest.current.cancel(), []);

  useEffect(() => {
    if (phase !== "ritual-countdown") return;
    const id = window.setTimeout(() => countdown > 0 ? setCountdown((value) => value - 1) : setPhase("breathe"), countdown === 0 ? 450 : 1000);
    return () => window.clearTimeout(id);
  }, [countdown, phase]);

  useEffect(() => {
    if (phase !== "breathe" || breathing.stage === "ready") return;
    const id = window.setTimeout(
      () => setBreathing((state) => advanceBreathing(state, pattern, 1)),
      breathing.secondsRemaining === 0 ? 400 : 1000,
    );
    return () => window.clearTimeout(id);
  }, [breathing, pattern, phase]);

  useEffect(() => {
    if (phase !== "breathe" || breathing.stage !== "ready" || ritualRecorded.current || !ritualStartedAt.current) return;
    ritualRecorded.current = true;
    data.recordBreath({ id: crypto.randomUUID(), mode: "start", startedAt: ritualStartedAt.current, durationSeconds: patternDuration(pattern, 1), groups: 1 });
    void requestNextAction();
    // requestNextAction intentionally reads the latest local plan at this point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathing.stage, phase]);

  useEffect(() => {
    if (phase === "starter") {
      const id = window.setInterval(() => setStarterRemaining((value) => Math.max(0, value - 1)), 1000);
      return () => window.clearInterval(id);
    }
    if (phase !== "free") return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "starter" && starterRemaining === 0) finish(true);
    // The phase change inside finish prevents this from running twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, starterRemaining]);

  async function requestNextAction(resolution: "completed" | "ineffective" = "completed") {
    if (!task || !plan || requestInFlight.current) return;
    requestInFlight.current = true;
    const request = latestRequest.current.begin();
    let activePlan = plan;
    const actionToResolve = activePlan.actionHistory?.find((action) => action.status === "pending");
    if (actionToResolve) activePlan = data.actions.resolveAction(activePlan, actionToResolve.id, resolution);
    const completedSteps = (activePlan.actionHistory ?? [])
      .filter((action) => action.status === "completed")
      .map((action) => action.instruction)
      .slice(-5);

    // Do not leave the old action card visible while the next request is in flight.
    setPhase("resolving");
    setLoadingNext(true);
    setMessage("");

    try {
      const response = await fetch("/api/next-action", {
        method: "POST",
        signal: request.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: task.title,
          blocker: activePlan.situation ?? "我想开始，但还没有进入状态。",
          completedSteps,
          actionHistory: activePlan.actionHistory ?? [],
          preferredMinutes: data.settings.starterMinutes,
        }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.nextStep) throw new Error(result.error || "暂时无法判断下一步，请重试。");
      if (!latestRequest.current.isLatest(request.id)) return;

      if (result.nextStep.readyForWork && result.starterAction) {
        data.actions.savePlan({
          ...activePlan,
          updatedAt: new Date().toISOString(),
          source: result.source,
          completedTransitionSteps: completedSteps,
          steps: [{ id: crypto.randomUUID(), title: result.starterAction.title, description: result.starterAction.instruction, estimatedMinutes: result.starterAction.estimatedMinutes }],
        });
        setPhase("ready");
      } else {
        const nextPlan = data.actions.addAction({ ...activePlan, source: result.source, completedTransitionSteps: completedSteps }, result.nextStep.instruction, result.nextStep.blockerCategory);
        data.actions.savePlan(nextPlan);
        setPhase("transition");
      }
    } catch (error) {
      if (!latestRequest.current.isLatest(request.id) || (error instanceof DOMException && error.name === "AbortError")) return;
      setMessage(error instanceof Error ? error.message : "暂时无法判断下一步，请重试。");
      setPhase("transition");
    } finally {
      if (latestRequest.current.isLatest(request.id)) setLoadingNext(false);
      requestInFlight.current = false;
    }
  }

  function beginRitual() {
    ritualStartedAt.current = new Date().toISOString();
    ritualRecorded.current = false;
    setBreathing(initialBreathingState(pattern));
    setCountdown(3);
    setPhase("ritual-countdown");
  }

  function startStarter() {
    if (!task) return;
    data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: starter?.title ?? task.title, startedAt: new Date().toISOString() });
    setSeconds(0);
    setStarterRemaining(configuredStarterSeconds);
    setPhase("starter");
  }

  function startFree() {
    if (!task) return;
    data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: `继续：${task.title}`, startedAt: new Date().toISOString() });
    setSeconds(0);
    setPhase("free");
  }

  function finish(isStarter: boolean) {
    if (!task) return;
    const duration = isStarter ? configuredStarterSeconds - starterRemaining : seconds;
    data.finishSession({ id: crypto.randomUUID(), taskId: task.id, taskTitle: isStarter ? (starter?.title ?? task.title) : task.title, startedAt: new Date(Date.now() - duration * 1000).toISOString(), finishedAt: new Date().toISOString(), durationSeconds: duration, completed: true });
    if (isStarter) { setStarterSeconds(duration); setPhase("starter-complete"); } else setPhase("free-complete");
  }

  function endToday() {
    if (!task) return;
    data.updateTasks(data.tasks.map((item) => item.id === task.id ? { ...item, completed: true, completedAt: new Date().toISOString() } : item));
    setPhase("summary");
  }

  if (!data.ready || !task || !plan) return <AppShell settings={data.settings}><section className="py-24 text-center">这次启动已经结束。<Link className="ml-2 underline" href="/">回到首页</Link></section></AppShell>;

  const clock = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const starterClock = `${String(Math.floor(starterRemaining / 60)).padStart(2, "0")}:${String(starterRemaining % 60).padStart(2, "0")}`;
  const patternText = `吸气 ${pattern.inhale} 秒 · 吸后停顿 ${pattern.holdIn} 秒 · 呼气 ${pattern.exhale} 秒 · 呼后停顿 ${pattern.holdOut} 秒`;

  return <AppShell settings={data.settings} minimal><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 text-center">
    {phase === "resolving" && <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">FirstPilot</p><h1 className="mt-6 font-display text-5xl tracking-[-.06em]">正在判断下一步…</h1><p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-[#6B6B63]">刚才那一步已经完成。我们只处理眼前最需要的一步。</p></>}
    {phase === "transition" && transitionInstruction && <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">现在只做这一件事</p><h1 className="mx-auto mt-8 max-w-xl font-display text-[clamp(3rem,8vw,5rem)] leading-[.95] tracking-[-.06em]">{transitionInstruction}</h1><p className="mt-7 text-lg text-[#6B6B63]">完成后，我再带你走下一步。</p>{message && <p className="mt-4 text-sm text-[#a74d3d]">{message}</p>}<button onClick={isBreathingStep ? beginRitual : () => void requestNextAction()} disabled={loadingNext} className="mx-auto mt-10 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white disabled:opacity-50">{isBreathingStep ? "开始呼吸" : "我做到了"}</button><button onClick={() => void requestNextAction("ineffective")} disabled={loadingNext} className="mx-auto mt-4 block text-sm text-[#77776f] underline underline-offset-4">这一步没有帮到我</button></>}
    {phase === "ritual-countdown" && <Ritual title={countdown === 0 ? "开始" : "准备"} subtitle="把注意力带回此刻。"><p className="mt-9 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{countdown}</p></Ritual>}
    {phase === "breathe" && breathing.stage !== "ready" && <Ritual title="呼吸辅助" subtitle={patternText}><div className="mt-9 flex flex-col items-center"><p className="whitespace-nowrap px-3 font-display text-[clamp(2.25rem,8vw,4.25rem)] leading-none tracking-[-.05em]">{labels[breathing.stage]}</p><p className="mt-3 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{breathing.secondsRemaining}</p></div></Ritual>}
    {phase === "ready" && starter && <Ritual title="很好，现在开始第一步。" subtitle={starterDescription}><p className="mt-4 text-sm font-semibold text-[#77776f]">首次专注：{configuredStarterLabel}</p><button onClick={startStarter} className="mt-10 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white">开始行动</button></Ritual>}
    {phase === "starter" && starter && <><Focus title={starter.title} description={starterDescription} clock={starterClock} finish={() => finish(true)} /><button onClick={() => setPhase("starter-paused")} className="mx-auto mt-4 block text-sm text-[#77776f] underline underline-offset-4">暂停</button></>}
    {phase === "starter-paused" && starter && <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">已暂停</p><h1 className="mt-6 text-3xl font-semibold sm:text-5xl">{starter.title}</h1><p className="mx-auto mt-5 max-w-lg text-[#77776f]">{starterDescription}</p><p className="mt-4 text-sm font-semibold text-[#77776f]">首次专注：{configuredStarterLabel}</p><div className="mt-12 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{starterClock}</div><div className="mx-auto mt-12 flex justify-center gap-3"><button onClick={() => setPhase("starter")} className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">继续专注</button><button onClick={() => finish(true)} className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">完成本次行动</button></div></>}
    {phase === "free" && <Focus title={task.title} description="你已经进入状态了。按自己的节奏继续，不需要新的安排。" clock={clock} finish={() => finish(false)} />}
    {phase === "starter-complete" && <Completion heading="你已经开始了" duration={starterSeconds} onContinue={startFree} onEnd={endToday} />}
    {phase === "free-complete" && <Completion heading="又完成了一段" duration={seconds} onContinue={startFree} onEnd={endToday} />}
    {phase === "summary" && <><p className="text-4xl">✓</p><h1 className="mt-5 font-display text-5xl tracking-[-.06em]">今天到这里。</h1><p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-[#6B6B63]">你完成了开始，也留下了一段真实的专注。</p><div className="mt-10 flex justify-center gap-3"><Link href="/" className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">返回首页</Link><Link href="/history" className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">成长档案</Link></div></>}
  </section></AppShell>;
}

function Ritual({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <div><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">启动仪式</p><h1 className="mt-6 font-display text-5xl tracking-[-.06em] sm:text-6xl">{title}</h1><p className="mx-auto mt-6 max-w-lg leading-relaxed text-[#6B6B63]">{subtitle}</p>{children}</div>; }
function Focus({ title, description, clock, finish }: { title: string; description: string; clock: string; finish: () => void }) { return <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">正在专注</p><h1 className="mt-6 text-3xl font-semibold sm:text-5xl">{title}</h1><p className="mx-auto mt-5 max-w-lg text-[#77776f]">{description}</p><div className="mt-12 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{clock}</div><button onClick={finish} className="mx-auto mt-12 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">完成</button></>; }
function Completion({ heading, duration, onContinue, onEnd }: { heading: string; duration: number; onContinue: () => void; onEnd: () => void }) { const praise = duration < 60 ? "开始，比等待更重要。" : duration < 600 ? "节奏已经建立起来了。" : "这是一段扎实的专注。"; return <><p className="text-4xl">✓</p><h1 className="mt-5 font-display text-5xl tracking-[-.06em]">{heading}</h1><p className="mt-7 text-xl font-semibold">本次专注：{formatFocus(duration)}</p><p className="mt-3 text-lg text-[#6B6B63]">{praise}</p><div className="mt-10 flex justify-center gap-3"><button onClick={onContinue} className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">继续</button><button onClick={onEnd} className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">今天就到这里</button></div></>; }
