import type { LearningTask } from "./domain";
export class ProgressEngine { completedTasks(tasks:LearningTask[]){return tasks.filter(t=>t.completed);} completionPercentage(tasks:LearningTask[]){return tasks.length?Math.round(this.completedTasks(tasks).length/tasks.length*100):0;} currentPosition(tasks:LearningTask[]){return tasks.find(t=>!t.completed)?.position??tasks.length;} }
