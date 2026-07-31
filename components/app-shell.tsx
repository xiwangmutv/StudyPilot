"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type SVGProps } from "react";
import type { UserProfile } from "@/src/core";
import type { Messages } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { SignInControl } from "./sign-in-control";
import { SignInNudge } from "./sign-in-nudge";

export function AppShell({ children, settings, minimal = false }: { children: React.ReactNode; settings?: UserProfile; minimal?: boolean }) {
  const { locale, messages: t, setLocale } = useLanguage();
  useEffect(() => { document.documentElement.dataset.theme = settings?.theme ?? "light"; }, [settings?.theme]);
  const initials = (settings?.name || "FP").slice(0, 2).toUpperCase();

  return <main className="paper-texture min-h-screen bg-paper px-5 py-5 text-ink transition-colors sm:px-8 lg:px-12">
    <div className="mx-auto max-w-[1240px]">
      <nav className="flex items-center justify-between gap-3 border-b border-[#e8e8e1] pb-3 sm:gap-5 sm:pb-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-sm font-semibold text-white">F</span>
          <span className="text-[17px] font-semibold tracking-[-.04em]">FirstPilot</span>
        </Link>
        {minimal ? <Avatar settings={settings} initials={initials} size="large" /> : <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/" className="shrink-0 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#363631] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c8c82] sm:px-3.5 sm:py-2.5 sm:text-sm">
            {locale === "zh" ? "开始学习" : "Start learning"}
          </Link>
          <SignInControl />
          <LanguageSelector locale={locale} label={t.language} onChange={setLocale} />
          <NavigationMenu settings={settings} initials={initials} labels={t.nav} />
        </div>}
      </nav>
      {children}
      {!minimal && <SignInNudge />}
    </div>
  </main>;
}

function LanguageSelector({ locale, label, onChange }: { locale: "zh" | "en"; label: string; onChange: (locale: "zh" | "en") => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissMenu(menuRef, () => setOpen(false));

  const selectLocale = (nextLocale: "zh" | "en") => {
    onChange(nextLocale);
    setOpen(false);
  };

  return <div ref={menuRef} className="relative shrink-0">
    <button type="button" aria-label={label} title={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)} className="flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#5e5e56] transition hover:bg-[#ecece6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c8c82] sm:h-10">
      <GlobeIcon className="h-4 w-4" />
      <span>{locale === "zh" ? "中文" : "EN"}</span>
    </button>
    {open && <div role="menu" aria-label={label} className="absolute right-0 z-20 mt-2 w-36 rounded-2xl border border-[#e3e3dc] bg-white p-1.5 shadow-card">
      <LanguageOption active={locale === "en"} onClick={() => selectLocale("en")}>English</LanguageOption>
      <LanguageOption active={locale === "zh"} onClick={() => selectLocale("zh")}>简体中文</LanguageOption>
    </div>}
  </div>;
}

function NavigationMenu({ settings, initials, labels }: { settings?: UserProfile; initials: string; labels: Messages["nav"] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissMenu(menuRef, () => setOpen(false));
  const links = [
    { href: "/", label: labels.home },
    { href: "/breathing", label: labels.breathing },
    { href: "/later", label: labels.later },
    { href: "/history", label: labels.history },
    { href: "/feedback", label: labels.feedback },
    { href: "/settings", label: labels.settings },
  ];

  return <div ref={menuRef} className="relative shrink-0">
    <button type="button" aria-label="Navigation menu" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-lg text-[#4d4d46] transition hover:bg-[#ecece6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c8c82] sm:h-10 sm:w-10">
      <MenuIcon className="h-5 w-5" />
    </button>
    {open && <div role="menu" aria-label="Navigation" className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-[#e3e3dc] bg-white p-1.5 shadow-card">
      <div className="mb-1 border-b border-[#eeeeea] px-2.5 py-2">
        <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg">
          <Avatar settings={settings} initials={initials} />
          <span className="text-sm font-medium text-[#4d4d46]">{settings?.name || "FirstPilot"}</span>
        </Link>
      </div>
      {links.map((link) => <Link key={link.href} href={link.href} role="menuitem" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-[#4d4d46] transition hover:bg-[#f1f1ec] focus:outline-none focus-visible:bg-[#f1f1ec]">{link.label}</Link>)}
    </div>}
  </div>;
}

function useDismissMenu(menuRef: React.RefObject<HTMLDivElement | null>, dismiss: () => void) {
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) dismiss(); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [dismiss, menuRef]);
}

function LanguageOption({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" role="menuitemradio" aria-checked={active} onClick={onClick} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#4d4d46] transition hover:bg-[#f1f1ec] focus:outline-none focus-visible:bg-[#f1f1ec]">
    {children}
    <span aria-hidden="true" className={active ? "text-[#4f6331]" : "invisible"}>✓</span>
  </button>;
}

function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.1 2.25 3.2 5.08 3.2 8.5S14.1 18.25 12 20.5C9.9 18.25 8.8 15.42 8.8 12S9.9 5.75 12 3.5Z" strokeLinecap="round" /></svg>;
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" {...props}><path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" strokeLinecap="round" /></svg>;
}

function Avatar({ settings, initials, size = "small" }: { settings?: UserProfile; initials: string; size?: "small" | "large" }) {
  const className = size === "large" ? "h-9 w-9" : "h-8 w-8";
  return settings?.avatar
    ? <img src={settings.avatar} alt={`${settings.name} avatar`} className={`${className} rounded-full object-cover`} />
    : <span className={`grid ${className} place-items-center rounded-full bg-lavender text-[10px] font-bold text-[#4F4875]`}>{initials}</span>;
}
