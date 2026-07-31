import { NextResponse } from "next/server";
import { createFeedbackSubmission, feedbackFingerprint, MemoryFeedbackStore, validateFeedback } from "@/lib/feedback";

export const runtime = "nodejs";
const feedbackStore = new MemoryFeedbackStore();

export async function POST(request: Request) {
  let claimedId: string | undefined;
  try {
    const body = await request.json() as Record<string, unknown>;
    const validation = validateFeedback(body);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    const submission = createFeedbackSubmission(validation.value);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FEEDBACK_FROM_EMAIL;
    const to = process.env.FEEDBACK_TO_EMAIL;
    if (!apiKey || !from || !to) return NextResponse.json({ error: "Feedback delivery is not configured" }, { status: 503 });
    if (!feedbackStore.claim(submission.id)) return NextResponse.json({ ok: true, duplicate: true });
    claimedId = submission.id;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: submission.contact || undefined, subject: `[FirstPilot] ${submission.type} feedback`, text: `Feedback ID: ${submission.id}\nFingerprint: ${feedbackFingerprint(submission)}\nSubmitted: ${submission.submittedAt}\n\nType: ${submission.type}\n\nMessage:\n${submission.message}\n\nAlmost quit:\n${submission.almostQuit || "(not provided)"}\n\nContact:\n${submission.contact || "(not provided)"}` }),
    });
    if (!response.ok) {
      feedbackStore.release(submission.id);
      claimedId = undefined;
      return NextResponse.json({ error: "Feedback delivery failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    if (claimedId) feedbackStore.release(claimedId);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
