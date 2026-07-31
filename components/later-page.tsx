"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";

function relativeDate(iso: string) { const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000); if (days <= 0) return "今天加入"; if (days === 1) return "昨天加入"; return `${days} 天前加入`; }

export function LaterPage() {
  const data = useStudyData(); const router = useRouter(); const [title, setTitle] = useState("");
  if (!data.ready) return null;
  const add = (event: FormEvent) => { event.preventDefault(); if (!title.trim()) return; data.addLaterStart(title); setTitle(""); };
  return <AppShell settings={data.settings}><section className="mx-auto max-w-2xl py-16 sm:py-24"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">把它放在这里，等你准备好开始</p><h1 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">稍后开始</h1><form onSubmit={add} className="mt-10 flex gap-2 rounded-[24px] bg-white p-3 shadow-card"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：第 52 章听力" className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none" /><button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">放进去</button></form><div className="mt-6 space-y-3">{data.laterStarts.length ? data.laterStarts.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-[#77776f]">{relativeDate(item.createdAt)}</p></div><div className="flex gap-2"><button onClick={() => router.push(`/?task=${encodeURIComponent(item.title)}`)} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">开始</button><button onClick={() => data.removeLaterStart(item.id)} aria-label={`移除 ${item.title}`} className="rounded-full border border-[#ddd] px-3 py-2 text-sm text-[#77776f]">移除</button></div></article>) : <div className="rounded-[25px] bg-white p-10 text-center text-[#77776f]">暂时没有要稍后开始的事情。<br />不用管理它们，只要在准备好时开始。</div>}</div></section></AppShell>;
}
