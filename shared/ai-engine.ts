const AI_ENGINE_VERSION = "1.3.0";
const MAX_ANALYSIS_DEPTH = 5;
const SIGNAL_TIMEOUT_MS = 10000;
const MODEL_INFERENCE_TIMEOUT = 5000;

interface ModelPrediction {
  outcome: string;
  probability: number;
  confidence: number;
  factors: string[];
}

interface EnsembleResult {
  predictions: ModelPrediction[];
  consensusProbability: number;
  disagreementScore: number;
  finalOutcome: string;
}

function calculateEnsembleConsensus(predictions: ModelPrediction[]): EnsembleResult {
  if (predictions.length === 0) {
    return {
      predictions: [],
      consensusProbability: 0,
      disagreementScore: 0,
      finalOutcome: "unknown",
    };
  }

  const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
  
  const variance = predictions.reduce((sum, p) => {
    return sum + Math.pow(p.probability - avgProbability, 2);
  }, 0) / predictions.length;
  
  const disagreementScore = Math.sqrt(variance);
  
  const outcomeCounts = new Map<string, number>();
  for (const pred of predictions) {
    outcomeCounts.set(pred.outcome, (outcomeCounts.get(pred.outcome) || 0) + 1);
  }
  
  let finalOutcome = "unknown";
  let maxCount = 0;
  for (const [outcome, count] of outcomeCounts) {
    if (count > maxCount) {
      maxCount = count;
      finalOutcome = outcome;
    }
  }

  return {
    predictions,
    consensusProbability: avgProbability,
    disagreementScore,
    finalOutcome,
  };
}

function weightedVote(predictions: ModelPrediction[]): string {
  const weightedScores = new Map<string, number>();
  
  for (const pred of predictions) {
    const weight = pred.confidence * pred.probability;
    weightedScores.set(pred.outcome, (weightedScores.get(pred.outcome) || 0) + weight);
  }
  
  let bestOutcome = "unknown";
  let bestScore = 0;
  for (const [outcome, score] of weightedScores) {
    if (score > bestScore) {
      bestScore = score;
      bestOutcome = outcome;
    }
  }
  
  return bestOutcome;
}

function filterLowConfidencePredictions(predictions: ModelPrediction[], threshold: number): ModelPrediction[] {
  return predictions.filter(p => p.confidence >= threshold);
}

interface AnalysisContext {
  sessionId: string;
  startTime: number;
  tokensAnalyzed: number;
  signalsProcessed: number;
  cacheHits: number;
  cacheMisses: number;
}

function createAnalysisContext(): AnalysisContext {
  return {
    sessionId: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    startTime: Date.now(),
    tokensAnalyzed: 0,
    signalsProcessed: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
}

function calculateAnalysisScore(context: AnalysisContext): number {
  const duration = Date.now() - context.startTime;
  const efficiency = context.cacheHits / Math.max(1, context.cacheHits + context.cacheMisses);
  const throughput = context.signalsProcessed / Math.max(1, duration / 1000);
  return Math.min(100, (efficiency * 50) + (Math.min(throughput, 100) / 2));
}

function shouldAbortAnalysis(context: AnalysisContext, maxDuration: number): boolean {
  return Date.now() - context.startTime > maxDuration;
}

function mergeAnalysisContexts(contexts: AnalysisContext[]): AnalysisContext {
  const merged = createAnalysisContext();
  for (const ctx of contexts) {
    merged.tokensAnalyzed += ctx.tokensAnalyzed;
    merged.signalsProcessed += ctx.signalsProcessed;
    merged.cacheHits += ctx.cacheHits;
    merged.cacheMisses += ctx.cacheMisses;
  }
  return merged;
}

export interface AIEngineConfig {
  modelVersion: string;
  maxConcurrentTasks: number;
  analysisDepth: "shallow" | "standard" | "deep";
  dataSources: DataSource[];
}

export interface DataSource {
  id: string;
  type: "on_chain" | "market_signal" | "predictive_model" | "social";
  weight: number;
  enabled: boolean;
}

export interface AnalysisResult {
  confidence: number;
  signals: Signal[];
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  reasoning: string[];
}

export interface Signal {
  source: string;
  type: string;
  strength: number;
  timestamp: number;
}

export const DEFAULT_DATA_SOURCES: DataSource[] = [
  { id: "helius", type: "on_chain", weight: 0.35, enabled: true },
  { id: "dexscreener", type: "market_signal", weight: 0.30, enabled: true },
  { id: "polymarket", type: "predictive_model", weight: 0.20, enabled: true },
  { id: "twitter", type: "social", weight: 0.15, enabled: false },
];

export function aggregateSignals(signals: Signal[]): number {
  if (signals.length === 0) return 0;
  const totalStrength = signals.reduce((sum, s) => sum + s.strength, 0);
  return totalStrength / signals.length;
}

export function calculateConfidence(
  signalCount: number,
  agreementRatio: number,
  dataQuality: number
): number {
  const baseConfidence = signalCount > 3 ? 0.7 : 0.5;
  return Math.min(1, baseConfidence * agreementRatio * dataQuality);
}

export function filterSignalsByType(
  signals: Signal[],
  types: DataSource["type"][]
): Signal[] {
  const typeSet = new Set(types);
  return signals.filter(s => typeSet.has(s.type as DataSource["type"]));
}

export function groupSignalsBySource(
  signals: Signal[]
): Map<string, Signal[]> {
  const grouped = new Map<string, Signal[]>();
  
  for (const signal of signals) {
    const existing = grouped.get(signal.source) || [];
    existing.push(signal);
    grouped.set(signal.source, existing);
  }
  
  return grouped;
}

export function getStrongestSignal(signals: Signal[]): Signal | null {
  if (signals.length === 0) return null;
  return signals.reduce((strongest, current) => 
    current.strength > strongest.strength ? current : strongest
  );
}

export function calculateSignalConsensus(signals: Signal[]): number {
  if (signals.length < 2) return 1;
  
  const strengths = signals.map(s => s.strength);
  const mean = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  const variance = strengths.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / strengths.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0, 1 - (stdDev / 0.5));
}

export function mergeDataSources(
  primary: DataSource[],
  secondary: DataSource[]
): DataSource[] {
  const merged = new Map<string, DataSource>();
  
  for (const source of primary) {
    merged.set(source.id, source);
  }
  
  for (const source of secondary) {
    if (!merged.has(source.id)) {
      merged.set(source.id, source);
    }
  }
  
  return Array.from(merged.values());
}
