"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type ProviderStatus = "loading" | "available" | "unavailable";

export function SignInControl() {
  const { data: session, status } = useSession();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("loading");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/auth/status").then((response) => response.ok ? response.json() as Promise<{ googleEnabled: boolean }> : { googleEnabled: false }).then(({ googleEnabled }) => setProviderStatus(googleEnabled ? "available" : "unavailable")).catch(() => setProviderStatus("unavailable")); }, []);
  useEffect(() => { const openSignIn = () => setOpen(true); window.addEventListener("firstpilot:open-sign-in", openSignIn); return () => window.removeEventListener("firstpilot:open-sign-in", openSignIn); }, []);
  useEffect(() => { const close = (event: MouseEvent) => { if (!panelRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);

  if (status === "authenticated") {
    const name = session.user?.name || session.user?.email || "Account";
    return <div className="relative" ref={panelRef}><button type="button" onClick={() => setOpen((value) => !value)} className="flex h-9 items-center gap-2 rounded-xl px-2 text-xs font-semibold text-[#4d4d46] transition hover:bg-[#ecece6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c8c82] sm:h-10 sm:px-2.5" aria-expanded={open} aria-haspopup="menu">{session.user?.image ? <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" /> : <span className="grid h-6 w-6 place-items-center rounded-full bg-lavender text-[10px]">{name.slice(0, 1).toUpperCase()}</span>}<span className="hidden max-w-24 truncate sm:block">{name}</span></button>{open && <div role="menu" className="absolute right-0 z-30 mt-2 w-52 rounded-2xl border border-[#e3e3dc] bg-white p-2 shadow-card"><p className="px-2.5 py-2 text-xs text-[#77776f]">Signed in as<br /><span className="text-sm font-medium text-[#4d4d46]">{name}</span></p><button type="button" role="menuitem" onClick={() => void signOut()} className="w-full rounded-xl px-2.5 py-2 text-left text-sm text-[#4d4d46] transition hover:bg-[#f1f1ec]">Sign out</button></div>}</div>;
  }

  return <div className="relative" ref={panelRef}><button type="button" onClick={() => setOpen((value) => !value)} className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-[#4d4d46] transition hover:bg-[#ecece6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c8c82] sm:block sm:px-3.5 sm:py-2.5 sm:text-sm">Sign in</button>{open && <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-[#e3e3dc] bg-white p-5 shadow-card"><p className="text-sm font-semibold text-ink">Save your progress</p><p className="mt-2 text-sm leading-relaxed text-[#77776f]">Sign in to keep your FirstPilot progress available across devices.</p>{providerStatus === "available" ? <button type="button" onClick={() => void signIn("google")} className="mt-4 flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">Continue with Google</button> : <p className="mt-4 rounded-xl bg-[#f6f6f2] px-3 py-2 text-xs leading-relaxed text-[#77776f]">Google sign-in will be available here once this deployment is connected to its Google app.</p>}</div>}</div>;
}
