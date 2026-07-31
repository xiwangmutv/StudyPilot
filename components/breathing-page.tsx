"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { advanceBreathing, breathingModes, initialBreathingState, patternDuration, type BreathingMode, type BreathingState } from "@/lib/breathing";

type Step = "select" | "intro" | "countdown" | "breathing" | "complete";
const modes = Object.entries(breathingModes) as [BreathingMode, (typeof breathingModes)[BreathingMode]][];
const phaseLabel = { inhale: "吸气", holdIn: "吸后停顿", exhale: "呼气", holdOut: "呼后停顿", ready: "完成" } as const;

export function BreathingPage() {
  const data = useStudyData();
  const [mode, setMode] = useState<BreathingMode>("start");
  const [groups, setGroups] = useState<1 | 2 | 3>(1);
  const [step, setStep] = useState<Step>("select");
  const [countdown, setCountdown] = useState(3);
  const [state, setState] = useState<BreathingState>(() => initialBreathingState(breathingModes.start.pattern));
  const startedAt = useRef<string | null>(null);
  const recorded = useRef(false);
  const selected = breathingModes[mode];

  useEffect(() => {
    if (step !== "countdown") return;
    const delay = countdown === 0 ? 450 : 1000;
    const id = window.setTimeout(() => {
      if (countdown > 0) setCountdown((current) => current - 1);
      else setStep("breathing");
    }, delay);
    return () => window.clearTimeout(id);
  }, [countdown, step]);

  useEffect(() => {
    if (step !== "breathing" || state.stage === "ready") return;
    const delay = state.secondsRemaining === 0 ? 400 : 1000;
    const id = window.setTimeout(() => setState((current) => advanceBreathing(current, selected.pattern, groups)), delay);
    return () => window.clearTimeout(id);
  }, [groups, selected.pattern, state, step]);

  useEffect(() => {
    if (step !== "breathing" || state.stage !== "ready" || recorded.current || !startedAt.current) return;
    recorded.current = true;
    data.recordBreath({ id: crypto.randomUUID(), mode, startedAt: startedAt.current, durationSeconds: patternDuration(selected.pattern, groups), groups });
    setStep("complete");
  }, [data, groups, mode, selected.pattern, state.stage, step]);

  if (!data.ready) return null;
  const patternText = `吸气 ${selected.pattern.inhale} 秒 · 吸后停顿 ${selected.pattern.holdIn} 秒 · 呼气 ${selected.pattern.exhale} 秒 · 呼后停顿 ${selected.pattern.holdOut} 秒`;
  const beginCountdown = () => { startedAt.current = new Date().toISOString(); recorded.current = false; setState(initialBreathingState(selected.pattern)); setCountdown(3); setStep("countdown"); };
  const reset = () => { startedAt.current = null; recorded.current = false; setStep("select"); };

  return <AppShell settings={data.settings}><section className="mx-auto max-w-2xl py-16 sm:py-24">
    {step === "select" && <><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">调整状态</p><h1 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">呼吸训练</h1>
      <div className="mt-12 grid gap-3 sm:grid-cols-2">{modes.map(([id, item]) => <button key={id} onClick={() => setMode(id)} className={`rounded-[22px] p-5 text-left transition ${mode === id ? "bg-ink text-white shadow-button" : "bg-white shadow-card hover:-translate-y-0.5"}`}><p className="font-semibold">{item.label}{id === "start" ? "（默认）" : ""}</p><p className={`mt-2 text-sm ${mode === id ? "text-white/70" : "text-[#77776f]"}`}>{item.description}</p><p className={`mt-4 text-xs ${mode === id ? "text-white/60" : "text-[#88887f]"}`}>{item.pattern.inhale}-{item.pattern.holdIn}-{item.pattern.exhale}-{item.pattern.holdOut}</p></button>)}</div>
      <div className="mt-8 rounded-[25px] bg-white p-6 shadow-card"><p className="text-sm font-semibold">呼吸组数</p><div className="mt-4 flex gap-2">{([1, 2, 3] as const).map((value) => <button key={value} onClick={() => setGroups(value)} className={`rounded-full px-4 py-2 text-sm ${groups === value ? "bg-ink text-white" : "bg-[#f0f0eb]"}`}>{value} 组</button>)}</div><p className="mt-5 text-sm leading-relaxed text-[#77776f]">每组：{patternText}</p><p className="mt-2 text-xs text-[#919189]">预计 {patternDuration(selected.pattern, groups)} 秒</p><button onClick={() => setStep("intro")} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">进入准备</button></div></>}
    {step === "intro" && <Centered title="呼吸训练" subtitle="调整坐姿，放松肩膀，准备开始。"><p className="mt-6 text-sm text-[#77776f]">共 {groups} 组 · {patternText}</p><button onClick={beginCountdown} className="mt-10 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">开始呼吸</button></Centered>}
    {step === "countdown" && <Centered title={countdown === 0 ? "开始" : "准备"} subtitle="让注意力慢慢回到此刻。"><p className="mt-8 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{countdown}</p></Centered>}
    {step === "breathing" && state.stage !== "ready" && <Centered title={`${selected.label} · 第 ${state.group} / ${groups} 组`} subtitle={patternText}><div className="mt-8 flex flex-col items-center"><p className="max-w-full whitespace-nowrap px-3 font-display text-[clamp(2.25rem,8vw,4.25rem)] leading-none tracking-[-.05em]">{phaseLabel[state.stage]}</p><p className="mt-3 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{state.secondsRemaining}</p></div></Centered>}
    {step === "complete" && <Centered title="很好。" subtitle="呼吸已经完成。现在可以带着更稳定的节奏，开始下一步。"><button onClick={reset} className="mt-10 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">完成</button></Centered>}
  </section></AppShell>;
}

function Centered({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center text-center"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">慢一点，也没关系</p><h1 className="mt-5 font-display text-5xl tracking-[-.06em] sm:text-6xl">{title}</h1><p className="mx-auto mt-5 max-w-md leading-relaxed text-[#6B6B63]">{subtitle}</p>{children}</div>; }
