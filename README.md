# StudyPilot

一个本地优先的学习启动器：用户输入眼前任务，AI 只生成一个约 3–7 分钟的最小启动单元；完成后，用户可以自由继续或结束今天。

## 配置 AI

复制 `.env.example` 为 `.env.local`，填写任意 OpenAI-compatible 服务的配置。默认示例为 DeepSeek。密钥仅由服务端 API 路由读取，绝不能放入浏览器代码或提交到 Git。

## 运行

`npm.cmd run dev` · `npm.cmd run test` · `npm.cmd run build`
