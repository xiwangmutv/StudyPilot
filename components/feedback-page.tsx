"use client";

import { useState, type FormEvent } from "react";
import { AppShell } from "./app-shell";
import { useLanguage } from "./language-provider";
import { useStudyData } from "@/hooks/use-study-data";

type FeedbackType = "bug" | "feature" | "general";
export function FeedbackPage() {
  const data = useStudyData();
  const { messages: t } = useLanguage();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [almostQuit, setAlmostQuit] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  if (!data.ready) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (status === "sending") return;
    if (!message.trim()) { setStatus("error"); return; }
    if (contact.trim() && !/^\S+@\S+\.\S+$/.test(contact.trim())) { setStatus("error"); return; }
    setStatus("sending");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, message: message.trim(), almostQuit: almostQuit.trim(), contact: contact.trim() }) });
      if (!response.ok) throw new Error("Feedback request failed");
      setMessage(""); setAlmostQuit(""); setContact(""); setStatus("success");
    } catch { setStatus("error"); }
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
      {status === "success" && <p role="status" className="mt-4 text-sm text-[#657149]">{t.feedback.sent}</p>}
      {status === "error" && <p role="alert" className="mt-4 text-sm text-[#a74d3d]">{!message.trim() ? t.feedback.required : contact.trim() && !/^\S+@\S+\.\S+$/.test(contact.trim()) ? t.feedback.invalidContact : t.feedback.failed}</p>}
      <button type="submit" disabled={status === "sending"} className="mt-7 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{status === "sending" ? t.feedback.sending : t.feedback.submit}</button>
    </form>
  </section></AppShell>;
}
