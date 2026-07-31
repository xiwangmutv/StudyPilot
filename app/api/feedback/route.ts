import { NextResponse } from "next/server";
import { MemoryFeedbackStore, validateFeedback } from "@/lib/feedback";

export const runtime = "nodejs";
const feedbackStore = new MemoryFeedbackStore();

export async function POST(request: Request) {
  let claimedId: string | undefined;
  try {
    const body = await request.json() as Record<string, unknown>;
    const validation = validateFeedback(body);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    const formUrl = getGoogleFormUrl();
    if (!formUrl) return NextResponse.json({ error: "Feedback delivery is not configured" }, { status: 503 });
    if (!feedbackStore.claim(validation.value.id)) return NextResponse.json({ ok: true, duplicate: true, formUrl });
    claimedId = validation.value.id;

    // This API boundary intentionally remains in place. A future database or
    // delivery provider can save the validated submission here without a
    // frontend change.
    return NextResponse.json({ ok: true, formUrl });
  } catch {
    if (claimedId) feedbackStore.release(claimedId);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function getGoogleFormUrl() {
  const value = process.env.GOOGLE_FEEDBACK_FORM_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
