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

## Feedback delivery (Google Forms)

Feedback stays in the existing FirstPilot interface: the browser validates the
fields, disables repeat clicks while submitting, and shows a success message.
After validation, `POST /api/feedback` submits the response directly to your
Google Form. No domain, email provider, or paid service is required.

1. Create a Google Form and add the questions you want to collect. At minimum,
   add these questions exactly: `What type of feedback is this?` (multiple
   choice: 🐞 Bug Report, 💡 Feature Request, ❤️ General Feedback), `Please
   describe your feedback` (required paragraph), `What almost made you stop
   using FirstPilot?` (optional paragraph), `How satisfied are you with
   FirstPilot?` (1–5 rating), and `Your email (optional)`.
2. In Google Forms, click **Send**, select the link icon, copy the public form
   URL (it ends in `/viewform`). Make sure anyone with the link can respond.
3. Add this single environment variable in Vercel for Production, Preview, and
   Development, then redeploy:

   | Variable | Value |
   | --- | --- |
   | `GOOGLE_FEEDBACK_FORM_URL` | Your public Google Form URL. |

For local development, copy `.env.example` to `.env.local` and set the same
variable. No email-service variables or secrets are needed.

The API route and its validation remain deliberately separate from the UI. When
you later add a database or a direct delivery service, save the validated
submission in `app/api/feedback/route.ts`; the frontend contract can stay the
same.
