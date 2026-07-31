import { NextResponse } from "next/server";

const feedbackTypes = new Set(["bug", "feature", "general"]);
const emailPattern = /^\S+@\S+\.\S+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const type = typeof body.type === "string" ? body.type : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const almostQuit = typeof body.almostQuit === "string" ? body.almostQuit.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    if (!feedbackTypes.has(type) || !message || message.length > 5000 || almostQuit.length > 3000 || contact.length > 254 || (contact && !emailPattern.test(contact))) return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FEEDBACK_FROM_EMAIL;
    const to = process.env.FEEDBACK_TO_EMAIL;
    if (!apiKey || !from || !to) return NextResponse.json({ error: "Feedback delivery is not configured" }, { status: 503 });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: contact || undefined, subject: `[FirstPilot] ${type} feedback`, text: `Type: ${type}\n\nMessage:\n${message}\n\nAlmost quit:\n${almostQuit || "(not provided)"}\n\nContact:\n${contact || "(not provided)"}` }),
    });
    if (!response.ok) return NextResponse.json({ error: "Feedback delivery failed" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
}
