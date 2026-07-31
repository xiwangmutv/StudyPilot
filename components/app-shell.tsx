"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { UserProfile } from "@/src/core";

export function AppShell({ children, settings, minimal = false }: { children: React.ReactNode; settings?: UserProfile; minimal?: boolean }) {
  useEffect(() => { document.documentElement.dataset.theme = settings?.theme ?? "light"; }, [settings?.theme]);
  const initials = (settings?.name || "学习者").slice(0, 2).toUpperCase();
  return <main className="paper-texture min-h-screen bg-paper px-5 py-5 text-ink transition-colors sm:px-8 lg:px-12"><div className="mx-auto max-w-[1240px]">
    <nav className="flex items-center justify-between gap-4"><Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-sm font-semibold text-white">F</span><span className="text-[17px] font-semibold tracking-[-.04em]">FirstPilot</span></Link>
      {minimal ? <Avatar settings={settings} initials={initials} size="large" /> : <div className="flex items-center gap-1 overflow-x-auto"><Nav href="/">首页</Nav><Nav href="/breathing">呼吸训练</Nav><Nav href="/later">稍后开始</Nav><Nav href="/history">成长档案</Nav><Nav href="/settings">设置</Nav><Link href="/settings" aria-label="修改头像" className="ml-1"><Avatar settings={settings} initials={initials} /></Link></div>}
    </nav>{children}
  </div></main>;
}

function Nav({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-[#696960] transition hover:bg-[#ecece6]">{children}</Link>; }
function Avatar({ settings, initials, size = "small" }: { settings?: UserProfile; initials: string; size?: "small" | "large" }) { const className = size === "large" ? "h-9 w-9" : "h-8 w-8"; return settings?.avatar ? <img src={settings.avatar} alt={`${settings.name}的头像`} className={`${className} rounded-full object-cover`} /> : <span className={`grid ${className} place-items-center rounded-full bg-lavender text-[10px] font-bold text-[#4F4875]`}>{initials}</span>; }
