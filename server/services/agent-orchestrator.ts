interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  priority: number;
  payload: Record<string, any>;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

interface AgentInstance {
  id: string;
  name: string;
  type: string;
  status: "idle" | "busy" | "offline";
  currentTask?: string;
  completedTasks: number;
  failedTasks: number;
  avgResponseTime: number;
  lastActive: Date;
}

interface OrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
  priorityLevels: number;
}

const config: OrchestratorConfig = {
  maxConcurrentTasks: 5,
  taskTimeout: 30000,
  retryAttempts: 3,
  priorityLevels: 10
};

const taskQueue: Map<number, AgentTask[]> = new Map();
const activeTasks: Map<string, AgentTask> = new Map();
const completedTasks: AgentTask[] = [];
const agents: Map<string, AgentInstance> = new Map();
const taskHandlers: Map<string, (task: AgentTask) => Promise<any>> = new Map();

export function registerAgent(id: string, name: string, type: string): AgentInstance {
  const agent: AgentInstance = {
    id,
    name,
    type,
    status: "idle",
    completedTasks: 0,
    failedTasks: 0,
    avgResponseTime: 0,
    lastActive: new Date()
  };
  
  agents.set(id, agent);
  return agent;
}

export function unregisterAgent(agentId: string): boolean {
  return agents.delete(agentId);
}

export function registerTaskHandler(taskType: string, handler: (task: AgentTask) => Promise<any>): void {
  taskHandlers.set(taskType, handler);
}

export function submitTask(
  agentId: string,
  type: string,
  payload: Record<string, any>,
  priority: number = 5
): AgentTask {
  const task: AgentTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    agentId,
    type,
    priority: Math.min(Math.max(priority, 1), config.priorityLevels),
    payload,
    status: "queued",
    createdAt: new Date()
  };
  
  if (!taskQueue.has(priority)) {
    taskQueue.set(priority, []);
  }
  taskQueue.get(priority)!.push(task);
  
  processQueue();
  
  return task;
}

async function processQueue(): Promise<void> {
  if (activeTasks.size >= config.maxConcurrentTasks) return;
  
  const task = getNextTask();
  if (!task) return;
  
  const agent = agents.get(task.agentId);
  if (!agent || agent.status !== "idle") {
    requeue(task);
    return;
  }
  
  await executeTask(task, agent);
  processQueue();
}

function getNextTask(): AgentTask | null {
  for (let priority = config.priorityLevels; priority >= 1; priority--) {
    const queue = taskQueue.get(priority);
    if (queue && queue.length > 0) {
      return queue.shift()!;
    }
  }
  return null;
}

function requeue(task: AgentTask): void {
  const queue = taskQueue.get(task.priority) || [];
  queue.unshift(task);
  taskQueue.set(task.priority, queue);
}

async function executeTask(task: AgentTask, agent: AgentInstance): Promise<void> {
  task.status = "running";
  task.startedAt = new Date();
  agent.status = "busy";
  agent.currentTask = task.id;
  activeTasks.set(task.id, task);
  
  const handler = taskHandlers.get(task.type);
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Task timeout")), config.taskTimeout);
    });
    
    const result = handler 
      ? await Promise.race([handler(task), timeoutPromise])
      : { message: "No handler registered" };
    
    task.status = "completed";
    task.result = result;
    agent.completedTasks++;
    
  } catch (error) {
    task.status = "failed";
    task.error = error instanceof Error ? error.message : "Unknown error";
    agent.failedTasks++;
    
  } finally {
    task.completedAt = new Date();
    agent.status = "idle";
    agent.currentTask = undefined;
    agent.lastActive = new Date();
    
    const duration = task.completedAt.getTime() - task.startedAt!.getTime();
    agent.avgResponseTime = (agent.avgResponseTime * (agent.completedTasks - 1) + duration) / agent.completedTasks;
    
    activeTasks.delete(task.id);
    completedTasks.push(task);
    
    if (completedTasks.length > 1000) {
      completedTasks.shift();
    }
  }
}

export function getTask(taskId: string): AgentTask | undefined {
  const active = activeTasks.get(taskId);
  if (active) return active;
  
  return completedTasks.find(t => t.id === taskId);
}

export function getAgentTasks(agentId: string): AgentTask[] {
  return completedTasks.filter(t => t.agentId === agentId);
}

export function getAgent(agentId: string): AgentInstance | undefined {
  return agents.get(agentId);
}

export function getAllAgents(): AgentInstance[] {
  return Array.from(agents.values());
}

export function getIdleAgents(): AgentInstance[] {
  return getAllAgents().filter(a => a.status === "idle");
}

export function getQueueStats(): { total: number; byPriority: Record<number, number> } {
  let total = 0;
  const byPriority: Record<number, number> = {};
  
  for (const [priority, queue] of taskQueue.entries()) {
    byPriority[priority] = queue.length;
    total += queue.length;
  }
  
  return { total, byPriority };
}

export function getOrchestratorStats(): {
  totalAgents: number;
  idleAgents: number;
  busyAgents: number;
  queuedTasks: number;
  activeTasks: number;
  completedTasks: number;
  avgResponseTime: number;
} {
  const agentList = getAllAgents();
  const queueStats = getQueueStats();
  
  const totalResponseTime = agentList.reduce((sum, a) => sum + a.avgResponseTime, 0);
  
  return {
    totalAgents: agentList.length,
    idleAgents: agentList.filter(a => a.status === "idle").length,
    busyAgents: agentList.filter(a => a.status === "busy").length,
    queuedTasks: queueStats.total,
    activeTasks: activeTasks.size,
    completedTasks: completedTasks.length,
    avgResponseTime: agentList.length > 0 ? totalResponseTime / agentList.length : 0
  };
}

export function cancelTask(taskId: string): boolean {
  for (const [priority, queue] of taskQueue.entries()) {
    const index = queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      queue.splice(index, 1);
      return true;
    }
  }
  return false;
}

export function updateConfig(newConfig: Partial<OrchestratorConfig>): void {
  Object.assign(config, newConfig);
}

export function getConfig(): OrchestratorConfig {
  return { ...config };
}
