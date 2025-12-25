import type { AnalysisResult } from "@shared/ai-engine";

const SCHEDULER_INTERVAL_MS = 60000;
const MAX_QUEUED_TASKS = 100;

interface ScheduledTask {
  taskId: string;
  agentId: string;
  tokenAddress: string;
  priority: number;
  scheduledAt: number;
  executeAt: number;
}

const taskQueue: ScheduledTask[] = [];

export function scheduleAnalysis(
  agentId: string,
  tokenAddress: string,
  delayMs: number = 0,
  priority: number = 1
): string {
  const taskId = `task_${agentId}_${Date.now()}`;
  const now = Date.now();

  const task: ScheduledTask = {
    taskId,
    agentId,
    tokenAddress,
    priority,
    scheduledAt: now,
    executeAt: now + delayMs,
  };

  taskQueue.push(task);
  taskQueue.sort((a, b) => b.priority - a.priority || a.executeAt - b.executeAt);

  if (taskQueue.length > MAX_QUEUED_TASKS) {
    taskQueue.pop();
  }

  return taskId;
}

export function getNextTask(): ScheduledTask | null {
  const now = Date.now();
  const idx = taskQueue.findIndex((t) => t.executeAt <= now);
  
  if (idx === -1) return null;
  
  return taskQueue.splice(idx, 1)[0];
}

export function cancelTask(taskId: string): boolean {
  const idx = taskQueue.findIndex((t) => t.taskId === taskId);
  if (idx === -1) return false;
  
  taskQueue.splice(idx, 1);
  return true;
}

export function getQueueLength(): number {
  return taskQueue.length;
}
