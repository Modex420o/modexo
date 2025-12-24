import { X402_PROTOCOL_VERSION, X402_NETWORK_ID } from "@shared/x402";

const BASE_PRICE_LAMPORTS = 100000;
const MIN_PRICE_MULTIPLIER = 0.5;
const MAX_PRICE_MULTIPLIER = 3.0;
const PRICE_UPDATE_INTERVAL_MS = 60000;
const DEMAND_WINDOW_MS = 300000;

type PricingTier = "free" | "basic" | "standard" | "premium" | "enterprise";
type PricingModel = "per_request" | "per_token" | "per_minute" | "flat_rate";

interface AgentPricing {
  agentId: string;
  basePrice: number;
  model: PricingModel;
  tier: PricingTier;
  dynamicPricing: boolean;
  currentMultiplier: number;
  lastUpdated: number;
  customRates?: Record<string, number>;
}

interface DemandMetrics {
  agentId: string;
  requestCount: number;
  windowStart: number;
  peakRequests: number;
  averageRequests: number;
}

interface PricingHistory {
  agentId: string;
  timestamp: number;
  price: number;
  multiplier: number;
  reason: string;
}

interface DiscountRule {
  id: string;
  name: string;
  type: "volume" | "loyalty" | "promotional" | "wallet_specific";
  discountPercent: number;
  minVolume?: number;
  walletAddresses?: string[];
  validUntil?: number;
  active: boolean;
}

interface PricingMetrics {
  totalAgents: number;
  averageMultiplier: number;
  highDemandAgents: number;
  lowDemandAgents: number;
  activeDiscounts: number;
}

const agentPricing = new Map<string, AgentPricing>();
const demandMetrics = new Map<string, DemandMetrics>();
const pricingHistory = new Map<string, PricingHistory[]>();
const discountRules = new Map<string, DiscountRule>();
const walletVolume = new Map<string, number>();

const tierMultipliers: Record<PricingTier, number> = {
  free: 0,
  basic: 1,
  standard: 1.5,
  premium: 2.5,
  enterprise: 4,
};

const modelDefaults: Record<PricingModel, number> = {
  per_request: BASE_PRICE_LAMPORTS,
  per_token: Math.floor(BASE_PRICE_LAMPORTS / 1000),
  per_minute: BASE_PRICE_LAMPORTS * 10,
  flat_rate: BASE_PRICE_LAMPORTS * 100,
};

export function registerAgentPricing(
  agentId: string,
  options: {
    basePrice?: number;
    model?: PricingModel;
    tier?: PricingTier;
    dynamicPricing?: boolean;
    customRates?: Record<string, number>;
  } = {}
): AgentPricing {
  const model = options.model || "per_request";
  
  const pricing: AgentPricing = {
    agentId,
    basePrice: options.basePrice || modelDefaults[model],
    model,
    tier: options.tier || "standard",
    dynamicPricing: options.dynamicPricing !== false,
    currentMultiplier: 1.0,
    lastUpdated: Date.now(),
    customRates: options.customRates,
  };

  agentPricing.set(agentId, pricing);
  
  demandMetrics.set(agentId, {
    agentId,
    requestCount: 0,
    windowStart: Date.now(),
    peakRequests: 0,
    averageRequests: 0,
  });

  pricingHistory.set(agentId, []);

  return pricing;
}

export function getAgentPricing(agentId: string): AgentPricing | null {
  return agentPricing.get(agentId) || null;
}

export function calculatePrice(
  agentId: string,
  units: number = 1,
  walletAddress?: string
): { price: number; breakdown: Record<string, number> } {
  const pricing = agentPricing.get(agentId);
  
  if (!pricing) {
    return { price: 0, breakdown: { error: 1 } };
  }

  const tierMultiplier = tierMultipliers[pricing.tier];
  if (tierMultiplier === 0) {
    return { price: 0, breakdown: { tier: 0, free: 1 } };
  }

  let baseAmount = pricing.basePrice * units * tierMultiplier;
  const breakdown: Record<string, number> = {
    base: pricing.basePrice * units,
    tierMultiplier,
  };

  if (pricing.dynamicPricing) {
    baseAmount *= pricing.currentMultiplier;
    breakdown.demandMultiplier = pricing.currentMultiplier;
  }

  if (walletAddress) {
    const discount = calculateWalletDiscount(walletAddress, baseAmount);
    if (discount > 0) {
      baseAmount -= discount;
      breakdown.discount = -discount;
    }
  }

  return {
    price: Math.max(0, Math.round(baseAmount)),
    breakdown,
  };
}

function calculateWalletDiscount(walletAddress: string, baseAmount: number): number {
  let maxDiscount = 0;
  const volume = walletVolume.get(walletAddress) || 0;
  const now = Date.now();
  const rules = Array.from(discountRules.values());

  for (const rule of rules) {
    if (!rule.active) continue;
    if (rule.validUntil && now > rule.validUntil) continue;

    let applies = false;

    switch (rule.type) {
      case "volume":
        applies = rule.minVolume !== undefined && volume >= rule.minVolume;
        break;
      case "wallet_specific":
        applies = rule.walletAddresses?.includes(walletAddress) || false;
        break;
      case "loyalty":
        applies = volume > 0;
        break;
      case "promotional":
        applies = true;
        break;
    }

    if (applies) {
      const discount = baseAmount * (rule.discountPercent / 100);
      maxDiscount = Math.max(maxDiscount, discount);
    }
  }

  return maxDiscount;
}

export function recordRequest(agentId: string, walletAddress: string, amount: number): void {
  const metrics = demandMetrics.get(agentId);
  
  if (!metrics) return;

  const now = Date.now();
  
  if (now - metrics.windowStart > DEMAND_WINDOW_MS) {
    metrics.averageRequests = (metrics.averageRequests + metrics.requestCount) / 2;
    metrics.requestCount = 0;
    metrics.windowStart = now;
  }

  metrics.requestCount++;
  metrics.peakRequests = Math.max(metrics.peakRequests, metrics.requestCount);

  const currentVolume = walletVolume.get(walletAddress) || 0;
  walletVolume.set(walletAddress, currentVolume + amount);

  updateDynamicPricing(agentId);
}

function updateDynamicPricing(agentId: string): void {
  const pricing = agentPricing.get(agentId);
  const metrics = demandMetrics.get(agentId);
  
  if (!pricing || !metrics || !pricing.dynamicPricing) return;

  const now = Date.now();
  if (now - pricing.lastUpdated < PRICE_UPDATE_INTERVAL_MS) return;

  const demandRatio = metrics.averageRequests > 0 
    ? metrics.requestCount / metrics.averageRequests 
    : 1;

  let newMultiplier = pricing.currentMultiplier;

  if (demandRatio > 1.5) {
    newMultiplier = Math.min(MAX_PRICE_MULTIPLIER, pricing.currentMultiplier * 1.1);
  } else if (demandRatio < 0.5) {
    newMultiplier = Math.max(MIN_PRICE_MULTIPLIER, pricing.currentMultiplier * 0.95);
  }

  if (newMultiplier !== pricing.currentMultiplier) {
    const history = pricingHistory.get(agentId) || [];
    history.push({
      agentId,
      timestamp: now,
      price: pricing.basePrice * newMultiplier,
      multiplier: newMultiplier,
      reason: demandRatio > 1.5 ? "high_demand" : "low_demand",
    });

    if (history.length > 100) {
      history.shift();
    }

    pricing.currentMultiplier = newMultiplier;
    pricing.lastUpdated = now;
  }
}

export function updateAgentPricing(
  agentId: string,
  updates: Partial<Pick<AgentPricing, 'basePrice' | 'model' | 'tier' | 'dynamicPricing' | 'customRates'>>
): boolean {
  const pricing = agentPricing.get(agentId);
  
  if (!pricing) return false;

  if (updates.basePrice !== undefined) pricing.basePrice = updates.basePrice;
  if (updates.model !== undefined) pricing.model = updates.model;
  if (updates.tier !== undefined) pricing.tier = updates.tier;
  if (updates.dynamicPricing !== undefined) pricing.dynamicPricing = updates.dynamicPricing;
  if (updates.customRates !== undefined) pricing.customRates = updates.customRates;

  pricing.lastUpdated = Date.now();

  return true;
}

export function createDiscountRule(
  name: string,
  type: DiscountRule['type'],
  discountPercent: number,
  options: {
    minVolume?: number;
    walletAddresses?: string[];
    validUntil?: number;
  } = {}
): DiscountRule {
  const rule: DiscountRule = {
    id: `x402_discount_${Date.now()}`,
    name,
    type,
    discountPercent: Math.min(100, Math.max(0, discountPercent)),
    minVolume: options.minVolume,
    walletAddresses: options.walletAddresses,
    validUntil: options.validUntil,
    active: true,
  };

  discountRules.set(rule.id, rule);
  return rule;
}

export function deactivateDiscountRule(ruleId: string): boolean {
  const rule = discountRules.get(ruleId);
  if (!rule) return false;
  
  rule.active = false;
  return true;
}

export function getDiscountRules(): DiscountRule[] {
  return Array.from(discountRules.values());
}

export function getActiveDiscounts(walletAddress: string): DiscountRule[] {
  const now = Date.now();
  const volume = walletVolume.get(walletAddress) || 0;
  const rules = Array.from(discountRules.values());

  return rules.filter(rule => {
    if (!rule.active) return false;
    if (rule.validUntil && now > rule.validUntil) return false;

    switch (rule.type) {
      case "volume":
        return rule.minVolume !== undefined && volume >= rule.minVolume;
      case "wallet_specific":
        return rule.walletAddresses?.includes(walletAddress) || false;
      case "loyalty":
        return volume > 0;
      case "promotional":
        return true;
      default:
        return false;
    }
  });
}

export function getPricingHistory(agentId: string, limit: number = 50): PricingHistory[] {
  const history = pricingHistory.get(agentId) || [];
  return history.slice(-limit);
}

export function getDemandMetrics(agentId: string): DemandMetrics | null {
  return demandMetrics.get(agentId) || null;
}

export function getWalletVolume(walletAddress: string): number {
  return walletVolume.get(walletAddress) || 0;
}

export function getPricingMetrics(): PricingMetrics {
  const agents = Array.from(agentPricing.values());
  const multipliers = agents.map(a => a.currentMultiplier);
  const avgMultiplier = multipliers.length > 0 
    ? multipliers.reduce((a, b) => a + b, 0) / multipliers.length 
    : 1;

  return {
    totalAgents: agents.length,
    averageMultiplier: avgMultiplier,
    highDemandAgents: agents.filter(a => a.currentMultiplier > 1.5).length,
    lowDemandAgents: agents.filter(a => a.currentMultiplier < 0.8).length,
    activeDiscounts: Array.from(discountRules.values()).filter(r => r.active).length,
  };
}

export function estimateCost(
  agentId: string,
  estimatedUnits: number,
  walletAddress?: string
): { estimated: number; min: number; max: number } {
  const { price } = calculatePrice(agentId, estimatedUnits, walletAddress);
  const pricing = agentPricing.get(agentId);

  if (!pricing) {
    return { estimated: 0, min: 0, max: 0 };
  }

  const baseEstimate = price;
  const minPrice = Math.round(baseEstimate * MIN_PRICE_MULTIPLIER);
  const maxPrice = Math.round(baseEstimate * MAX_PRICE_MULTIPLIER);

  return {
    estimated: baseEstimate,
    min: minPrice,
    max: maxPrice,
  };
}

export const X402_PRICING_CONFIG = {
  version: X402_PROTOCOL_VERSION,
  network: X402_NETWORK_ID,
  basePrice: BASE_PRICE_LAMPORTS,
  minMultiplier: MIN_PRICE_MULTIPLIER,
  maxMultiplier: MAX_PRICE_MULTIPLIER,
  updateInterval: PRICE_UPDATE_INTERVAL_MS,
  demandWindow: DEMAND_WINDOW_MS,
  tiers: Object.keys(tierMultipliers),
  models: Object.keys(modelDefaults),
};
