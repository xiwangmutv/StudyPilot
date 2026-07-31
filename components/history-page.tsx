"use client";

import { useMemo, useState } from "react";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { calculateArchive, dayKey, formatFocus } from "@/lib/archive-analytics";

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="rounded-[22px] bg-white p-5 shadow-card"><p className="text-xs font-semibold tracking-[.1em] text-[#7B7B73]">{label}</p><p className="mt-3 font-display text-3xl tracking-[-.05em]">{value}</p></article>;
}

export function HistoryPage() {
  const data = useStudyData();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const archive = useMemo(() => calculateArchive(data.history, data.starts, data.breaths), [data.history, data.starts, data.breaths]);
  if (!data.ready) return null;

  const dayMap = new Map(archive.daily.map((entry) => [entry.day, entry]));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = (month.getDay() + 6) % 7;
  const monthRecords = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, key, record: dayMap.get(key) };
  });
  const monthActions = monthRecords.reduce((sum, item) => sum + (item.record?.actions ?? 0), 0);
  const todayKey = dayKey(new Date());
  const today = dayMap.get(todayKey);
  const todaySessions = data.history.filter((session) => dayKey(session.finishedAt) === todayKey && session.completed);
  const changeMonth = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return <AppShell settings={data.settings}><section className="py-16 sm:py-24">
    <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7B7B73]">回看每一次开始</p>
    <h1 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">成长档案</h1>
    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#6B6B63]">{archive.encouragement}</p>

    <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Metric label="行动次数" value={archive.actionCount} />
      <Metric label="启动次数" value={archive.starts} />
      <Metric label="完成动作" value={archive.completedActions} />
      <Metric label="累计专注" value={formatFocus(archive.totalFocusSeconds)} />
      <Metric label="呼吸训练" value={`${archive.breathCount} 次`} />
    </div>

    <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
      <article className="rounded-[28px] bg-white p-6 shadow-card">
        <div className="flex items-center justify-between"><button aria-label="上个月" onClick={() => changeMonth(-1)} className="rounded-full px-3 py-1 text-lg hover:bg-[#efefe9]">←</button><div className="text-center"><p className="text-sm font-semibold">本月行动痕迹</p><p className="mt-1 text-xs text-[#77776f]">{month.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })} · {monthActions} 次行动</p></div><button aria-label="下个月" onClick={() => changeMonth(1)} className="rounded-full px-3 py-1 text-lg hover:bg-[#efefe9]">→</button></div>
        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[10px] text-[#8b8b83]"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
        <div className="mt-2 grid grid-cols-7 gap-2">{Array.from({ length: leading }).map((_, index) => <span key={`empty-${index}`} />)}{monthRecords.map(({ day, key, record }) => { const level = !record ? "bg-[#edede8]" : record.actions >= 3 ? "bg-[#4f6331]" : record.actions >= 2 ? "bg-[#9db66e]" : "bg-[#d7e4b8]"; return <span key={key} title={`${key}${record ? ` · ${record.actions} 次行动` : ""}`} className="flex aspect-square items-center justify-center rounded-md text-[10px] text-[#717169]"><i className={`mr-0.5 h-2 w-2 rounded-full ${level}`} />{day}</span>; })}</div>
        <p className="mt-5 text-sm text-[#77776f]">这个月，你已经让 {monthActions} 件事情真正开始了。</p>
      </article>
      <article className="rounded-[28px] bg-white p-6 shadow-card"><p className="text-sm font-semibold">今天</p><div className="mt-6 grid gap-3"><div><p className="text-xs text-[#77776f]">今日启动</p><p className="mt-1 font-display text-3xl">{today?.starts ?? 0} 次</p></div><div><p className="text-xs text-[#77776f]">今日完成</p><p className="mt-1 font-display text-3xl">{today?.actions ?? 0} 个动作</p></div><div><p className="text-xs text-[#77776f]">今日专注</p><p className="mt-1 font-display text-3xl">{formatFocus(today?.focusSeconds ?? 0)}</p></div><div><p className="text-xs text-[#77776f]">今日呼吸</p><p className="mt-1 font-display text-3xl">{today?.breaths ?? 0} 次</p><p className="mt-1 text-xs text-[#77776f]">{formatFocus(today?.breathSeconds ?? 0)}</p></div></div><div className="mt-7 border-t border-[#eeeeea] pt-5"><p className="text-xs font-semibold tracking-[.1em] text-[#7B7B73]">今天的行动</p>{todaySessions.length ? <div className="mt-3 space-y-3">{todaySessions.slice(0, 3).map((session) => <div key={session.id}><p className="truncate text-sm font-medium">{session.taskTitle}</p><p className="mt-1 text-xs text-[#77776f]">专注 {formatFocus(session.durationSeconds)}</p></div>)}</div> : <p className="mt-3 text-sm leading-relaxed text-[#77776f]">今天还没有行动记录。<br />不用完成很多，先让一件事情开始。</p>}</div></article>
    </div>

    <section className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7B7B73]">完整行动记录</p><div className="mt-5 space-y-3">{archive.daily.length ? archive.daily.map((record) => <article key={record.day} className="flex flex-col gap-2 rounded-[22px] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"><h2 className="font-semibold">{new Date(`${record.day}T00:00:00`).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</h2><p className="text-sm text-[#77776f]">行动 {record.actions} 次 · 专注 {formatFocus(record.focusSeconds)} · 呼吸 {record.breaths} 次</p></article>) : <div className="rounded-[25px] bg-white p-10 text-center text-[#77776f]">还没有行动记录。完成一次启动后，它会被保存在这里。</div>}</div></section>
  </section></AppShell>;
}
