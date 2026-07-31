import { NextRequest, NextResponse } from "next/server";
import { fallbackStarterAction, starterActionSchema, validateStarterAction } from "@/lib/action-decomposition";
import { STARTER_ACTION_PROMPT } from "@/prompts/starter-action";

export const runtime = "nodejs";

type RequestBody = { task?: unknown; preferredMinutes?: unknown };

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }
  const task = typeof body.task === "string" ? body.task.trim().slice(0, 300) : "";
  const preferredMinutes = Math.min(7, Math.max(3, Number(body.preferredMinutes) || 5));
  if (!task) return NextResponse.json({ error: "请先输入你现在准备做什么。" }, { status: 400 });

  const fallback = fallbackStarterAction(task, preferredMinutes);
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "deepseek-chat";

  if (!apiKey) {
    return NextResponse.json({ ...fallback, source: "fallback", warning: "尚未配置 AI 密钥，已使用本地启动动作。" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: STARTER_ACTION_PROMPT },
          { role: "user", content: JSON.stringify({ task, preferredMinutes, schema: starterActionSchema() }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI returned ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    const result = validateStarterAction(content ? JSON.parse(content) : null, task);
    if (!result) throw new Error("Invalid AI response");
    return NextResponse.json({ ...result, source: "ai" });
  } catch {
    return NextResponse.json({ ...fallback, source: "fallback", warning: "AI 暂时不可用，已为你准备本地启动动作。" });
  } finally {
    clearTimeout(timeout);
  }
}
