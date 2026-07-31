"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { completedSessionCount, isSignInNudgeDismissed, SIGN_IN_NUDGE_DISMISS_KEY, SIGN_IN_NUDGE_THRESHOLD } from "@/lib/account";

export function SignInNudge() {
  const { status } = useSession();
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (status !== "unauthenticated") return; const history = JSON.parse(window.localStorage.getItem("studypilot.history") ?? "[]") as unknown[]; setVisible(completedSessionCount(history) >= SIGN_IN_NUDGE_THRESHOLD && !isSignInNudgeDismissed(window.localStorage.getItem(SIGN_IN_NUDGE_DISMISS_KEY))); }, [status]);
  function dismiss() { window.localStorage.setItem(SIGN_IN_NUDGE_DISMISS_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); setVisible(false); }
  if (!visible) return null;
  return <aside aria-label="Save your progress" className="fixed inset-x-5 bottom-5 z-40 mx-auto max-w-md rounded-[22px] border border-[#e3e3dc] bg-white p-5 shadow-card sm:left-auto sm:right-7 sm:mx-0"><button type="button" onClick={dismiss} aria-label="Dismiss" className="absolute right-4 top-3 text-lg text-[#77776f] hover:text-ink">×</button><p className="pr-6 text-sm font-semibold">You&apos;ve completed a few sessions.</p><p className="mt-1 text-sm leading-relaxed text-[#77776f]">Sign in to save your progress across devices when cloud sync arrives.</p><button type="button" onClick={() => { dismiss(); window.dispatchEvent(new Event("firstpilot:open-sign-in")); }} className="mt-3 text-sm font-semibold text-[#4f6331] underline underline-offset-4">Save my progress</button></aside>;
}
