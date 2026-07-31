import type { DecisionUser, NextAction } from "./domain";

export interface DecisionEngine {
  getNextAction(user: DecisionUser): NextAction | null;
}

export class RuleDecisionEngine implements DecisionEngine {
  getNextAction(user: DecisionUser): NextAction | null {
    const unfinished = user.tasks.filter((task) => !task.completed);
    const resumedTask = user.resume?.taskId
      ? unfinished.find((task) => task.id === user.resume?.taskId)
      : undefined;
    const task = resumedTask ?? unfinished[0];
    if (!task) return null;
    return {
      kind: resumedTask ? "resume" : "start",
      task,
      reason: resumedTask ? "恢复未完成学习" : "开始下一个任务",
    };
  }
}
