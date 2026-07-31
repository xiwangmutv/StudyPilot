import type { ActionLifecycle, ActionPlan, ActionRecord, ActionStep, BlockerCategory, LearningTask } from "./domain";
import { storageKeys, type StorageEngine } from "./storage-engine";

/** Stores the local state of one Action Loop launch. */
export class ActionEngine {
  constructor(private readonly storage: StorageEngine) {}

  getPlan(task: LearningTask): ActionPlan {
    const plans = this.storage.get<ActionPlan[]>(storageKeys.actionPlans, []);
    return plans.find((plan) => plan.taskId === task.id) ?? this.createPlan(task);
  }

  getStep(task: LearningTask, index = 0): ActionStep | null {
    return this.getPlan(task).steps[index] ?? null;
  }

  createPlan(task: LearningTask): ActionPlan {
    return this.savePlan({
      taskId: task.id,
      updatedAt: new Date().toISOString(),
      source: "fallback",
      transitionSteps: [],
      completedTransitionSteps: [],
      actionHistory: [],
      steps: [{
        id: crypto.randomUUID(),
        title: `进入“${task.title}”的第一小段`,
        description: "先完成眼前最容易开始的一小段。无需一次做完全部。",
        estimatedMinutes: 5,
      }],
    });
  }

  savePlan(plan: ActionPlan): ActionPlan {
    const plans = this.storage.get<ActionPlan[]>(storageKeys.actionPlans, []);
    this.storage.set(storageKeys.actionPlans, [...plans.filter((item) => item.taskId !== plan.taskId), plan]);
    return plan;
  }

  addAction(plan: ActionPlan, instruction: string, blockerCategory: BlockerCategory): ActionPlan {
    const action: ActionRecord = {
      id: crypto.randomUUID(),
      instruction,
      blockerCategory,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    return this.savePlan({ ...plan, updatedAt: action.createdAt, actionHistory: [...(plan.actionHistory ?? []), action] });
  }

  resolveAction(plan: ActionPlan, actionId: string, status: Exclude<ActionLifecycle, "pending">): ActionPlan {
    const resolvedAt = new Date().toISOString();
    return this.savePlan({
      ...plan,
      updatedAt: resolvedAt,
      actionHistory: (plan.actionHistory ?? []).map((action) => action.id === actionId ? { ...action, status, resolvedAt } : action),
    });
  }
}
