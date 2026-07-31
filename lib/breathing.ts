export type BreathStage = "inhale" | "holdIn" | "exhale" | "holdOut" | "ready";

export type BreathingPattern = {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
};

export type BreathingMode = "start" | "focus" | "anxiety" | "sleep";

export type BreathingState = {
  group: number;
  stage: BreathStage;
  secondsRemaining: number;
};

export const breathingModes: Record<BreathingMode, {
  label: string;
  description: string;
  pattern: BreathingPattern;
}> = {
  start: {
    label: "开始学习",
    description: "让自己安静下来，准备开始。",
    pattern: { inhale: 4, holdIn: 2, exhale: 4, holdOut: 2 },
  },
  focus: {
    label: "恢复专注",
    description: "暂停一下，把注意力带回眼前。",
    pattern: { inhale: 3, holdIn: 1, exhale: 3, holdOut: 1 },
  },
  anxiety: {
    label: "缓解焦虑",
    description: "放慢呼吸，给自己一点空间。",
    pattern: { inhale: 4, holdIn: 2, exhale: 6, holdOut: 2 },
  },
  sleep: {
    label: "睡前放松",
    description: "让节奏慢下来，准备休息。",
    pattern: { inhale: 4, holdIn: 6, exhale: 8, holdOut: 2 },
  },
};

const stages: Exclude<BreathStage, "ready">[] = ["inhale", "holdIn", "exhale", "holdOut"];

export function patternDuration(pattern: BreathingPattern, groups = 1) {
  return (pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut) * groups;
}

function firstStage(pattern: BreathingPattern): Pick<BreathingState, "stage" | "secondsRemaining"> {
  const stage = stages.find((candidate) => pattern[candidate] > 0);
  return stage ? { stage, secondsRemaining: pattern[stage] } : { stage: "ready", secondsRemaining: 0 };
}

export function initialBreathingState(pattern: BreathingPattern = breathingModes.start.pattern): BreathingState {
  return { group: 1, ...firstStage(pattern) };
}

/** Advances a configurable four-stage breathing cycle. Zero-duration stages are skipped. */
export function advanceBreathing(state: BreathingState, pattern: BreathingPattern = breathingModes.start.pattern, groups = 1): BreathingState {
  if (state.stage === "ready") return state;
  if (state.secondsRemaining > 1) return { ...state, secondsRemaining: state.secondsRemaining - 1 };

  const stageIndex = stages.indexOf(state.stage);
  for (let index = stageIndex + 1; index < stages.length; index += 1) {
    const nextStage = stages[index];
    if (pattern[nextStage] > 0) return { ...state, stage: nextStage, secondsRemaining: pattern[nextStage] };
  }

  if (state.group >= groups) return { group: groups, stage: "ready", secondsRemaining: 0 };
  return { group: state.group + 1, ...firstStage(pattern) };
}
