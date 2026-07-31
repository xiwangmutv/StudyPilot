import { createHash } from "node:crypto";

export const feedbackTypes = ["bug", "feature", "general"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

export type FeedbackSubmission = {
  id: string;
  type: FeedbackType;
  message: string;
  almostQuit: string;
  contact: string;
  submittedAt: string;
};

type FeedbackInput = Omit<FeedbackSubmission, "submittedAt">;
type ValidationResult = { ok: true; value: FeedbackInput } | { ok: false; error: string };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFeedback(input: Record<string, unknown>): ValidationResult {
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const type = typeof input.type === "string" ? input.type : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const almostQuit = typeof input.almostQuit === "string" ? input.almostQuit.trim() : "";
  const contact = typeof input.contact === "string" ? input.contact.trim() : "";

  if (!id || id.length > 100) return { ok: false, error: "Invalid submission." };
  if (!feedbackTypes.includes(type as FeedbackType)) return { ok: false, error: "Invalid feedback type." };
  if (!message || message.length > 5_000) return { ok: false, error: "Feedback must be between 1 and 5000 characters." };
  if (almostQuit.length > 3_000) return { ok: false, error: "Additional feedback is too long." };
  if (contact.length > 254 || (contact && !emailPattern.test(contact))) return { ok: false, error: "Enter a valid email address or leave it empty." };
  return { ok: true, value: { id, type: type as FeedbackType, message, almostQuit, contact } };
}

/** A replaceable boundary for a future durable database-backed store. */
export interface FeedbackStore { claim(id: string): boolean; release(id: string): void; }

export class MemoryFeedbackStore implements FeedbackStore {
  private readonly submissions = new Map<string, number>();
  private readonly ttlMs: number;

  constructor(ttlMs = 10 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  claim(id: string, now = Date.now()): boolean {
    for (const [key, expiresAt] of this.submissions) if (expiresAt <= now) this.submissions.delete(key);
    if (this.submissions.has(id)) return false;
    this.submissions.set(id, now + this.ttlMs);
    return true;
  }

  release(id: string) { this.submissions.delete(id); }
}

export function createFeedbackSubmission(input: FeedbackInput, now = new Date()): FeedbackSubmission {
  return { ...input, submittedAt: now.toISOString() };
}

export function feedbackFingerprint(submission: FeedbackSubmission) {
  return createHash("sha256").update(`${submission.type}\n${submission.message}\n${submission.almostQuit}\n${submission.contact}`).digest("hex");
}
