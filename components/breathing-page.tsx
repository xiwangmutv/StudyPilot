"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { advanceBreathing, breathingModes, initialBreathingState, patternDuration, type BreathingMode, type BreathingState } from "@/lib/breathing";

const modes = Object.entries(breathingModes) as [BreathingMode, (typeof breathingModes)[BreathingMode]][];
const phaseLabel = { inhale: "吸气", holdIn: "吸后停顿", exhale: "呼气", holdOut: "呼后停顿", ready: "完成" } as const;

export function BreathingPage() {
  const data = useStudyData();
  const [mode, setMode] = useState<BreathingMode>("start");
  const [groups, setGroups] = useState<1 | 2 | 3>(1);
  const [state, setState] = useState<BreathingState | null>(null);
  const startedAt = useRef<string | null>(null);
  const recorded = useRef(false);
  const selected = breathingModes[mode];

  useEffect(() => {
    if (!state || state.stage === "ready") return;
    const id = window.setInterval(() => setState((current) => current ? advanceBreathing(current, selected.pattern, groups) : null), 1000);
    return () => window.clearInterval(id);
  }, [groups, selected.pattern, state]);

  useEffect(() => {
    if (state?.stage !== "ready" || recorded.current || !startedAt.current) return;
    recorded.current = true;
    data.recordBreath({ id: crypto.randomUUID(), mode, startedAt: startedAt.current, durationSeconds: patternDuration(selected.pattern, groups), groups });
  }, [data, groups, mode, selected.pattern, state?.stage]);

  if (!data.ready) return null;
  const patternText = `吸气 ${selected.pattern.inhale} 秒 · 吸后停顿 ${selected.pattern.holdIn} 秒 · 呼气 ${selected.pattern.exhale} 秒 · 呼后停顿 ${selected.pattern.holdOut} 秒`;
  const start = () => { startedAt.current = new Date().toISOString(); recorded.current = false; setState(initialBreathingState(selected.pattern)); };
  const reset = () => { startedAt.current = null; recorded.current = false; setState(null); };

  return <AppShell settings={data.settings}><section className="mx-auto max-w-2xl py-16 sm:py-24"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">调整状态</p><h1 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">呼吸训练</h1>
    {!state ? <div className="mt-12"><div className="grid gap-3 sm:grid-cols-2">{modes.map(([id, item]) => <button key={id} onClick={() => setMode(id)} className={`rounded-[22px] p-5 text-left transition ${mode === id ? "bg-ink text-white shadow-button" : "bg-white shadow-card hover:-translate-y-0.5"}`}><p className="font-semibold">{item.label}{id === "start" ? "（默认）" : ""}</p><p className={`mt-2 text-sm ${mode === id ? "text-white/70" : "text-[#77776f]"}`}>{item.description}</p><p className={`mt-4 text-xs ${mode === id ? "text-white/60" : "text-[#88887f]"}`}>{item.pattern.inhale}-{item.pattern.holdIn}-{item.pattern.exhale}-{item.pattern.holdOut}</p></button>)}</div><div className="mt-8 rounded-[25px] bg-white p-6 shadow-card"><p className="text-sm font-semibold">呼吸组数</p><div className="mt-4 flex gap-2">{([1, 2, 3] as const).map((value) => <button key={value} onClick={() => setGroups(value)} className={`rounded-full px-4 py-2 text-sm ${groups === value ? "bg-ink text-white" : "bg-[#f0f0eb]"}`}>{value} 组</button>)}</div><p className="mt-5 text-sm leading-relaxed text-[#77776f]">每组：{patternText}</p><p className="mt-2 text-xs text-[#919189]">预计 {patternDuration(selected.pattern, groups)} 秒</p><button onClick={start} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">开始呼吸</button></div></div> : <div className="mt-16 text-center"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">{selected.label} · 第 {Math.min(state.group, groups)} / {groups} 组</p><h2 className="mt-8 font-display text-[clamp(4rem,14vw,8rem)] leading-none tracking-[-.07em]">{phaseLabel[state.stage]}<br />{state.stage === "ready" ? "✓" : state.secondsRemaining}</h2><p className="mt-8 text-sm leading-relaxed text-[#6B6B63]">{patternText}</p>{state.stage === "ready" && <button onClick={reset} className="mt-10 rounded-full bg-ink px-7 py-3 text-sm font-semibold text-white">完成</button>}</div>}
  </section></AppShell>;
}
