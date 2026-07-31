"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { advanceBreathing, breathingModes, initialBreathingState, patternDuration, type BreathingState } from "@/lib/breathing";
import { formatFocus } from "@/lib/archive-analytics";

type Phase = "confirm" | "ritual-intro" | "ritual-countdown" | "breathe" | "ready" | "starter" | "starter-complete" | "free" | "free-complete" | "summary";
const labels = { inhale: "吸气", holdIn: "吸后停顿", exhale: "呼气", holdOut: "呼后停顿", ready: "完成" } as const;

export function SessionPage() {
  const data = useStudyData();
  const taskId = useSearchParams().get("task");
  const [phase, setPhase] = useState<Phase>("confirm");
  const [breathing, setBreathing] = useState<BreathingState>(() => initialBreathingState(breathingModes.start.pattern));
  const [countdown, setCountdown] = useState(3);
  const [seconds, setSeconds] = useState(0);
  const [starterSeconds, setStarterSeconds] = useState(0);
  const ritualStartedAt = useRef<string | null>(null);
  const ritualRecorded = useRef(false);
  const task = useMemo(() => data.tasks.find((item) => item.id === taskId), [data.tasks, taskId]);
  const starter = task ? data.actions.getStep(task, 0) : null;
  const pattern = breathingModes.start.pattern;

  useEffect(() => {
    if (phase !== "ritual-countdown") return;
    const id = window.setTimeout(() => {
      if (countdown > 0) setCountdown((current) => current - 1);
      else setPhase("breathe");
    }, countdown === 0 ? 450 : 1000);
    return () => window.clearTimeout(id);
  }, [countdown, phase]);

  useEffect(() => {
    if (!data.ready || phase !== "breathe" || breathing.stage === "ready") return;
    const id = window.setTimeout(() => setBreathing((state) => advanceBreathing(state, pattern, data.settings.breathingGroups)), breathing.secondsRemaining === 0 ? 400 : 1000);
    return () => window.clearTimeout(id);
  }, [breathing, data.ready, data.settings.breathingGroups, pattern, phase]);

  useEffect(() => {
    if (phase !== "breathe" || breathing.stage !== "ready" || ritualRecorded.current || !ritualStartedAt.current) return;
    ritualRecorded.current = true;
    data.recordBreath({ id: crypto.randomUUID(), mode: "start", startedAt: ritualStartedAt.current, durationSeconds: patternDuration(pattern, data.settings.breathingGroups), groups: data.settings.breathingGroups });
    setPhase("ready");
  }, [breathing.stage, data, pattern, phase]);

  useEffect(() => {
    if (phase !== "starter" && phase !== "free") return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  if (!data.ready || !task || !starter) return <AppShell settings={data.settings}><section className="py-24 text-center">这次启动已经结束。<Link className="ml-2 underline" href="/">回到首页</Link></section></AppShell>;

  const beginRitual = () => { ritualStartedAt.current = new Date().toISOString(); ritualRecorded.current = false; setBreathing(initialBreathingState(pattern)); setCountdown(3); setPhase("ritual-countdown"); };
  const startRitual = () => { if (data.settings.breathingFrequency === "off") setPhase("ready"); else setPhase("ritual-intro"); };
  const startStarter = () => { data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: starter.title, startedAt: new Date().toISOString() }); setSeconds(0); setPhase("starter"); };
  const startFree = () => { data.recordStart({ id: crypto.randomUUID(), taskId: task.id, actionTitle: `继续：${task.title}`, startedAt: new Date().toISOString() }); setSeconds(0); setPhase("free"); };
  const finish = (starterSession: boolean) => { data.finishSession({ id: crypto.randomUUID(), taskId: task.id, taskTitle: starterSession ? starter.title : task.title, startedAt: new Date(Date.now() - seconds * 1000).toISOString(), finishedAt: new Date().toISOString(), durationSeconds: seconds, completed: true }); if (starterSession) { setStarterSeconds(seconds); setPhase("starter-complete"); } else setPhase("free-complete"); };
  const endToday = () => { data.updateTasks(data.tasks.map((item) => item.id === task.id ? { ...item, completed: true, completedAt: new Date().toISOString() } : item)); setPhase("summary"); };
  const clock = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const patternText = `吸气 ${pattern.inhale} 秒 · 吸后停顿 ${pattern.holdIn} 秒 · 呼气 ${pattern.exhale} 秒 · 呼后停顿 ${pattern.holdOut} 秒`;

  return <AppShell settings={data.settings} minimal><section className="mx-auto flex min-h-[calc(100vh-85px)] max-w-2xl flex-col justify-center py-12 text-center">
    {phase === "confirm" && <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">你的启动动作</p><ActionCard title={starter.title} description={starter.description} minutes={starter.estimatedMinutes} /><p className="mt-7 text-sm text-[#77776f]">先看清这一小段要做什么。现在还没有开始计时。</p><button onClick={startRitual} className="mx-auto mt-7 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white">准备好了</button></>}
    {phase === "ritual-intro" && <Ritual title="开始前，先呼吸一下" subtitle="调整坐姿，放松肩膀，准备开始。"><p className="mt-6 text-sm text-[#77776f]">{patternText}</p><button onClick={beginRitual} className="mt-10 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">开始呼吸</button></Ritual>}
    {phase === "ritual-countdown" && <Ritual title={countdown === 0 ? "开始" : "准备"} subtitle="把注意力带回此刻。"><p className="mt-9 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{countdown}</p></Ritual>}
    {phase === "breathe" && breathing.stage !== "ready" && <Ritual title={`启动仪式 · 第 ${breathing.group} / ${data.settings.breathingGroups} 组`} subtitle={patternText}><p className="mt-9 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{labels[breathing.stage]}<br />{breathing.secondsRemaining}</p><p className="mt-8 text-sm text-[#77776f]">接下来：{starter.title}</p></Ritual>}
    {phase === "ready" && <Ritual title="很好，现在开始第一步。" subtitle={starter.description}><button onClick={startStarter} className="mt-10 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white">开始行动</button></Ritual>}
    {phase === "starter" && <Focus title={starter.title} description={starter.description} clock={clock} finish={() => finish(true)} />}
    {phase === "free" && <Focus title={task.title} description="你已经进入状态了。按自己的节奏继续，不需要新的安排。" clock={clock} finish={() => finish(false)} />}
    {phase === "starter-complete" && <Completion heading="你已经开始了" duration={starterSeconds} onContinue={startFree} onEnd={endToday} />}
    {phase === "free-complete" && <Completion heading="又完成了一段" duration={seconds} onContinue={startFree} onEnd={endToday} />}
    {phase === "summary" && <><p className="text-4xl">🎉</p><h1 className="mt-5 font-display text-5xl tracking-[-.06em]">今天到这里</h1><p className="mt-6 text-lg text-[#6B6B63]">你已经完成了开始，也留下了一段真实的专注。</p><div className="mt-10 flex justify-center gap-3"><Link href="/" className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">返回首页</Link><Link href="/history" className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">成长档案</Link></div></>}
  </section></AppShell>;
}

function Ritual({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <div><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">启动仪式</p><h1 className="mt-6 font-display text-5xl tracking-[-.06em] sm:text-6xl">{title}</h1><p className="mx-auto mt-6 max-w-lg leading-relaxed text-[#6B6B63]">{subtitle}</p>{children}</div>; }
function ActionCard({ title, description, minutes }: { title: string; description: string; minutes: number }) { return <article className="mx-auto mt-8 max-w-xl rounded-[28px] bg-white p-8 text-left shadow-sm"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">眼前这一段</p><h2 className="mt-3 text-2xl font-semibold leading-tight">{title}</h2><p className="mt-4 leading-relaxed text-[#6B6B63]">{description}</p><p className="mt-5 text-sm text-[#77776f]">预计约 {minutes} 分钟</p></article>; }
function Focus({ title, description, clock, finish }: { title: string; description: string; clock: string; finish: () => void }) { return <><p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">正在专注</p><h1 className="mt-6 text-3xl font-semibold sm:text-5xl">{title}</h1><p className="mx-auto mt-5 max-w-lg text-[#77776f]">{description}</p><div className="mt-12 font-display text-[clamp(5rem,17vw,10rem)] leading-none tracking-[-.07em] tabular-nums">{clock}</div><button onClick={finish} className="mx-auto mt-12 rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">完成</button></>; }
function Completion({ heading, duration, onContinue, onEnd }: { heading: string; duration: number; onContinue: () => void; onEnd: () => void }) { const praise = duration < 60 ? "开始，比等待更重要。" : duration < 600 ? "节奏已经建立起来了。" : "这是一段扎实的专注。"; return <><p className="text-4xl">✓</p><h1 className="mt-5 font-display text-5xl tracking-[-.06em]">{heading}</h1><p className="mt-7 text-xl font-semibold">本次专注：{formatFocus(duration)}</p><p className="mt-3 text-lg text-[#6B6B63]">{praise}</p><div className="mt-10 flex justify-center gap-3"><button onClick={onContinue} className="rounded-full bg-ink px-7 py-4 text-sm font-semibold text-white">继续</button><button onClick={onEnd} className="rounded-full border border-[#d9d9d0] bg-white px-7 py-4 text-sm font-semibold">今天就到这里</button></div></>; }
