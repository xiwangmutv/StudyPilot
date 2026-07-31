import assert from "node:assert/strict";
import test from "node:test";
import { advanceBreathing, breathingModes, initialBreathingState } from "../lib/breathing.ts";
import { fallbackStateTransition, repeatsResolvedAction, validateStateTransition } from "../lib/state-transition.ts";
import { LatestRequest } from "../lib/latest-request.ts";
import { alignInstructionDuration, firstFocusSeconds } from "../lib/focus-duration.ts";
import { shouldOfferBreathing } from "../lib/start-assist.ts";
import { MemoryFeedbackStore, validateFeedback } from "../lib/feedback.ts";
import { createGoogleFormPayload, getGoogleFormResponseUrl } from "../lib/google-feedback.ts";
import { completedSessionCount, isSignInNudgeDismissed, SIGN_IN_NUDGE_THRESHOLD } from "../lib/account.ts";

test("sign-in reminder appears after three completed sessions and respects dismissal", () => {
  assert.equal(completedSessionCount([{ completed: true }, { completed: false }, { completed: true }, { completed: true }]), SIGN_IN_NUDGE_THRESHOLD);
  assert.equal(isSignInNudgeDismissed(String(2_000), 1_000), true);
  assert.equal(isSignInNudgeDismissed(String(1_000), 1_000), false);
});

test("feedback validation accepts a bounded valid submission", () => {
  const result = validateFeedback({ id: "test-id", type: "bug", message: "The timer did not start.", almostQuit: "", contact: "person@example.com", satisfaction: 4 });
  assert.equal(result.ok, true);
});

test("feedback validation rejects invalid types, empty messages, and bad email", () => {
  assert.equal(validateFeedback({ id: "test-id", type: "other", message: "Hello", almostQuit: "", contact: "", satisfaction: 5 }).ok, false);
  assert.equal(validateFeedback({ id: "test-id", type: "bug", message: " ", almostQuit: "", contact: "", satisfaction: 5 }).ok, false);
  assert.equal(validateFeedback({ id: "test-id", type: "bug", message: "Hello", almostQuit: "", contact: "not-an-email", satisfaction: 5 }).ok, false);
  assert.equal(validateFeedback({ id: "test-id", type: "bug", message: "Hello", almostQuit: "", contact: "", satisfaction: 0 }).ok, false);
});

test("Google Forms payload maps every FirstPilot feedback field", () => {
  const payload = createGoogleFormPayload({ id: "test-id", type: "feature", message: "Dark mode", almostQuit: "The screen was bright", contact: "person@example.com", satisfaction: 4 });
  assert.equal(payload.get("entry.1065377403"), "💡 Feature Request");
  assert.equal(payload.get("entry.1229165353"), "Dark mode");
  assert.equal(payload.get("entry.476723113"), "The screen was bright");
  assert.equal(payload.get("entry.2070303933"), "4");
  assert.equal(payload.get("entry.684873970"), "person@example.com");
  assert.equal(getGoogleFormResponseUrl("https://docs.google.com/forms/d/e/form-id/viewform?usp=sharing"), "https://docs.google.com/forms/d/e/form-id/formResponse");
});

test("feedback store accepts one submission ID only once within its TTL", () => {
  const store = new MemoryFeedbackStore(1_000);
  assert.equal(store.claim("same-request", 1), true);
  assert.equal(store.claim("same-request", 2), false);
  store.release("same-request");
  assert.equal(store.claim("same-request", 3), true);
  assert.equal(store.claim("same-request", 1_004), true);
});

test("only the newest next-action response can update the UI", () => {
  const requests = new LatestRequest();
  const first = requests.begin();
  const second = requests.begin();
  assert.equal(first.signal.aborted, true);
  assert.equal(requests.isLatest(first.id), false);
  assert.equal(requests.isLatest(second.id), true);
});

test("a cancelled next-action request cannot win after a later request", () => {
  const requests = new LatestRequest();
  const request = requests.begin();
  requests.cancel();
  assert.equal(request.signal.aborted, true);
  assert.equal(requests.isLatest(request.id), false);
});

test("a one-group four-stage breathing ritual finishes after its configured duration", () => {
  const pattern = breathingModes.start.pattern;
  let state = initialBreathingState(pattern);
  for (let index = 0; index < 16; index += 1) state = advanceBreathing(state, pattern, 1);
  assert.deepEqual(state, { group: 1, stage: "ready", secondsRemaining: 0 });
});

test("three breathing groups finish after three full four-stage cycles", () => {
  const pattern = breathingModes.start.pattern;
  let state = initialBreathingState(pattern);
  for (let index = 0; index < 48; index += 1) state = advanceBreathing(state, pattern, 3);
  assert.deepEqual(state, { group: 3, stage: "ready", secondsRemaining: 0 });
});

test("zero-duration breathing stages are skipped", () => {
  const pattern = { inhale: 1, holdIn: 0, exhale: 1, holdOut: 0 };
  let state = initialBreathingState(pattern);
  state = advanceBreathing(state, pattern, 1);
  assert.deepEqual(state, { group: 1, stage: "inhale", secondsRemaining: 0 });
  state = advanceBreathing(state, pattern, 1);
  assert.deepEqual(state, { group: 1, stage: "exhale", secondsRemaining: 1 });
});

test("Action Loop accepts exactly one bounded starter action once the user is ready", () => {
  const result = validateStateTransition({ nextStep: { instruction: "现在已经可以开始了。", blockerCategory: "ready", readyForWork: true }, starterAction: { title: "完成第一遍听力", instruction: "先完整听第一遍，不暂停，也不查看答案。", estimatedMinutes: 99 } }, "做第52章听力");
  assert.ok(result);
  assert.equal(result.nextStep.readyForWork, true);
  assert.equal(result.starterAction?.estimatedMinutes, 5);
});

test("configured first-focus duration is the one used for copy and timer", () => {
  const settings = { starterMinutes: 5 as const };
  assert.equal(firstFocusSeconds(settings), 300);
  assert.equal(alignInstructionDuration("自己说两分钟", settings), "自己说 5 分钟");
});

test("breathing preference changes the Action Loop behavior", () => {
  const instruction = "先做一组呼吸，让注意力回到当下。";
  assert.equal(shouldOfferBreathing(instruction, { breathingAssist: "allow" }), true);
  assert.equal(shouldOfferBreathing(instruction, { breathingAssist: "never" }), false);
});

test("Action Loop rejects invented tools or materials that the user did not provide", () => {
  const result = validateStateTransition({
    nextStep: { instruction: "现在已经可以开始了。", blockerCategory: "ready", readyForWork: true },
    starterAction: { title: "打开 Speakout", instruction: "打开 Speakout 第 1 课并开始阅读。", estimatedMinutes: 5 },
  }, "练习英语口语");
  assert.equal(result, null);
});

test("Action Loop accepts a specific detail once the user explicitly provided it", () => {
  const result = validateStateTransition({
    nextStep: { instruction: "现在已经可以开始了。", blockerCategory: "ready", readyForWork: true },
    starterAction: { title: "打开 Speakout", instruction: "打开 Speakout Day 18，完成第一小段。", estimatedMinutes: 5 },
  }, "学习 Speakout Day 18");
  assert.ok(result);
});

test("offline Action Loop removes one environmental blocker before proposing work", () => {
  const result = fallbackStateTransition({ taskTitle: "学习做饭", blocker: "我躺在床上刷手机，不想动。", completedSteps: [], preferredMinutes: 5 });
  assert.equal(result.taskTitle, "学习做饭");
  assert.equal(result.nextStep.readyForWork, false);
  assert.match(result.nextStep.instruction, /坐起来/);
});

test("offline Action Loop becomes ready after small transition steps", () => {
  const result = fallbackStateTransition({ taskTitle: "做第52章听力", blocker: "我很累。", completedSteps: ["先站起来，活动一下身体。", "喝点水。"], preferredMinutes: 5 });
  assert.equal(result.nextStep.readyForWork, true);
  assert.equal(result.starterAction?.estimatedMinutes, 5);
});

test("Action Loop never repeats a completed action", () => {
  assert.equal(repeatsResolvedAction("先坐起来。", [{ instruction: "先坐起来", status: "completed" }]), true);
  const result = validateStateTransition(
    { nextStep: { instruction: "先坐起来。", blockerCategory: "environmental", readyForWork: false } },
    "学习英语",
    5,
    "学习英语 我躺在床上",
    [{ instruction: "先坐起来", status: "completed" }],
  );
  assert.equal(result, null);
});
