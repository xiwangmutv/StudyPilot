"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";
export function LaterPage() {
  const data = useStudyData(); const router = useRouter(); const { messages: t } = useLanguage(); const [title, setTitle] = useState("");
  if (!data.ready) return null;
  const relativeDate = (iso: string) => { const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000); return days <= 0 ? t.later.today : days === 1 ? t.later.yesterday : t.later.daysAgo.replace("{days}", String(days)); };
  const add = (event: FormEvent) => { event.preventDefault(); if (!title.trim()) return; data.addLaterStart(title); setTitle(""); };
  return <AppShell settings={data.settings}><section className="mx-auto max-w-2xl py-16 sm:py-24"><p className="text-xs font-semibold tracking-[.14em] text-[#7B7B73]">{t.later.eyebrow}</p><h1 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">{t.later.title}</h1><form onSubmit={add} className="mt-10 flex gap-2 rounded-[24px] bg-white p-3 shadow-card"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.later.placeholder} className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none" /><button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">{t.later.add}</button></form><div className="mt-6 space-y-3">{data.laterStarts.length ? data.laterStarts.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-[#77776f]">{relativeDate(item.createdAt)}</p></div><div className="flex gap-2"><button onClick={() => router.push(`/?task=${encodeURIComponent(item.title)}`)} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">{t.later.start}</button><button onClick={() => data.removeLaterStart(item.id)} aria-label={t.later.removeLabel.replace("{title}", item.title)} className="rounded-full border border-[#ddd] px-3 py-2 text-sm text-[#77776f]">{t.later.remove}</button></div></article>) : <div className="whitespace-pre-line rounded-[25px] bg-white p-10 text-center text-[#77776f]">{t.later.empty}</div>}</div></section></AppShell>;
}
