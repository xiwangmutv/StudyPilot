export type StateContext = "ready" | "tired" | "distracted" | "overwhelmed";

export type StateSwitch = { title: string; detail: string; seconds: number };

/** FirstPilot makes one small state change before focus, never a coaching loop. */
export function recommendStateSwitch(context: StateContext, locale: "zh" | "en" = "en"): StateSwitch {
  const english: Record<StateContext, StateSwitch> = {
    ready: { title: "Read one paragraph.", detail: "Open your material and read only the first paragraph.", seconds: 60 },
    tired: { title: "Drink some water.", detail: "Stand up, take a few sips, then come straight back.", seconds: 60 },
    distracted: { title: "Clear one thing from your desk.", detail: "Put away the one item pulling your attention.", seconds: 60 },
    overwhelmed: { title: "Take one slow breath.", detail: "Inhale, exhale, then open the first thing you need.", seconds: 30 },
  };
  const chinese: Record<StateContext, StateSwitch> = {
    ready: { title: "先读一段。", detail: "打开材料，只读第一段。", seconds: 60 },
    tired: { title: "喝几口水。", detail: "站起来喝几口水，然后直接回来。", seconds: 60 },
    distracted: { title: "清掉桌上一样东西。", detail: "收起最分散你注意力的那样东西。", seconds: 60 },
    overwhelmed: { title: "做一次慢呼吸。", detail: "吸气，呼气，然后打开要做的第一件事。", seconds: 30 },
  };
  return (locale === "zh" ? chinese : english)[context];
}
