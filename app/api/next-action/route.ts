import { NextRequest, NextResponse } from "next/server";
import { fallbackStateTransition, validateStateTransition } from "@/lib/state-transition";
import { STARTER_ACTION_PROMPT } from "@/prompts/starter-action";

export const runtime = "nodejs";

type RequestBody = { task?: unknown; blocker?: unknown; completedSteps?: unknown; actionHistory?: unknown; preferredMinutes?: unknown };

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try { body = await request.json() as RequestBody; }
  catch { return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 }); }

  const task = typeof body.task === "string" ? body.task.trim().slice(0, 300) : "";
  const blocker = typeof body.blocker === "string" ? body.blocker.trim().slice(0, 500) : "";
  const completedSteps = Array.isArray(body.completedSteps) ? body.completedSteps.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 120)).filter(Boolean).slice(-5) : [];
  const actionHistory = Array.isArray(body.actionHistory) ? body.actionHistory
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({ instruction: typeof item.instruction === "string" ? item.instruction.trim().slice(0, 120) : "", status: item.status }))
    .filter((item): item is { instruction: string; status: "pending" | "completed" | "skipped" | "ineffective" } => Boolean(item.instruction) && ["pending", "completed", "skipped", "ineffective"].includes(String(item.status)))
    .slice(-12) : [];
  const preferredMinutes = Math.min(7, Math.max(3, Number(body.preferredMinutes) || 5));
  if (!task || !blocker) return NextResponse.json({ error: "请告诉我想开始什么，以及现在卡在哪。" }, { status: 400 });

  const input = { taskTitle: task, blocker, completedSteps, preferredMinutes };
  const fallback = fallbackStateTransition(input);
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "deepseek-chat";
  if (!apiKey) return NextResponse.json({ ...fallback, source: "fallback", warning: "尚未配置 AI，已使用本地引导。" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: "json_object" }, messages: [
        { role: "system", content: STARTER_ACTION_PROMPT },
        { role: "user", content: JSON.stringify({ desiredActivity: task, currentSituation: blocker, completedSteps, actionHistory, preferredMinutes }) },
      ] }),
    });
    if (!response.ok) throw new Error(`AI returned ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    const knownContext = [task, blocker, ...completedSteps].join(" ");
    const result = validateStateTransition(content ? JSON.parse(content) : null, task, preferredMinutes, knownContext, actionHistory);
    if (!result) throw new Error("Invalid AI response");
    return NextResponse.json({ ...result, source: "ai" });
  } catch (error) {
    console.error("[next-action] AI request failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ...fallback, source: "fallback", warning: "AI 暂时不可用，已使用本地引导。" });
  } finally { clearTimeout(timeout); }
}
