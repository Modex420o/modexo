interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  description: string;
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }[];
  nativeTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
  accountData: {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: {
      userAccount: string;
      tokenAccount: string;
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
    }[];
  }[];
  events: {
    swap?: {
      nativeInput?: { account: string; amount: string };
      nativeOutput?: { account: string; amount: string };
      tokenInputs: { userAccount: string; tokenAccount: string; mint: string; rawTokenAmount: { tokenAmount: string; decimals: number } }[];
      tokenOutputs: { userAccount: string; tokenAccount: string; mint: string; rawTokenAmount: { tokenAmount: string; decimals: number } }[];
      innerSwaps?: {
        tokenInputs: { fromUserAccount: string; toUserAccount: string; tokenAmount: number; mint: string }[];
        tokenOutputs: { fromUserAccount: string; toUserAccount: string; tokenAmount: number; mint: string }[];
        programInfo: { source: string; account: string; programName: string };
      }[];
    };
  };
}

interface WhaleTrade {
  walletAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  txnSignature: string;
  side: 'buy' | 'sell';
  sizeUsd: number;
  sizeNative: number;
  priceUsd: number;
  blockTime: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

const MIN_TRADE_SIZE_USD = 1000;

function getHeliusApiKey(): string | undefined {
  return process.env.HELIUS_API_KEY;
}

const KNOWN_STABLECOINS: Record<string, { symbol: string; decimals: number; price: number }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6, price: 1 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6, price: 1 },
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9, price: 0 },
};

let solPrice = 200;

async function fetchSolPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    solPrice = data.solana?.usd || 200;
    return solPrice;
  } catch {
    return solPrice;
  }
}

fetchSolPrice();
setInterval(fetchSolPrice, 60000);

export async function getRecentWhaleTrades(tokenAddresses: string[]): Promise<WhaleTrade[]> {
  const apiKey = getHeliusApiKey();
  if (!apiKey) {
    return [];
  }

  const cacheKey = `whale-trades:${tokenAddresses.slice(0, 5).join(',')}`;
  const cached = getCached<WhaleTrade[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const allTrades: WhaleTrade[] = [];

  for (const tokenAddress of tokenAddresses.slice(0, 5)) {
    try {
      const trades = await getTokenRecentTrades(tokenAddress);
      allTrades.push(...trades);
    } catch (error) {
      console.error(`Error fetching trades for ${tokenAddress}:`, error);
    }
  }

  const sortedTrades = allTrades
    .sort((a, b) => b.blockTime - a.blockTime)
    .slice(0, 50);

  setCache(cacheKey, sortedTrades);
  return sortedTrades;
}

async function getTokenRecentTrades(tokenAddress: string): Promise<WhaleTrade[]> {
  const apiKey = getHeliusApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=${apiKey}&type=SWAP&limit=100`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Helius API error: ${response.status} - ${errorText}`);
      return [];
    }

    const transactions: HeliusTransaction[] = await response.json();
    const whaleTrades: WhaleTrade[] = [];

    for (const tx of transactions) {
      const trade = parseSwapTransaction(tx, tokenAddress);
      if (trade && trade.sizeUsd >= MIN_TRADE_SIZE_USD) {
        whaleTrades.push(trade);
      }
    }

    return whaleTrades;
  } catch (error) {
    console.error('Error fetching token trades:', error);
    return [];
  }
}

function parseSwapTransaction(tx: HeliusTransaction, targetToken: string): WhaleTrade | null {
  if (tx.type !== 'SWAP') return null;
  
  const tokenTransfers = tx.tokenTransfers || [];
  const nativeTransfers = tx.nativeTransfers || [];
  
  if (tokenTransfers.length === 0) return null;

  let walletAddress = tx.feePayer;
  let side: 'buy' | 'sell' = 'buy';
  let tokenAmount = 0;
  let usdAmount = 0;
  let tokenSymbol = 'UNKNOWN';

  const targetTransfer = tokenTransfers.find(t => t.mint === targetToken);
  if (!targetTransfer) return null;
  
  tokenAmount = targetTransfer.tokenAmount || 0;
  
  if (targetTransfer.toUserAccount) {
    side = 'buy';
    walletAddress = targetTransfer.toUserAccount;
  } else if (targetTransfer.fromUserAccount) {
    side = 'sell';
    walletAddress = targetTransfer.fromUserAccount;
  } else {
    walletAddress = tx.feePayer;
  }

  for (const transfer of tokenTransfers) {
    const stable = KNOWN_STABLECOINS[transfer.mint];
    if (stable && transfer.mint !== targetToken) {
      const amount = transfer.tokenAmount || 0;
      usdAmount = Math.max(usdAmount, amount * stable.price);
    }
  }

  if (usdAmount === 0) {
    for (const transfer of nativeTransfers) {
      const solAmount = Math.abs(transfer.amount) / 1e9;
      if (solAmount > 0.01) {
        usdAmount = Math.max(usdAmount, solAmount * solPrice);
      }
    }
  }

  const priceUsd = tokenAmount > 0 ? usdAmount / tokenAmount : 0;

  return {
    walletAddress,
    tokenAddress: targetToken,
    tokenSymbol,
    txnSignature: tx.signature,
    side,
    sizeUsd: Math.round(usdAmount * 100) / 100,
    sizeNative: tokenAmount,
    priceUsd,
    blockTime: tx.timestamp,
  };
}

export async function getWalletRecentSwaps(walletAddress: string): Promise<WhaleTrade[]> {
  const apiKey = getHeliusApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&type=SWAP&limit=50`;
    
    const response = await fetch(url);
    if (!response.ok) return [];

    const transactions: HeliusTransaction[] = await response.json();
    const trades: WhaleTrade[] = [];

    for (const tx of transactions) {
      if (!tx.events?.swap) continue;

      const swap = tx.events.swap;
      const tokenOutputs = swap.tokenOutputs || [];
      
      if (tokenOutputs.length > 0) {
        const output = tokenOutputs[0];
        let usdAmount = 0;

        if (swap.nativeInput) {
          const solAmount = parseInt(swap.nativeInput.amount) / 1e9;
          usdAmount = solAmount * solPrice;
        }

        const stableInput = (swap.tokenInputs || []).find(t => KNOWN_STABLECOINS[t.mint]);
        if (stableInput) {
          const stable = KNOWN_STABLECOINS[stableInput.mint];
          usdAmount = parseInt(stableInput.rawTokenAmount?.tokenAmount || '0') / Math.pow(10, stable.decimals);
        }

        if (usdAmount >= MIN_TRADE_SIZE_USD) {
          const decimals = output.rawTokenAmount?.decimals || 9;
          const tokenAmount = parseInt(output.rawTokenAmount?.tokenAmount || '0') / Math.pow(10, decimals);

          trades.push({
            walletAddress,
            tokenAddress: output.mint,
            tokenSymbol: 'TOKEN',
            txnSignature: tx.signature,
            side: 'buy',
            sizeUsd: Math.round(usdAmount * 100) / 100,
            sizeNative: tokenAmount,
            priceUsd: tokenAmount > 0 ? usdAmount / tokenAmount : 0,
            blockTime: tx.timestamp,
          });
        }
      }
    }

    return trades;
  } catch (error) {
    console.error('Error fetching wallet swaps:', error);
    return [];
  }
}

export function isHeliusConfigured(): boolean {
  return !!getHeliusApiKey();
}
