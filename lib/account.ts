export const SIGN_IN_NUDGE_THRESHOLD = 3;
export const SIGN_IN_NUDGE_DISMISS_KEY = "firstpilot.sign-in-nudge-dismissed-until";
export function completedSessionCount(history: unknown[]): number {
  return history
    .filter((session): session is { completed: boolean } => session !== null && typeof session === "object" && "completed" in session)
    .filter((session) => session.completed).length;
}
export function isSignInNudgeDismissed(value: string | null, now = Date.now()): boolean { return Number(value) > now; }
