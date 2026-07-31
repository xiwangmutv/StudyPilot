export type BreathStage = "inhale" | "holdIn" | "exhale" | "holdOut" | "ready";
export type BreathingPattern = { inhale: number; holdIn: number; exhale: number; holdOut: number };
export type BreathingState = { group: number; stage: BreathStage; secondsRemaining: number };
export type BreathingMode = "start" | "focus" | "anxiety" | "sleep";

export const breathingModes: Record<BreathingMode, { pattern: BreathingPattern }> = {
  start: { pattern: { inhale: 3, holdIn: 1, exhale: 5, holdOut: 3 } },
  focus: { pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 } },
  anxiety: { pattern: { inhale: 4, holdIn: 2, exhale: 6, holdOut: 2 } },
  sleep: { pattern: { inhale: 4, holdIn: 6, exhale: 8, holdOut: 2 } },
};
const stages: Exclude<BreathStage, "ready">[] = ["inhale", "holdIn", "exhale", "holdOut"];
export function patternDuration(pattern: BreathingPattern, groups = 1) { return (pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut) * groups; }
function firstStage(pattern: BreathingPattern): Pick<BreathingState, "stage" | "secondsRemaining"> { const stage = stages.find((candidate) => pattern[candidate] > 0); return stage ? { stage, secondsRemaining: pattern[stage] } : { stage: "ready", secondsRemaining: 0 }; }
export function initialBreathingState(pattern: BreathingPattern = breathingModes.start.pattern): BreathingState { return { group: 1, ...firstStage(pattern) }; }
export function advanceBreathing(state: BreathingState, pattern: BreathingPattern = breathingModes.start.pattern, groups = 1): BreathingState { if (state.stage === "ready") return state; if (state.secondsRemaining > 0) return { ...state, secondsRemaining: state.secondsRemaining - 1 }; const stageIndex = stages.indexOf(state.stage); for (let index = stageIndex + 1; index < stages.length; index += 1) { const nextStage = stages[index]; if (pattern[nextStage] > 0) return { ...state, stage: nextStage, secondsRemaining: pattern[nextStage] }; } return state.group >= groups ? { group: groups, stage: "ready", secondsRemaining: 0 } : { group: state.group + 1, ...firstStage(pattern) }; }
