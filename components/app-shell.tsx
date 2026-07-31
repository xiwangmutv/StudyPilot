"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/src/core";
import { useLanguage } from "./language-provider";

export function AppShell({ children, settings, minimal = false }: { children: React.ReactNode; settings?: UserProfile; minimal?: boolean }) {
  const { locale, messages: t, setLocale } = useLanguage();
  useEffect(() => { document.documentElement.dataset.theme = settings?.theme ?? "light"; }, [settings?.theme]);

  const initials = (settings?.name || "FP").slice(0, 2).toUpperCase();

  return <main className="paper-texture min-h-screen bg-paper px-5 py-5 text-ink transition-colors sm:px-8 lg:px-12">
    <div className="mx-auto max-w-[1240px]">
      <nav className="flex items-center justify-between gap-3 sm:gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-sm font-semibold text-white">F</span>
          <span className="text-[17px] font-semibold tracking-[-.04em]">FirstPilot</span>
        </Link>
        {minimal ? <Avatar settings={settings} initials={initials} size="large" /> : <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          <Nav href="/">{t.nav.home}</Nav>
          <Nav href="/breathing">{t.nav.breathing}</Nav>
          <Nav href="/later">{t.nav.later}</Nav>
          <Nav href="/history">{t.nav.history}</Nav>
          <Nav href="/feedback">{t.nav.feedback}</Nav>
          <Nav href="/settings">{t.nav.settings}</Nav>
          <LanguageSelector locale={locale} label={t.language} onChange={setLocale} />
          <Link href="/settings" aria-label={t.nav.settings} className="ml-0.5 shrink-0"><Avatar settings={settings} initials={initials} /></Link>
        </div>}
      </nav>
      {children}
    </div>
  </main>;
}

function LanguageSelector({ locale, label, onChange }: { locale: "zh" | "en"; label: string; onChange: (locale: "zh" | "en") => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const selectLocale = (nextLocale: "zh" | "en") => {
    onChange(nextLocale);
    setOpen(false);
  };

  return <div ref={menuRef} className="relative ml-0.5 shrink-0">
    <button type="button" aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)} className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-[#696960] transition hover:bg-[#ecece6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c8c82]">
      <span aria-hidden="true">🌐</span>
      <span>{locale === "zh" ? "中文" : "EN"}</span>
      <span aria-hidden="true" className="text-[9px]">⌄</span>
    </button>
    {open && <div role="menu" aria-label={label} className="absolute right-0 z-20 mt-2 w-36 rounded-2xl border border-[#e3e3dc] bg-white p-1.5 shadow-card">
      <LanguageOption active={locale === "en"} onClick={() => selectLocale("en")}>English</LanguageOption>
      <LanguageOption active={locale === "zh"} onClick={() => selectLocale("zh")}>简体中文</LanguageOption>
    </div>}
  </div>;
}

function LanguageOption({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" role="menuitemradio" aria-checked={active} onClick={onClick} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#4d4d46] transition hover:bg-[#f1f1ec] focus:outline-none focus-visible:bg-[#f1f1ec]">
    {children}
    <span aria-hidden="true" className={active ? "text-[#4f6331]" : "invisible"}>✓</span>
  </button>;
}

function Nav({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm text-[#696960] transition hover:bg-[#ecece6] sm:px-3">{children}</Link>;
}

function Avatar({ settings, initials, size = "small" }: { settings?: UserProfile; initials: string; size?: "small" | "large" }) {
  const className = size === "large" ? "h-9 w-9" : "h-8 w-8";
  return settings?.avatar
    ? <img src={settings.avatar} alt={`${settings.name} avatar`} className={`${className} rounded-full object-cover`} />
    : <span className={`grid ${className} place-items-center rounded-full bg-lavender text-[10px] font-bold text-[#4F4875]`}>{initials}</span>;
}
