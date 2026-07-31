import { NextResponse } from "next/server";
import { MemoryFeedbackStore, validateFeedback } from "@/lib/feedback";
import { createGoogleFormPayload, getGoogleFormResponseUrl } from "@/lib/google-feedback";

export const runtime = "nodejs";
const feedbackStore = new MemoryFeedbackStore();

export async function POST(request: Request) {
  let claimedId: string | undefined;
  try {
    const body = await request.json() as Record<string, unknown>;
    const validation = validateFeedback(body);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    const configuredFormUrl = process.env.GOOGLE_FEEDBACK_FORM_URL?.trim();
    if (!configuredFormUrl) return NextResponse.json({ error: "Feedback delivery is not configured" }, { status: 503 });
    let formResponseUrl: string;
    try {
      formResponseUrl = getGoogleFormResponseUrl(configuredFormUrl);
    } catch {
      return NextResponse.json({ error: "Feedback delivery is not configured" }, { status: 503 });
    }
    if (!feedbackStore.claim(validation.value.id)) return NextResponse.json({ ok: true, duplicate: true });
    claimedId = validation.value.id;

    const response = await fetch(formResponseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createGoogleFormPayload(validation.value),
      redirect: "manual",
    });
    if (!response.ok && (response.status < 300 || response.status >= 400)) {
      feedbackStore.release(validation.value.id);
      claimedId = undefined;
      return NextResponse.json({ error: "Feedback delivery failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    if (claimedId) feedbackStore.release(claimedId);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
