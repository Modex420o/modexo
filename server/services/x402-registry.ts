import { MODEXO_AGENTS, X402AgentConfig } from "./x402";

interface AgentRegistration {
  agentId: string;
  registeredAt: Date;
  lastUpdated: Date;
  status: "active" | "inactive" | "maintenance";
  version: string;
  healthCheck: {
    lastCheck: Date;
    healthy: boolean;
    responseTime: number;
  };
}

interface RegistryEntry {
  config: X402AgentConfig;
  registration: AgentRegistration;
  metadata: {
    category: string;
    tags: string[];
    documentation?: string;
  };
}

const agentRegistry: Map<string, RegistryEntry> = new Map();

export function initializeRegistry(): void {
  for (const agent of MODEXO_AGENTS) {
    const entry: RegistryEntry = {
      config: agent,
      registration: {
        agentId: agent.id,
        registeredAt: new Date(),
        lastUpdated: new Date(),
        status: "active",
        version: "1.0.0",
        healthCheck: {
          lastCheck: new Date(),
          healthy: true,
          responseTime: 0
        }
      },
      metadata: {
        category: getCategoryForAgent(agent.id),
        tags: getTagsForAgent(agent.id),
        documentation: getDocsUrl(agent.id)
      }
    };
    agentRegistry.set(agent.id, entry);
  }
}

function getCategoryForAgent(agentId: string): string {
  if (agentId.includes("portfolio") || agentId.includes("entry")) {
    return "Trading";
  }
  if (agentId.includes("liquidity") || agentId.includes("whale")) {
    return "Analytics";
  }
  if (agentId.includes("kyc")) {
    return "Compliance";
  }
  return "Utility";
}

function getTagsForAgent(agentId: string): string[] {
  const tags: string[] = ["x402", "solana", "ai"];
  if (agentId.includes("portfolio")) tags.push("wallet", "holdings");
  if (agentId.includes("entry")) tags.push("trading", "signals");
  if (agentId.includes("liquidity")) tags.push("defi", "pools");
  if (agentId.includes("whale")) tags.push("tracking", "alerts");
  if (agentId.includes("kyc")) tags.push("compliance", "verification");
  return tags;
}

function getDocsUrl(agentId: string): string {
  return `https://docs.modexo.org/agents/${agentId}`;
}

export function getAgent(agentId: string): RegistryEntry | undefined {
  return agentRegistry.get(agentId);
}

export function getAllAgents(): RegistryEntry[] {
  return Array.from(agentRegistry.values());
}

export function getActiveAgents(): RegistryEntry[] {
  return getAllAgents().filter(entry => entry.registration.status === "active");
}

export function getAgentsByCategory(category: string): RegistryEntry[] {
  return getAllAgents().filter(entry => entry.metadata.category === category);
}

export function getAgentsByTag(tag: string): RegistryEntry[] {
  return getAllAgents().filter(entry => entry.metadata.tags.includes(tag));
}

export function updateAgentStatus(agentId: string, status: "active" | "inactive" | "maintenance"): boolean {
  const entry = agentRegistry.get(agentId);
  if (!entry) return false;
  entry.registration.status = status;
  entry.registration.lastUpdated = new Date();
  return true;
}

export function updateHealthCheck(agentId: string, healthy: boolean, responseTime: number): boolean {
  const entry = agentRegistry.get(agentId);
  if (!entry) return false;
  entry.registration.healthCheck = {
    lastCheck: new Date(),
    healthy,
    responseTime
  };
  return true;
}

export function getRegistryStats(): {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  healthy: number;
} {
  const all = getAllAgents();
  return {
    total: all.length,
    active: all.filter(e => e.registration.status === "active").length,
    inactive: all.filter(e => e.registration.status === "inactive").length,
    maintenance: all.filter(e => e.registration.status === "maintenance").length,
    healthy: all.filter(e => e.registration.healthCheck.healthy).length
  };
}

export function searchAgents(query: string): RegistryEntry[] {
  const lowerQuery = query.toLowerCase();
  return getAllAgents().filter(entry => {
    const config = entry.config;
    return (
      config.id.toLowerCase().includes(lowerQuery) ||
      config.name.toLowerCase().includes(lowerQuery) ||
      config.description.toLowerCase().includes(lowerQuery) ||
      entry.metadata.tags.some(tag => tag.includes(lowerQuery))
    );
  });
}

export function getAgentManifest(agentId: string): object | null {
  const entry = agentRegistry.get(agentId);
  if (!entry) return null;
  
  return {
    id: entry.config.id,
    name: entry.config.name,
    description: entry.config.description,
    price: `$${entry.config.priceUSD} USDC`,
    endpoint: entry.config.resource,
    method: entry.config.method,
    category: entry.metadata.category,
    tags: entry.metadata.tags,
    status: entry.registration.status,
    version: entry.registration.version,
    documentation: entry.metadata.documentation
  };
}

export function exportRegistry(): string {
  const manifests = getAllAgents().map(entry => getAgentManifest(entry.config.id));
  return JSON.stringify({
    platform: "MODEXO",
    protocol: "x402",
    network: "solana",
    agents: manifests,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

initializeRegistry();
