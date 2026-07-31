"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { studyPilotCore, type BreathingFrequency, type ContinueMode } from "@/src/core";

export function SettingsPage() {
  const data = useStudyData(); const router = useRouter(); const inputRef = useRef<HTMLInputElement>(null); const [notice, setNotice] = useState("");
  if (!data.ready) return null;
  const update = (changes: Partial<typeof data.settings>) => data.updateSettings({ ...data.settings, ...changes });
  const uploadAvatar = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => update({ avatar: String(reader.result) }); reader.readAsDataURL(file); };
  const clearAll = () => { if (!window.confirm("确定要清除全部本地数据吗？此操作无法撤销。")) return; studyPilotCore.clearAll(); router.push("/"); router.refresh(); };
  return <AppShell settings={data.settings}><section className="mx-auto max-w-2xl pt-16 sm:pt-24"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73] uppercase">个人偏好</p><h1 className="mt-4 font-display text-6xl tracking-[-.06em]">设置</h1><div className="mt-12 space-y-4">
    <Card title="头像"><div className="flex items-center gap-4">{data.settings.avatar ? <img src={data.settings.avatar} alt="头像" className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-lavender font-semibold">{data.settings.name.slice(0, 2)}</span>}<button onClick={() => inputRef.current?.click()} className="rounded-full border border-[#d9d9d0] px-4 py-2 text-sm">更换头像</button><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadAvatar(event.target.files?.[0])} /></div></Card>
    <Card title="你的名字"><input value={data.settings.name} onChange={(event) => update({ name: event.target.value })} className="mt-3 w-full rounded-xl bg-[#f4f4ef] px-4 py-3 outline-none" /></Card>
    <Card title="启动单元预计时间"><Choice values={[3, 5, 8] as const} current={data.settings.starterMinutes} onChange={(starterMinutes) => update({ starterMinutes })} suffix="分钟" /></Card>
    <Card title="开始前的呼吸"><Choice values={["off", "first", "every"] as const} labels={{ off: "关闭", first: "仅第一次开始", every: "每次开始" }} current={data.settings.breathingFrequency} onChange={(breathingFrequency) => update({ breathingFrequency: breathingFrequency as BreathingFrequency })} /><p className="mt-5 text-sm font-semibold">呼吸组数</p><Choice values={[1, 2, 3] as const} current={data.settings.breathingGroups} onChange={(breathingGroups) => update({ breathingGroups })} suffix="组" /></Card>
    <Card title="继续学习模式"><Choice values={["free", "guided"] as const} labels={{ free: "自由学习（默认）", guided: "AI 继续指导" }} current={data.settings.continueMode} onChange={(continueMode) => update({ continueMode: continueMode as ContinueMode })} /><p className="mt-3 text-xs leading-relaxed text-[#77776f]">自由学习会在启动后把控制权还给你；AI 继续指导为后续版本预留。</p></Card>
    <Card title="主题"><Choice values={["light", "dark"] as const} labels={{ light: "浅色", dark: "深色" }} current={data.settings.theme} onChange={(theme) => update({ theme })} /></Card>
    <button onClick={() => setNotice("设置已自动保存")} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">保存设置</button>{notice && <span className="ml-3 text-sm text-[#657149]">{notice}</span>}
    <article className="rounded-[25px] border border-[#f0d8d4] bg-[#fff8f6] p-6"><p className="font-semibold">清除所有本地数据</p><p className="mt-1 text-sm text-[#806d69]">任务、学习记录、成长档案和设置将被永久移除。</p><button onClick={clearAll} className="mt-4 rounded-full border border-[#dca89e] px-4 py-2 text-sm text-[#9b4334]">清除数据</button></article>
  </div></section></AppShell>;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-[25px] bg-white p-6 shadow-card"><p className="text-sm font-semibold">{title}</p>{children}</article>; }
function Choice<T extends string | number>({ values, current, onChange, labels, suffix = "" }: { values: readonly T[]; current: T; onChange: (value: T) => void; labels?: Record<string, string>; suffix?: string }) { return <div className="mt-3 flex flex-wrap gap-2">{values.map((value) => <button key={value} onClick={() => onChange(value)} className={`rounded-full px-4 py-2 text-sm ${current === value ? "bg-ink text-white" : "bg-[#f0f0eb]"}`}>{labels?.[String(value)] ?? `${value}${suffix}`}</button>)}</div>; }
