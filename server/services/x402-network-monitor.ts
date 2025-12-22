const CONGESTION_CHECK_INTERVAL_MS = 10000;
const CONGESTION_HISTORY_SIZE = 60;
const BASE_PRIORITY_FEE = 5000;
const MAX_PRIORITY_FEE = 500000;

type CongestionLevel = "low" | "moderate" | "high" | "severe";

interface NetworkState {
  slot: number;
  blockHeight: number;
  transactionsPerSecond: number;
  avgBlockTime: number;
  congestionLevel: CongestionLevel;
  timestamp: number;
}

interface FeeEstimate {
  baseFee: number;
  priorityFee: number;
  totalFee: number;
  congestionMultiplier: number;
  estimatedConfirmationMs: number;
  confidence: number;
}

interface CongestionMetrics {
  currentLevel: CongestionLevel;
  avgTps: number;
  peakTps: number;
  avgBlockTime: number;
  feeMultiplier: number;
  lastUpdated: number;
}

const networkHistory: NetworkState[] = [];
let currentNetworkState: NetworkState | null = null;

const congestionThresholds = {
  low: { maxTps: 1500, blockTimeMs: 400, feeMultiplier: 1.0 },
  moderate: { maxTps: 3000, blockTimeMs: 500, feeMultiplier: 1.5 },
  high: { maxTps: 4000, blockTimeMs: 650, feeMultiplier: 2.5 },
  severe: { maxTps: Infinity, blockTimeMs: Infinity, feeMultiplier: 5.0 },
};

function determineCongestionLevel(tps: number, blockTimeMs: number): CongestionLevel {
  if (tps <= congestionThresholds.low.maxTps && blockTimeMs <= congestionThresholds.low.blockTimeMs) {
    return "low";
  }
  if (tps <= congestionThresholds.moderate.maxTps && blockTimeMs <= congestionThresholds.moderate.blockTimeMs) {
    return "moderate";
  }
  if (tps <= congestionThresholds.high.maxTps && blockTimeMs <= congestionThresholds.high.blockTimeMs) {
    return "high";
  }
  return "severe";
}

export function updateNetworkState(
  slot: number,
  blockHeight: number,
  transactionsPerSecond: number,
  avgBlockTime: number
): NetworkState {
  const congestionLevel = determineCongestionLevel(transactionsPerSecond, avgBlockTime);
  
  const state: NetworkState = {
    slot,
    blockHeight,
    transactionsPerSecond,
    avgBlockTime,
    congestionLevel,
    timestamp: Date.now(),
  };

  currentNetworkState = state;
  networkHistory.push(state);

  if (networkHistory.length > CONGESTION_HISTORY_SIZE) {
    networkHistory.shift();
  }

  return state;
}

export function getCurrentNetworkState(): NetworkState | null {
  return currentNetworkState;
}

export function getCongestionMetrics(): CongestionMetrics {
  if (networkHistory.length === 0) {
    return {
      currentLevel: "low",
      avgTps: 0,
      peakTps: 0,
      avgBlockTime: 400,
      feeMultiplier: 1.0,
      lastUpdated: Date.now(),
    };
  }

  const tpsValues = networkHistory.map(s => s.transactionsPerSecond);
  const avgTps = tpsValues.reduce((a, b) => a + b, 0) / tpsValues.length;
  const peakTps = Math.max(...tpsValues);

  const blockTimes = networkHistory.map(s => s.avgBlockTime);
  const avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length;

  const currentLevel = currentNetworkState?.congestionLevel || "low";
  const feeMultiplier = congestionThresholds[currentLevel].feeMultiplier;

  return {
    currentLevel,
    avgTps,
    peakTps,
    avgBlockTime,
    feeMultiplier,
    lastUpdated: currentNetworkState?.timestamp || Date.now(),
  };
}

export function estimateFee(priorityLevel: "low" | "normal" | "high" | "urgent"): FeeEstimate {
  const metrics = getCongestionMetrics();
  
  const priorityMultipliers = {
    low: 0.5,
    normal: 1.0,
    high: 2.0,
    urgent: 4.0,
  };

  const baseFee = 5000;
  const priorityFee = Math.min(
    MAX_PRIORITY_FEE,
    Math.round(BASE_PRIORITY_FEE * priorityMultipliers[priorityLevel] * metrics.feeMultiplier)
  );

  const totalFee = baseFee + priorityFee;

  const confirmationTimesByPriority = {
    low: { low: 2000, moderate: 5000, high: 15000, severe: 45000 },
    normal: { low: 800, moderate: 2000, high: 8000, severe: 25000 },
    high: { low: 500, moderate: 1000, high: 4000, severe: 12000 },
    urgent: { low: 400, moderate: 600, high: 2000, severe: 6000 },
  };

  const estimatedConfirmationMs = confirmationTimesByPriority[priorityLevel][metrics.currentLevel];

  const confidence = metrics.currentLevel === "low" ? 0.95 :
                     metrics.currentLevel === "moderate" ? 0.85 :
                     metrics.currentLevel === "high" ? 0.70 : 0.50;

  return {
    baseFee,
    priorityFee,
    totalFee,
    congestionMultiplier: metrics.feeMultiplier,
    estimatedConfirmationMs,
    confidence,
  };
}

export function shouldDelayTransaction(): { delay: boolean; waitMs: number; reason?: string } {
  if (!currentNetworkState) {
    return { delay: false, waitMs: 0 };
  }

  if (currentNetworkState.congestionLevel === "severe") {
    return { 
      delay: true, 
      waitMs: 30000, 
      reason: "Network severely congested, recommend waiting" 
    };
  }

  if (currentNetworkState.congestionLevel === "high") {
    const recentStates = networkHistory.slice(-10);
    const improvingTrend = recentStates.length >= 2 && 
      recentStates[recentStates.length - 1].transactionsPerSecond < 
      recentStates[recentStates.length - 2].transactionsPerSecond;

    if (!improvingTrend) {
      return { 
        delay: true, 
        waitMs: 10000, 
        reason: "High congestion without improvement trend" 
      };
    }
  }

  return { delay: false, waitMs: 0 };
}

export function getOptimalSubmissionWindow(): { 
  recommended: boolean; 
  windowMs: number; 
  reason: string 
} {
  const metrics = getCongestionMetrics();

  if (metrics.currentLevel === "low") {
    return { 
      recommended: true, 
      windowMs: 0, 
      reason: "Network conditions optimal" 
    };
  }

  if (metrics.currentLevel === "moderate") {
    return { 
      recommended: true, 
      windowMs: 5000, 
      reason: "Moderate congestion, slight delay recommended" 
    };
  }

  const avgCongestion = networkHistory.reduce((sum, s) => {
    const levelWeight = { low: 1, moderate: 2, high: 3, severe: 4 };
    return sum + levelWeight[s.congestionLevel];
  }, 0) / networkHistory.length;

  if (avgCongestion < 2.5) {
    return { 
      recommended: true, 
      windowMs: 15000, 
      reason: "Congestion expected to ease soon" 
    };
  }

  return { 
    recommended: false, 
    windowMs: 60000, 
    reason: "Extended congestion detected, consider waiting" 
  };
}

export function calculateDynamicRetryDelay(attemptNumber: number): number {
  const metrics = getCongestionMetrics();
  const baseDelay = 1000;
  const maxDelay = 30000;

  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
  const congestionAdjusted = exponentialDelay * metrics.feeMultiplier;
  
  const jitter = Math.random() * 0.3 * congestionAdjusted;

  return Math.min(maxDelay, Math.round(congestionAdjusted + jitter));
}

export function getNetworkHistory(limit: number = 30): NetworkState[] {
  return networkHistory.slice(-limit);
}

export function clearNetworkHistory(): void {
  networkHistory.length = 0;
  currentNetworkState = null;
}

export function isCongested(): boolean {
  return currentNetworkState?.congestionLevel === "high" || 
         currentNetworkState?.congestionLevel === "severe";
}

export function getCongestionScore(): number {
  if (!currentNetworkState) return 0;
  
  const scores: Record<CongestionLevel, number> = {
    low: 0.1,
    moderate: 0.4,
    high: 0.7,
    severe: 1.0,
  };
  
  return scores[currentNetworkState.congestionLevel];
}

export const X402_NETWORK_CONFIG = {
  checkIntervalMs: CONGESTION_CHECK_INTERVAL_MS,
  historySize: CONGESTION_HISTORY_SIZE,
  basePriorityFee: BASE_PRIORITY_FEE,
  maxPriorityFee: MAX_PRIORITY_FEE,
  thresholds: congestionThresholds,
};
