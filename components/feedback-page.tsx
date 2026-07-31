"use client";

import { useState, type FormEvent } from "react";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";

type FeedbackType = "bug" | "feature" | "general";
type LocalFeedback = { type: FeedbackType; message: string; almostQuit: string; contact: string; createdAt: string };

export function FeedbackPage() {
  const data = useStudyData();
  const { messages: t } = useLanguage();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [almostQuit, setAlmostQuit] = useState("");
  const [contact, setContact] = useState("");
  const [notice, setNotice] = useState("");
  if (!data.ready) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) { setNotice(t.feedback.required); return; }
    const entry: LocalFeedback = { type, message: message.trim(), almostQuit: almostQuit.trim(), contact: contact.trim(), createdAt: new Date().toISOString() };
    const existing = JSON.parse(window.localStorage.getItem("firstpilot-feedback") ?? "[]") as LocalFeedback[];
    window.localStorage.setItem("firstpilot-feedback", JSON.stringify([...existing, entry]));
    setMessage(""); setAlmostQuit(""); setContact(""); setNotice(t.feedback.saved);
  }

  return <AppShell settings={data.settings}><section className="mx-auto max-w-2xl py-12 sm:py-20">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#7B7B73]">{t.feedback.eyebrow}</p>
    <h1 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">{t.feedback.title}</h1>
    <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#6B6B63]">{t.feedback.description}</p>
    <form onSubmit={submit} className="mt-10 rounded-[28px] border border-[#e1e1d9] bg-white p-6 shadow-sm sm:p-8">
      <fieldset><legend className="text-sm font-semibold">{t.feedback.typeLabel}</legend><div className="mt-3 flex flex-wrap gap-2">{(["bug", "feature", "general"] as const).map((item) => <button type="button" key={item} onClick={() => setType(item)} className={`rounded-full px-4 py-2 text-sm ${type === item ? "bg-ink text-white" : "bg-[#f0f0eb] text-[#55554e]"}`}>{t.feedback[item]}</button>)}</div></fieldset>
      <label className="mt-7 block text-sm font-semibold" htmlFor="feedback-message">{t.feedback.messageLabel}</label>
      <textarea id="feedback-message" required value={message} onChange={(event) => setMessage(event.target.value)} rows={5} placeholder={t.feedback.messagePlaceholder} className="mt-3 w-full resize-none rounded-2xl border border-[#deded6] bg-[#fafaf7] p-4 leading-relaxed outline-none placeholder:text-[#aaa9a0] focus:border-[#bdbdb4]" />
      <label className="mt-7 block text-sm font-semibold" htmlFor="almost-quit">{t.feedback.quitLabel}</label>
      <textarea id="almost-quit" value={almostQuit} onChange={(event) => setAlmostQuit(event.target.value)} rows={4} placeholder={t.feedback.quitPlaceholder} className="mt-3 w-full resize-none rounded-2xl border border-[#deded6] bg-[#fafaf7] p-4 leading-relaxed outline-none placeholder:text-[#aaa9a0] focus:border-[#bdbdb4]" />
      <label className="mt-7 block text-sm font-semibold" htmlFor="contact">{t.feedback.contactLabel}</label>
      <input id="contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder={t.feedback.contactPlaceholder} className="mt-3 w-full rounded-2xl border border-[#deded6] bg-[#fafaf7] p-4 outline-none placeholder:text-[#aaa9a0] focus:border-[#bdbdb4]" />
      <p className="mt-4 text-xs leading-relaxed text-[#77776f]">{t.feedback.note}</p>
      {notice && <p role="status" className="mt-4 text-sm text-[#657149]">{notice}</p>}
      <button type="submit" className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">{t.feedback.submit}</button>
    </form>
  </section></AppShell>;
}
