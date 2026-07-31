import type { BlockerCategory } from "@/src/core/domain";

export type ActionLoopStep = {
  instruction: string;
  blockerCategory: BlockerCategory;
  readyForWork: boolean;
};

export type StateTransitionResult = {
  taskTitle: string;
  nextStep: ActionLoopStep;
  starterAction?: { title: string; instruction: string; estimatedMinutes: number };
};

/**
 * FirstPilot must not invent user context. This small guard catches common
 * hallucinated specifics from an AI response before the UI can show them.
 * It is intentionally conservative: generic guidance is always preferred.
 */
const unsupportedSpecificTerms = [
  "Speakout", "Cursor", "VS Code", "Notion", "Anki", "番茄", "西红柿", "洋葱", "宫保鸡丁", "红烧肉",
];

function introducesUnsupportedSpecific(text: string, knownContext: string) {
  const known = knownContext.toLowerCase();
  return unsupportedSpecificTerms.some((term) => text.includes(term) && !known.includes(term.toLowerCase()));
}

type ActionLoopInput = {
  taskTitle: string;
  blocker: string;
  completedSteps: string[];
  preferredMinutes?: number;
};

export type ActionHistoryInput = { instruction: string; status: "pending" | "completed" | "skipped" | "ineffective" };

export function normalizeActionInstruction(value: string) {
  return value.toLowerCase().replace(/[\s\p{P}]/gu, "");
}

export function repeatsResolvedAction(instruction: string, history: ActionHistoryInput[]) {
  const normalized = normalizeActionInstruction(instruction);
  return history.some((action) => action.status === "completed" && normalizeActionInstruction(action.instruction) === normalized);
}

const physical = /饿|饥|困|累|疲惫|没睡|头晕/;
const emotional = /焦虑|烦躁|紧张|害怕|压力|难受/;
const environmental = /床上|沙发|手机|抖音|短视频|噪音|躺着/;
const cognitive = /不知道|不会|没头绪|从哪|怎么开始/;
const perfectionism = /完美|必须|做完|全部|太多|来不及/;

function categoryFor(text: string): BlockerCategory {
  if (physical.test(text)) return "physical";
  if (emotional.test(text)) return "emotional";
  if (environmental.test(text)) return "environmental";
  if (cognitive.test(text)) return "cognitive";
  if (perfectionism.test(text)) return "perfectionism";
  return "ready";
}

/** A deterministic offline fallback. It intentionally returns one step, never a plan. */
export function fallbackStateTransition(input: ActionLoopInput): StateTransitionResult {
  const completedCount = input.completedSteps.length;
  const category = categoryFor(`${input.taskTitle} ${input.blocker}`);
  const preferredMinutes = Math.min(7, Math.max(3, input.preferredMinutes ?? 5));

  if (completedCount >= 2 || category === "ready") {
    return {
      taskTitle: input.taskTitle,
      nextStep: { instruction: "现在已经可以开始了。", blockerCategory: "ready", readyForWork: true },
      starterAction: {
        title: "开始眼前这一小段",
        instruction: `围绕“${input.taskTitle}”专注完成一小段。先做 ${preferredMinutes} 分钟，不要求一次做完全部。`,
        estimatedMinutes: preferredMinutes,
      },
    };
  }

  const instruction = category === "physical"
    ? (completedCount === 0
      ? (physical.test(input.blocker) && /饿|饥/.test(input.blocker) ? "先吃一点或喝点水，让身体有能量。" : "先站起来，活动一下身体。")
      : "喝一口水，然后走几步。")
    : category === "emotional"
      ? (completedCount === 0 ? "先做一组呼吸，让注意力回到当下。" : "把双脚放稳，慢慢看向眼前的环境。")
      : category === "environmental"
        ? (completedCount === 0 ? "先坐起来，把手机放到够不着的地方。" : "现在走到准备开始的地方。")
        : category === "cognitive"
          ? (completedCount === 0 ? "先把今天要用的材料放到眼前。" : "只选材料里的第一小段，不需要决定全部。")
          : `先把任务缩小：现在只做 ${preferredMinutes} 分钟。`;

  return { taskTitle: input.taskTitle, nextStep: { instruction, blockerCategory: category, readyForWork: false } };
}

export function validateStateTransition(value: unknown, taskTitle: string, preferredMinutes = 5, knownContext = taskTitle, history: ActionHistoryInput[] = []): StateTransitionResult | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const rawStep = input.nextStep as Record<string, unknown> | undefined;
  const instruction = typeof rawStep?.instruction === "string" ? rawStep.instruction.trim().slice(0, 120) : "";
  const blockerCategory = rawStep?.blockerCategory;
  const validCategories: BlockerCategory[] = ["physical", "emotional", "cognitive", "environmental", "perfectionism", "ready"];
  const readyForWork = rawStep?.readyForWork === true;
  if (!instruction || !validCategories.includes(blockerCategory as BlockerCategory) || introducesUnsupportedSpecific(instruction, knownContext) || repeatsResolvedAction(instruction, history)) return null;

  const result: StateTransitionResult = {
    taskTitle,
    nextStep: { instruction, blockerCategory: blockerCategory as BlockerCategory, readyForWork },
  };
  if (!readyForWork) return result;

  const rawAction = input.starterAction as Record<string, unknown> | undefined;
  const title = typeof rawAction?.title === "string" ? rawAction.title.trim().slice(0, 70) : "";
  const actionInstruction = typeof rawAction?.instruction === "string" ? rawAction.instruction.trim().slice(0, 240) : "";
  const estimatedMinutes = Number(rawAction?.estimatedMinutes);
  if (!title || !actionInstruction || !Number.isFinite(estimatedMinutes) || introducesUnsupportedSpecific(`${title} ${actionInstruction}`, knownContext)) return null;
  // The timer is driven by the user's setting, never by a model guess.
  result.starterAction = { title, instruction: actionInstruction, estimatedMinutes: preferredMinutes };
  return result;
}
