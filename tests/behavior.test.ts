import assert from "node:assert/strict";
import test from "node:test";
import { advanceBreathing, breathingModes, initialBreathingState } from "../lib/breathing.ts";
import { fallbackStarterAction, validateStarterAction } from "../lib/action-decomposition.ts";

test("a one-group four-stage breathing ritual finishes after its configured duration", () => {
  const pattern = breathingModes.start.pattern;
  let state = initialBreathingState(pattern);
  for (let index = 0; index < 12; index += 1) state = advanceBreathing(state, pattern, 1);
  assert.deepEqual(state, { group: 1, stage: "ready", secondsRemaining: 0 });
});

test("three breathing groups finish after three full four-stage cycles", () => {
  const pattern = breathingModes.start.pattern;
  let state = initialBreathingState(pattern);
  for (let index = 0; index < 36; index += 1) state = advanceBreathing(state, pattern, 3);
  assert.deepEqual(state, { group: 3, stage: "ready", secondsRemaining: 0 });
});

test("zero-duration breathing stages are skipped", () => {
  const pattern = { inhale: 1, holdIn: 0, exhale: 1, holdOut: 0 };
  let state = initialBreathingState(pattern);
  state = advanceBreathing(state, pattern, 1);
  assert.deepEqual(state, { group: 1, stage: "exhale", secondsRemaining: 1 });
  state = advanceBreathing(state, pattern, 1);
  assert.deepEqual(state, { group: 1, stage: "ready", secondsRemaining: 0 });
});

test("starter action is bounded to a meaningful 3 to 7 minutes", () => {
  const result = validateStarterAction({ taskTitle: "做第52章听力", starterAction: { title: "完成第一遍听力", instruction: "浏览题目后，完整听第一遍。", estimatedMinutes: 99 } }, "备用任务");
  assert.ok(result);
  assert.equal(result.starterAction.estimatedMinutes, 7);
});

test("offline fallback produces one usable starter action", () => {
  const result = fallbackStarterAction("做第52章听力", 5);
  assert.equal(result.taskTitle, "做第52章听力");
  assert.equal(result.starterAction.estimatedMinutes, 5);
  assert.ok(result.starterAction.instruction.length > 0);
});
