export interface PortfolioHolding {
  tokenAddress: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  balance: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
  priceChange24h: number;
  allocation: number;
}

export interface PortfolioAnalysis {
  walletAddress: string;
  totalValueUsd: number;
  totalPnlUsd: number;
  totalPnlPercent: number;
  solBalance: number;
  tokenCount: number;
  riskScore: number;
  diversificationScore: number;
  holdings: PortfolioHolding[];
  allocationByCategory: { category: string; value: number; percent: number }[];
  performanceHistory: { timestamp: number; valueUsd: number }[];
}

export interface PortfolioTransaction {
  signature: string;
  type: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  timestamp: number;
}

export function calculateRiskScore(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
  if (totalValue === 0) return 100;

  let riskScore = 50;
  
  const topHoldingAllocation = Math.max(...holdings.map(h => h.allocation));
  if (topHoldingAllocation > 50) riskScore += 20;
  else if (topHoldingAllocation > 30) riskScore += 10;

  const volatileHoldings = holdings.filter(h => Math.abs(h.priceChange24h) > 20);
  riskScore += volatileHoldings.length * 5;

  if (holdings.length < 3) riskScore += 15;
  else if (holdings.length > 10) riskScore -= 10;

  return Math.max(0, Math.min(100, riskScore));
}

export function calculateDiversificationScore(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 0;
  if (holdings.length === 1) return 10;

  const allocations = holdings.map(h => h.allocation / 100);
  const hhi = allocations.reduce((sum, a) => sum + a * a, 0);
  
  const diversificationScore = Math.round((1 - hhi) * 100);
  return Math.max(0, Math.min(100, diversificationScore));
}

export const MIN_TRADE_SIZE_USD = 10;
