export interface SmartEntryAnalysis {
  tokenAddress: string;
  symbol: string;
  name: string;
  currentPrice: number;
  imageUrl: string | null;
  entryZones: {
    optimal: number;
    aggressive: number;
    conservative: number;
  };
  signals: {
    type: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    reasons: string[];
  };
  volumeAnalysis: {
    h1Volume: number;
    h24Volume: number;
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    buyPressure: number;
  };
  momentum: {
    score: number;
    trend: 'up' | 'down' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
  };
  support: {
    level1: number;
    level2: number;
  };
  recommendation: 'strong_buy' | 'buy' | 'wait' | 'avoid';
  confidence: number;
  liquidityUsd: number;
  marketCap: number;
}

export async function analyzeSmartEntry(tokenAddress: string, getTokenPairs: Function): Promise<SmartEntryAnalysis | null> {
  const pairs = await getTokenPairs(tokenAddress);
  if (!pairs.length) return null;

  const pair = pairs.sort((a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  const currentPrice = parseFloat(pair.priceUsd) || 0;
  if (currentPrice === 0) return null;

  const priceChange5m = pair.priceChange?.m5 ?? 0;
  const priceChange1h = pair.priceChange?.h1 ?? 0;
  const priceChange6h = pair.priceChange?.h6 ?? 0;
  const priceChange24h = pair.priceChange?.h24 ?? 0;
  
  const volumeH1 = pair.volume?.h1 ?? 0;
  const volumeH24 = pair.volume?.h24 ?? 0;
  const buysH1 = pair.txns?.h1?.buys ?? 0;
  const sellsH1 = pair.txns?.h1?.sells ?? 0;
  
  const liquidityUsd = pair.liquidity?.usd ?? 0;
  const marketCap = pair.marketCap ?? pair.fdv ?? 0;

  const avgHourlyVolume = volumeH24 / 24;
  const volumeTrend: 'increasing' | 'decreasing' | 'stable' = 
    volumeH1 > avgHourlyVolume * 1.5 ? 'increasing' :
    volumeH1 < avgHourlyVolume * 0.5 ? 'decreasing' : 'stable';

  const totalTxnsH1 = buysH1 + sellsH1;
  const buyPressure = totalTxnsH1 > 0 ? (buysH1 / totalTxnsH1) * 100 : 50;

  let momentumScore = 50;
  if (priceChange5m > 0) momentumScore += Math.min(priceChange5m * 2, 15);
  if (priceChange1h > 0) momentumScore += Math.min(priceChange1h, 15);
  if (priceChange6h > 0) momentumScore += Math.min(priceChange6h * 0.5, 10);
  if (priceChange5m < 0) momentumScore += Math.max(priceChange5m * 2, -15);
  if (priceChange1h < 0) momentumScore += Math.max(priceChange1h, -15);
  if (priceChange6h < 0) momentumScore += Math.max(priceChange6h * 0.5, -10);
  if (buyPressure > 60) momentumScore += 5;
  if (volumeTrend === 'increasing') momentumScore += 5;
  momentumScore = Math.max(0, Math.min(100, momentumScore));

  const momentumTrend: 'up' | 'down' | 'sideways' = 
    priceChange1h > 2 ? 'up' : priceChange1h < -2 ? 'down' : 'sideways';
  const momentumStrength: 'strong' | 'moderate' | 'weak' = 
    Math.abs(priceChange1h) > 5 ? 'strong' : Math.abs(priceChange1h) > 2 ? 'moderate' : 'weak';

  const reasons: string[] = [];
  let signalStrength = 50;
  
  if (priceChange1h < -3 && priceChange5m > 0) {
    reasons.push('Bounce detected after dip');
    signalStrength += 15;
  }
  if (buyPressure > 65) {
    reasons.push('Strong buy pressure');
    signalStrength += 10;
  }
  if (volumeTrend === 'increasing') {
    reasons.push('Volume increasing');
    signalStrength += 10;
  }
  if (priceChange24h < -10 && priceChange1h > 0) {
    reasons.push('Potential reversal forming');
    signalStrength += 15;
  }
  if (priceChange5m > 5) {
    reasons.push('Strong short-term momentum');
    signalStrength += 5;
  }
  if (priceChange1h > 10) {
    reasons.push('High volatility - caution advised');
    signalStrength -= 10;
  }
  if (sellsH1 > buysH1 * 1.5) {
    reasons.push('Sell pressure detected');
    signalStrength -= 15;
  }
  if (liquidityUsd < 10000) {
    reasons.push('Low liquidity warning');
    signalStrength -= 20;
  }
  
  signalStrength = Math.max(0, Math.min(100, signalStrength));
  const signalType: 'bullish' | 'bearish' | 'neutral' = 
    signalStrength > 60 ? 'bullish' : signalStrength < 40 ? 'bearish' : 'neutral';

  const support1 = currentPrice * (1 - Math.abs(priceChange1h) / 100 - 0.02);
  const support2 = currentPrice * (1 - Math.abs(priceChange6h) / 100 - 0.05);

  const optimalEntry = currentPrice * 0.97;
  const aggressiveEntry = currentPrice * 0.99;
  const conservativeEntry = currentPrice * 0.93;

  let recommendation: 'strong_buy' | 'buy' | 'wait' | 'avoid' = 'wait';
  if (signalStrength > 70 && buyPressure > 55 && liquidityUsd > 50000) {
    recommendation = 'strong_buy';
  } else if (signalStrength > 55 && buyPressure > 50) {
    recommendation = 'buy';
  } else if (signalStrength < 35 || liquidityUsd < 10000) {
    recommendation = 'avoid';
  }

  const confidence = Math.round((signalStrength * 0.4 + momentumScore * 0.3 + Math.min(liquidityUsd / 1000, 30)) * 10) / 10;

  return {
    tokenAddress: pair.baseToken?.address ?? tokenAddress,
    symbol: pair.baseToken?.symbol ?? '???',
    name: pair.baseToken?.name ?? 'Unknown',
    currentPrice,
    imageUrl: pair.info?.imageUrl ?? null,
    entryZones: {
      optimal: Math.round(optimalEntry * 1e9) / 1e9,
      aggressive: Math.round(aggressiveEntry * 1e9) / 1e9,
      conservative: Math.round(conservativeEntry * 1e9) / 1e9,
    },
    signals: {
      type: signalType,
      strength: signalStrength,
      reasons: reasons.length > 0 ? reasons : ['No significant signals detected'],
    },
    volumeAnalysis: {
      h1Volume: volumeH1,
      h24Volume: volumeH24,
      volumeTrend,
      buyPressure: Math.round(buyPressure * 10) / 10,
    },
    momentum: {
      score: momentumScore,
      trend: momentumTrend,
      strength: momentumStrength,
    },
    support: {
      level1: Math.round(support1 * 1e9) / 1e9,
      level2: Math.round(support2 * 1e9) / 1e9,
    },
    recommendation,
    confidence: Math.min(confidence, 100),
    liquidityUsd,
    marketCap,
  };
}
