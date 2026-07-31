# FirstPilot

## Your AI Action Guide

不是你不够努力，你只是卡在了开始。

FirstPilot 是一个轻量的 AI 行动引导工具：用户说出想做的事与当前状态，FirstPilot 识别最大的阻碍，一次只给一个下一步，帮助用户从“想开始”走到“已经开始”。

### No Assumptions

FirstPilot 只使用用户明确提供的信息；未知细节会采用通用引导，或在确有必要时只问一个最小问题。它不会凭空假设你的教材、工具、课程、食材、环境或资源。

它不是 Todo、学习计划器或聊天机器人。它解决的是开始前的两分钟。

## 核心流程

```text
想开始什么？ → 现在卡在哪？ → 一个下一步 → 重新判断 → 开始行动 → 专注
```

## 功能

- AI Action Loop：识别身体、情绪、环境、认知或完美主义造成的阻碍
- 一次只给一个可执行动作
- 可选四阶段呼吸训练，用于状态切换
- 专注计时、稍后开始、成长档案与本地数据保存
- OpenAI-compatible API 配置，默认示例为 DeepSeek

## AI 配置

复制 `.env.example` 为 `.env.local`，填入自己的 API Key：

```env
AI_PROVIDER=deepseek
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=your_key_here
AI_MODEL=deepseek-chat
```

不要提交 `.env.local`，也不要把密钥放入浏览器端代码。

## 运行

```powershell
npm.cmd run dev
npm.cmd run test
npm.cmd run build
```

## Feedback delivery (Resend)

The feedback form sends mail through `POST /api/feedback`. Credentials never
reach the browser. Repeated submits and retries share a submission ID and are
accepted once during the server's short idempotency window. A future Supabase
store can replace `MemoryFeedbackStore` in `lib/feedback.ts` without changing
the frontend or API contract.

First, verify a sending domain in Resend. Then add these Vercel environment
variables for Production, Preview, and Development as appropriate:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | A secret Resend API key with permission to send email. |
| `FEEDBACK_FROM_EMAIL` | A sender address on your Resend-verified domain, for example `FirstPilot Feedback <feedback@your-domain.com>`. |
| `FEEDBACK_TO_EMAIL` | The private inbox where your team receives feedback. |

Copy `.env.example` to `.env.local` for local development and replace the
placeholders yourself. Never commit `.env.local` or paste keys into chat.
