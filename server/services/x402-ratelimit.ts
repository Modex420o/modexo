import { X402_PROTOCOL_VERSION } from "@shared/x402";

const WINDOW_SIZE_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 100;
const MAX_PAYMENTS_PER_WINDOW = 20;
const MAX_EXECUTIONS_PER_WINDOW = 50;
const COOLDOWN_PERIOD_MS = 300000;

type RateLimitType = "request" | "payment" | "execution";

interface RateLimitBucket {
  walletAddress: string;
  type: RateLimitType;
  windowStart: number;
  count: number;
  blocked: boolean;
  blockedUntil?: number;
  violations: number;
}

interface UsageRecord {
  walletAddress: string;
  agentId: string;
  timestamp: number;
  type: RateLimitType;
  amount?: number;
  success: boolean;
}

interface WalletUsageStats {
  walletAddress: string;
  totalRequests: number;
  totalPayments: number;
  totalExecutions: number;
  totalSpent: number;
  lastActivity: number;
  isBlocked: boolean;
  violations: number;
}

interface GlobalUsageMetrics {
  totalRequests: number;
  totalPayments: number;
  totalExecutions: number;
  blockedWallets: number;
  totalViolations: number;
  requestsPerMinute: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const usageHistory: UsageRecord[] = [];
const walletStats = new Map<string, WalletUsageStats>();
const globalMetrics: GlobalUsageMetrics = {
  totalRequests: 0,
  totalPayments: 0,
  totalExecutions: 0,
  blockedWallets: 0,
  totalViolations: 0,
  requestsPerMinute: 0,
};

const MAX_HISTORY_SIZE = 10000;

function getBucketKey(walletAddress: string, type: RateLimitType): string {
  return `${walletAddress}:${type}`;
}

function getMaxForType(type: RateLimitType): number {
  switch (type) {
    case "request": return MAX_REQUESTS_PER_WINDOW;
    case "payment": return MAX_PAYMENTS_PER_WINDOW;
    case "execution": return MAX_EXECUTIONS_PER_WINDOW;
  }
}

export function checkRateLimit(
  walletAddress: string,
  type: RateLimitType
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = getBucketKey(walletAddress, type);
  const now = Date.now();
  let bucket = rateLimitBuckets.get(key);

  if (bucket?.blocked && bucket.blockedUntil) {
    if (now < bucket.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: bucket.blockedUntil - now,
      };
    }
    bucket.blocked = false;
    bucket.blockedUntil = undefined;
  }

  if (!bucket || now - bucket.windowStart >= WINDOW_SIZE_MS) {
    bucket = {
      walletAddress,
      type,
      windowStart: now,
      count: 0,
      blocked: false,
      violations: bucket?.violations || 0,
    };
    rateLimitBuckets.set(key, bucket);
  }

  const max = getMaxForType(type);
  const remaining = Math.max(0, max - bucket.count);
  const resetIn = WINDOW_SIZE_MS - (now - bucket.windowStart);

  return {
    allowed: bucket.count < max,
    remaining,
    resetIn,
  };
}

export function recordUsage(
  walletAddress: string,
  agentId: string,
  type: RateLimitType,
  amount?: number,
  success: boolean = true
): boolean {
  const now = Date.now();
  const key = getBucketKey(walletAddress, type);
  let bucket = rateLimitBuckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_SIZE_MS) {
    bucket = {
      walletAddress,
      type,
      windowStart: now,
      count: 0,
      blocked: false,
      violations: bucket?.violations || 0,
    };
    rateLimitBuckets.set(key, bucket);
  }

  const max = getMaxForType(type);
  
  if (bucket.count >= max) {
    bucket.violations++;
    globalMetrics.totalViolations++;
    
    if (bucket.violations >= 3) {
      bucket.blocked = true;
      bucket.blockedUntil = now + COOLDOWN_PERIOD_MS;
      globalMetrics.blockedWallets++;
    }
    
    return false;
  }

  bucket.count++;

  const record: UsageRecord = {
    walletAddress,
    agentId,
    timestamp: now,
    type,
    amount,
    success,
  };
  
  usageHistory.push(record);
  if (usageHistory.length > MAX_HISTORY_SIZE) {
    usageHistory.shift();
  }

  updateWalletStats(walletAddress, type, amount, success);
  updateGlobalMetrics(type);

  return true;
}

function updateWalletStats(
  walletAddress: string,
  type: RateLimitType,
  amount?: number,
  success?: boolean
): void {
  let stats = walletStats.get(walletAddress);
  
  if (!stats) {
    stats = {
      walletAddress,
      totalRequests: 0,
      totalPayments: 0,
      totalExecutions: 0,
      totalSpent: 0,
      lastActivity: Date.now(),
      isBlocked: false,
      violations: 0,
    };
    walletStats.set(walletAddress, stats);
  }

  stats.lastActivity = Date.now();
  
  switch (type) {
    case "request":
      stats.totalRequests++;
      break;
    case "payment":
      stats.totalPayments++;
      if (amount) stats.totalSpent += amount;
      break;
    case "execution":
      stats.totalExecutions++;
      break;
  }
}

function updateGlobalMetrics(type: RateLimitType): void {
  switch (type) {
    case "request":
      globalMetrics.totalRequests++;
      break;
    case "payment":
      globalMetrics.totalPayments++;
      break;
    case "execution":
      globalMetrics.totalExecutions++;
      break;
  }

  const oneMinuteAgo = Date.now() - 60000;
  const recentRequests = usageHistory.filter(
    r => r.timestamp > oneMinuteAgo && r.type === "request"
  ).length;
  globalMetrics.requestsPerMinute = recentRequests;
}

export function getWalletUsageStats(walletAddress: string): WalletUsageStats | null {
  return walletStats.get(walletAddress) || null;
}

export function getGlobalMetrics(): GlobalUsageMetrics {
  return { ...globalMetrics };
}

export function isWalletBlocked(walletAddress: string): boolean {
  for (const type of ["request", "payment", "execution"] as RateLimitType[]) {
    const key = getBucketKey(walletAddress, type);
    const bucket = rateLimitBuckets.get(key);
    if (bucket?.blocked) return true;
  }
  return false;
}

export function unblockWallet(walletAddress: string): boolean {
  let unblocked = false;
  
  for (const type of ["request", "payment", "execution"] as RateLimitType[]) {
    const key = getBucketKey(walletAddress, type);
    const bucket = rateLimitBuckets.get(key);
    if (bucket?.blocked) {
      bucket.blocked = false;
      bucket.blockedUntil = undefined;
      bucket.violations = 0;
      unblocked = true;
    }
  }

  if (unblocked) {
    globalMetrics.blockedWallets = Math.max(0, globalMetrics.blockedWallets - 1);
    const stats = walletStats.get(walletAddress);
    if (stats) {
      stats.isBlocked = false;
      stats.violations = 0;
    }
  }

  return unblocked;
}

export function getRecentUsage(
  walletAddress?: string,
  type?: RateLimitType,
  limit: number = 100
): UsageRecord[] {
  let records = usageHistory;
  
  if (walletAddress) {
    records = records.filter(r => r.walletAddress === walletAddress);
  }
  
  if (type) {
    records = records.filter(r => r.type === type);
  }
  
  return records.slice(-limit);
}

export function getTopUsers(limit: number = 10): WalletUsageStats[] {
  return Array.from(walletStats.values())
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, limit);
}

export function cleanupOldData(maxAgeMs: number = 3600000): number {
  const cutoff = Date.now() - maxAgeMs;
  let cleaned = 0;
  const entries = Array.from(rateLimitBuckets.entries());

  for (const [key, bucket] of entries) {
    if (bucket.windowStart < cutoff && !bucket.blocked) {
      rateLimitBuckets.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

export const X402_RATELIMIT_CONFIG = {
  version: X402_PROTOCOL_VERSION,
  windowSize: WINDOW_SIZE_MS,
  maxRequests: MAX_REQUESTS_PER_WINDOW,
  maxPayments: MAX_PAYMENTS_PER_WINDOW,
  maxExecutions: MAX_EXECUTIONS_PER_WINDOW,
  cooldownPeriod: COOLDOWN_PERIOD_MS,
};
