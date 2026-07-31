import type { ActionPlan, ActionStep, LearningTask } from "./domain";
import { storageKeys, type StorageEngine } from "./storage-engine";

/** Stores an ordered action plan. The server decides how it was decomposed. */
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
      steps: [
        { id: crypto.randomUUID(), title: `打开并准备「${task.title}」`, description: "把本次学习需要的材料放到眼前；现在不需要完成很多。", estimatedMinutes: 1 },
        { id: crypto.randomUUID(), title: "完成第一个小动作", description: "只专注眼前这一步；完成后再决定要不要继续。", estimatedMinutes: 3 },
        { id: crypto.randomUUID(), title: "再专注 5 分钟", description: "你已经启动了，只再向前走一点点。", estimatedMinutes: 5 },
      ],
    });
  }

  savePlan(plan: ActionPlan): ActionPlan {
    const plans = this.storage.get<ActionPlan[]>(storageKeys.actionPlans, []);
    this.storage.set(storageKeys.actionPlans, [...plans.filter((item) => item.taskId !== plan.taskId), plan]);
    return plan;
  }
}
