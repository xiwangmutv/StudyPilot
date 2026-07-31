export const supportedLocales = ["zh", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

const messages = {
  zh: {
    nav: { home: "首页", breathing: "呼吸训练", later: "稍后开始", history: "成长档案", settings: "设置", feedback: "反馈" },
    language: "语言", switchLanguage: "切换语言",
    home: {
      eyebrow: "你的 AI 行动向导", title: "今天想\n开始什么？", description: "帮助你从「想开始」，走到「已经开始」。不用规划全部，只处理眼前最大的阻碍。",
      taskLabel: "我想开始……", taskPlaceholder: "例如：做雅思听力、写代码、学习做饭", next: "下一步", back: "← 返回",
      stateEyebrow: "先不解决全部", stateTitle: "现在卡在哪？", stateDescription: "用自己的话说就好。例如：「我很累、很困，也有点烦。」我每次只带你走一步。",
      blockerLabel: "现在是什么情况？", blockerPlaceholder: "例如：我躺在床上刷手机，想做听力，但是一点都不想动。", preparing: "正在准备下一步…", start: "带我开始", error: "暂时无法准备这次开始，请重试。"
    },
    feedback: {
      eyebrow: "帮助 FirstPilot 变得更好", title: "给我们一点反馈", description: "你的每一条反馈都会帮助我们更好地理解：什么能真正帮你开始。",
      typeLabel: "这是什么反馈？", bug: "问题报告", feature: "功能建议", general: "其他想法",
      messageLabel: "发生了什么？", messagePlaceholder: "尽可能描述你当时的目标、看到的情况，以及你的期待。",
      quitLabel: "是什么差点让你放弃使用 FirstPilot？", quitPlaceholder: "例如：我不知道下一步该做什么、页面太慢、建议不符合我的情况……",
      contactLabel: "联系方式（可选）", contactPlaceholder: "邮箱或微信；只在需要跟进时使用", submit: "保存反馈", saved: "反馈已保存在这台设备上。感谢你帮助 FirstPilot 进步！", required: "请先告诉我们发生了什么。", note: "暂不需要登录。反馈仅保存在这台设备上，直到我们接入收集服务。"
    }
  },
  en: {
    nav: { home: "Home", breathing: "Breathe", later: "Later", history: "History", settings: "Settings", feedback: "Feedback" },
    language: "Language", switchLanguage: "Switch language",
    home: {
      eyebrow: "Your AI action guide", title: "What would you like\nto start today?", description: "Move from wanting to start to actually starting. You do not have to plan everything—just address the biggest obstacle in front of you.",
      taskLabel: "I want to start…", taskPlaceholder: "For example: IELTS listening, writing code, learning to cook", next: "Next", back: "← Back",
      stateEyebrow: "You do not need to solve everything", stateTitle: "Where are you stuck right now?", stateDescription: "Use your own words. For example: “I’m tired, distracted, and a little annoyed.” We’ll only take one step at a time.",
      blockerLabel: "What is going on right now?", blockerPlaceholder: "For example: I’m scrolling in bed. I want to study, but I can’t make myself move.", preparing: "Preparing your next step…", start: "Help me start", error: "We couldn't prepare this start. Please try again."
    },
    feedback: {
      eyebrow: "Help make FirstPilot better", title: "Share your feedback", description: "Every note helps us understand what genuinely helps you get started.",
      typeLabel: "What kind of feedback is this?", bug: "Bug report", feature: "Feature request", general: "Other thought",
      messageLabel: "What happened?", messagePlaceholder: "Describe what you were trying to do, what you saw, and what you expected.",
      quitLabel: "What's the one thing that almost made you stop using FirstPilot?", quitPlaceholder: "For example: I didn't know what to do next, the page was slow, or the suggestion didn't fit me…",
      contactLabel: "Contact details (optional)", contactPlaceholder: "Email or another way to reach you; only used for follow-up", submit: "Save feedback", saved: "Your feedback is saved on this device. Thank you for helping FirstPilot improve!", required: "Please tell us what happened first.", note: "No sign-in required. Feedback stays on this device until we connect a collection service."
    }
  }
} as const;

export type Messages = (typeof messages)[Locale];
export const getMessages = (locale: Locale) => messages[locale];
