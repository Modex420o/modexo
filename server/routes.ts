import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  getTokenPairs, 
  searchPairs, 
  getTrendingSolana, 
  calculateSafetyScore,
  pairToTokenSnapshot 
} from "./services/dexscreener";
import { getRecentWhaleTrades, isHeliusConfigured, getWalletRecentSwaps } from "./services/helius";
import { getTopTraderPositions, getCurrentMode, setMode, getPredictionEntries, type PredictionMode } from "./services/polymarket";
import { insertTrackedWalletSchema, insertUserWatchlistSchema } from "@shared/schema";

const ROUTES_VERSION = "1.2.0";
const MAX_REQUEST_SIZE = 1024 * 100;
const REQUEST_TIMEOUT_MS = 30000;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 100;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(clientId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    rateLimitMap.set(clientId, entry);
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

function getClientId(req: Request): string {
  return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
}

function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [clientId, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(clientId);
    }
  }
}

setInterval(cleanupRateLimits, RATE_LIMIT_WINDOW_MS);

interface RequestLog {
  method: string;
  path: string;
  timestamp: number;
  duration?: number;
  statusCode?: number;
  clientId?: string;
}

const requestLogs: RequestLog[] = [];
const MAX_LOGS = 1000;

function logRequest(log: RequestLog): void {
  requestLogs.push(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift();
  }
}

export function getRecentRequests(limit: number = 100): RequestLog[] {
  return requestLogs.slice(-limit);
}

function validateSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function sanitizeQueryParam(param: unknown): string {
  if (typeof param !== "string") return "";
  return param.trim().slice(0, 200);
}

function parseIntParam(param: unknown, defaultValue: number, max: number): number {
  if (typeof param !== "string") return defaultValue;
  const parsed = parseInt(param, 10);
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  return Math.min(parsed, max);
}

function createErrorResponse(message: string, code: string): { error: string; code: string } {
  return { error: message, code };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/tokens", async (req, res) => {
    try {
      const { search, limit = "50" } = req.query;
      
      if (search && typeof search === "string") {
        const pairs = await searchPairs(search);
        const tokens = pairs.slice(0, parseInt(limit as string)).map(pairToTokenSnapshot);
        return res.json(tokens);
      }

      const snapshots = await storage.getTokenSnapshots(parseInt(limit as string));
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });

  app.get("/api/tokens/trending", async (req, res) => {
    try {
      const pairs = await getTrendingSolana();
      const tokens = pairs.map(pairToTokenSnapshot);
      
      for (const token of tokens) {
        await storage.upsertTokenSnapshot(token);
      }
      
      res.json(tokens);
    } catch (error) {
      console.error("Error fetching trending:", error);
      res.status(500).json({ error: "Failed to fetch trending tokens" });
    }
  });

  app.get("/api/tokens/:tokenAddress", async (req, res) => {
    try {
      const { tokenAddress } = req.params;
      const pairs = await getTokenPairs(tokenAddress);
      
      if (!pairs.length) {
        return res.status(404).json({ error: "Token not found" });
      }

      const token = pairToTokenSnapshot(pairs[0]);
      await storage.upsertTokenSnapshot(token);
      
      res.json({ token, allPairs: pairs });
    } catch (error) {
      console.error("Error fetching token:", error);
      res.status(500).json({ error: "Failed to fetch token" });
    }
  });

  app.get("/api/tokens/:tokenAddress/safety", async (req, res) => {
    try {
      const { tokenAddress } = req.params;
      const pairs = await getTokenPairs(tokenAddress);
      
      if (!pairs.length) {
        return res.status(404).json({ error: "Token not found" });
      }

      const safety = calculateSafetyScore(pairs[0]);
      res.json(safety);
    } catch (error) {
      console.error("Error calculating safety:", error);
      res.status(500).json({ error: "Failed to calculate safety score" });
    }
  });

  app.get("/api/polymarket/positions", async (_req, res) => {
    try {
      const positions = await getTopTraderPositions();
      res.json(positions);
    } catch (error) {
      console.error("Error fetching Polymarket positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.get("/api/prediction/mode", (_req, res) => {
    try {
      const mode = getCurrentMode();
      res.json(mode);
    } catch (error) {
      console.error("Error fetching prediction mode:", error);
      res.status(500).json({ error: "Failed to fetch prediction mode" });
    }
  });

  app.post("/api/prediction/mode", (req, res) => {
    try {
      const { mode } = req.body;
      if (mode !== "safe" && mode !== "risky") {
        return res.status(400).json({ error: "Invalid mode. Must be 'safe' or 'risky'" });
      }
      const newMode = setMode(mode as PredictionMode);
      res.json(newMode);
    } catch (error) {
      console.error("Error setting prediction mode:", error);
      res.status(500).json({ error: "Failed to set prediction mode" });
    }
  });

  app.get("/api/prediction/entries", async (_req, res) => {
    try {
      const entries = await getPredictionEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching prediction entries:", error);
      res.status(500).json({ error: "Failed to fetch prediction entries" });
    }
  });

  app.get("/api/wallets", async (_req, res) => {
    try {
      const wallets = await storage.getTrackedWallets();
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  app.post("/api/wallets", async (req, res) => {
    try {
      const parseResult = insertTrackedWalletSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid wallet data", details: parseResult.error.errors });
      }

      const existing = await storage.getTrackedWallet(parseResult.data.address);
      if (existing) {
        return res.status(409).json({ error: "Wallet already tracked" });
      }

      const wallet = await storage.createTrackedWallet(parseResult.data);
      res.status(201).json(wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  app.delete("/api/wallets/:id", async (req, res) => {
    try {
      await storage.deleteTrackedWallet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting wallet:", error);
      res.status(500).json({ error: "Failed to delete wallet" });
    }
  });

  app.get("/api/wallets/:address/activity", async (req, res) => {
    try {
      const { limit = "50" } = req.query;
      const activity = await storage.getWalletActivity(req.params.address, parseInt(limit as string));
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch wallet activity" });
    }
  });

  app.get("/api/whales", async (req, res) => {
    try {
      const { limit = "50" } = req.query;
      
      if (isHeliusConfigured()) {
        const trendingPairs = await getTrendingSolana();
        const tokenAddresses = trendingPairs.map(p => p.baseToken?.address).filter(Boolean) as string[];
        
        if (tokenAddresses.length > 0) {
          const whaleTrades = await getRecentWhaleTrades(tokenAddresses);
          
          const tradesWithSymbols = whaleTrades.map(trade => {
            const pair = trendingPairs.find(p => p.baseToken?.address === trade.tokenAddress);
            return {
              ...trade,
              tokenSymbol: pair?.baseToken?.symbol || trade.tokenSymbol,
              id: trade.txnSignature.slice(0, 16),
            };
          });
          
          return res.json(tradesWithSymbols.slice(0, parseInt(limit as string)));
        }
      }
      
      const trades = await storage.getWhaleTrades(parseInt(limit as string));
      res.json(trades);
    } catch (error) {
      console.error("Error fetching whale trades:", error);
      res.status(500).json({ error: "Failed to fetch whale trades" });
    }
  });

  app.get("/api/watchlist", async (_req, res) => {
    try {
      const watchlist = await storage.getUserWatchlist();
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const parseResult = insertUserWatchlistSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid watchlist data", details: parseResult.error.errors });
      }

      const item = await storage.addToWatchlist(parseResult.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:tokenAddress", async (req, res) => {
    try {
      await storage.removeFromWatchlist(req.params.tokenAddress);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  app.get("/api/insiders", async (_req, res) => {
    try {
      const relations = await storage.getInsiderRelations();
      res.json(relations);
    } catch (error) {
      console.error("Error fetching insiders:", error);
      res.status(500).json({ error: "Failed to fetch insider relations" });
    }
  });

  app.post("/api/github/check-x402", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "GitHub URL is required" });
      }

      const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (!githubMatch) {
        return res.status(400).json({ error: "Invalid GitHub URL format" });
      }

      const [, owner, repo] = githubMatch;
      const cleanRepo = repo.replace(/\.git$/, '');
      const x402Patterns = ['x402', 'payment', 'protocol'];
      const foundX402Files: string[] = [];

      const scanDirectory = async (path: string = ''): Promise<void> => {
        const contentsUrl = path 
          ? `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${path}`
          : `https://api.github.com/repos/${owner}/${cleanRepo}/contents`;
        
        const response = await fetch(contentsUrl, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'MODEXO-x402-Checker' }
        });
        
        if (!response.ok) return;
        
        const contents = await response.json();
        if (!Array.isArray(contents)) return;
        
        for (const item of contents) {
          if (item.name.toLowerCase().includes('x402')) {
            foundX402Files.push(item.path || item.name);
          }
          if (item.type === 'dir' && ['server', 'src', 'lib', 'services'].includes(item.name.toLowerCase())) {
            await scanDirectory(item.path);
          }
        }
      };

      await scanDirectory();

      if (foundX402Files.length > 0) {
        return res.json({
          found: true,
          message: "MODEXO sees x402 protocol integration in this repository",
          details: {
            repository: `${owner}/${cleanRepo}`,
            filesFound: foundX402Files.slice(0, 10),
            confidence: foundX402Files.length > 3 ? 'high' : 'medium'
          }
        });
      }

      return res.json({
        found: false,
        message: "MODEXO does not see any x402 connection in this repository",
        details: { repository: `${owner}/${cleanRepo}` }
      });

    } catch (error) {
      console.error("Error checking GitHub repo:", error);
      res.status(500).json({ error: "Failed to check repository" });
    }
  });

  app.post("/api/wallet/kyc", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const cleanAddress = address.trim();
      
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (!base58Regex.test(cleanAddress)) {
        return res.status(400).json({ error: "Invalid Solana address format. Must be a valid Base58 encoded address." });
      }

      const heliusApiKey = process.env.HELIUS_API_KEY;
      if (!heliusApiKey) {
        return res.status(503).json({ error: "Helius API not configured" });
      }

      const [balanceResponse, txResponse] = await Promise.all([
        fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'balance',
            method: 'getBalance',
            params: [cleanAddress]
          })
        }),
        fetch(`https://api.helius.xyz/v0/addresses/${cleanAddress}/transactions?api-key=${heliusApiKey}&limit=100`)
      ]);

      if (!balanceResponse.ok) {
        return res.status(502).json({ error: "Failed to fetch wallet balance from Helius" });
      }
      
      if (!txResponse.ok) {
        const errorText = await txResponse.text();
        if (txResponse.status === 429) {
          return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
        }
        return res.status(502).json({ error: "Failed to fetch transaction history from Helius" });
      }

      const balanceData = await balanceResponse.json();
      if (balanceData.error) {
        return res.status(400).json({ error: balanceData.error.message || "Invalid wallet address" });
      }
      const solBalance = (balanceData.result?.value || 0) / 1e9;

      let transactions: any[] = [];
      let walletAge = 0;
      let txCount = 0;
      let firstTxDate = null;
      let lastTxDate = null;
      let uniqueInteractions = new Set<string>();
      let incomingTxCount = 0;
      let outgoingTxCount = 0;
      let totalVolumeIn = 0;
      let totalVolumeOut = 0;
      let dustTxCount = 0;
      let suspiciousPatterns: string[] = [];
      let hasMoreTransactions = false;

      transactions = await txResponse.json();
      txCount = transactions.length;
      hasMoreTransactions = txCount >= 100;

      if (transactions.length > 0) {
        const timestamps = transactions.map((tx: any) => tx.timestamp).filter(Boolean).sort((a: number, b: number) => a - b);
        if (timestamps.length > 0) {
          firstTxDate = new Date(timestamps[0] * 1000);
          lastTxDate = new Date(timestamps[timestamps.length - 1] * 1000);
          walletAge = Math.floor((Date.now() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        for (const tx of transactions) {
          if (tx.feePayer === cleanAddress) {
            outgoingTxCount++;
          } else {
            incomingTxCount++;
          }

          if (tx.nativeTransfers) {
            for (const transfer of tx.nativeTransfers) {
              const amount = (transfer.amount || 0) / 1e9;
              if (transfer.toUserAccount === cleanAddress) {
                totalVolumeIn += amount;
                if (transfer.fromUserAccount) uniqueInteractions.add(transfer.fromUserAccount);
              } else if (transfer.fromUserAccount === cleanAddress) {
                totalVolumeOut += amount;
                if (transfer.toUserAccount) uniqueInteractions.add(transfer.toUserAccount);
              }
              if (amount < 0.001 && amount > 0) {
                dustTxCount++;
              }
            }
          }

          if (tx.accountData) {
            for (const acc of tx.accountData) {
              if (acc.account && acc.account !== cleanAddress) {
                uniqueInteractions.add(acc.account);
              }
            }
          }
        }
      }

      if (walletAge < 7 && txCount >= 50 && !hasMoreTransactions) {
        suspiciousPatterns.push("High activity on new wallet (< 7 days old)");
      }
      if (dustTxCount > 20) {
        suspiciousPatterns.push(`Dust attack indicator: ${dustTxCount} micro-transactions detected`);
      }
      if (txCount > 10 && (outgoingTxCount / txCount) > 0.9) {
        suspiciousPatterns.push("Mostly outgoing transactions - potential drain pattern");
      }
      if (txCount > 10 && (incomingTxCount / txCount) > 0.95) {
        suspiciousPatterns.push("Almost exclusively receiving - possible collection wallet");
      }

      let ageScore = hasMoreTransactions ? 20 : Math.min(walletAge / 365 * 30, 30);
      let activityScore = Math.min(txCount / 100 * 25, 25);
      let diversityScore = Math.min(uniqueInteractions.size / 50 * 20, 20);
      let balanceScore = Math.min(solBalance / 10 * 15, 15);
      let patternScore = 10 - (suspiciousPatterns.length * 3);
      patternScore = Math.max(patternScore, 0);

      const trustScore = Math.round(ageScore + activityScore + diversityScore + balanceScore + patternScore);

      let riskLevel = 'low';
      if (trustScore < 30) riskLevel = 'high';
      else if (trustScore < 60) riskLevel = 'medium';

      let verificationStatus = 'unverified';
      if (trustScore >= 70) verificationStatus = 'trusted';
      else if (trustScore >= 50) verificationStatus = 'moderate';

      return res.json({
        address: cleanAddress,
        trustScore,
        riskLevel,
        verificationStatus,
        walletAge,
        firstTransaction: firstTxDate?.toISOString() || null,
        lastTransaction: lastTxDate?.toISOString() || null,
        totalTransactions: txCount,
        incomingTransactions: incomingTxCount,
        outgoingTransactions: outgoingTxCount,
        uniqueInteractions: uniqueInteractions.size,
        solBalance: parseFloat(solBalance.toFixed(4)),
        totalVolumeIn: parseFloat(totalVolumeIn.toFixed(4)),
        totalVolumeOut: parseFloat(totalVolumeOut.toFixed(4)),
        suspiciousPatterns,
        scoreBreakdown: {
          ageScore: Math.round(ageScore),
          activityScore: Math.round(activityScore),
          diversityScore: Math.round(diversityScore),
          balanceScore: Math.round(balanceScore),
          patternScore: Math.round(patternScore)
        }
      });

    } catch (error) {
      console.error("Error in KYC/AML check:", error);
      res.status(500).json({ error: "Failed to perform KYC/AML check" });
    }
  });

  app.post("/api/contract/audit", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: "Contract address is required" });
      }

      const cleanAddress = address.trim();
      if (cleanAddress.length < 32 || cleanAddress.length > 44) {
        return res.status(400).json({ error: "Invalid Solana address format" });
      }

      const rugcheckResponse = await fetch(`https://api.rugcheck.xyz/v1/tokens/${cleanAddress}/report`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'MODEXO-x402-Auditor' }
      });

      if (!rugcheckResponse.ok) {
        if (rugcheckResponse.status === 404) {
          return res.status(404).json({ error: "Token not found. Please verify the contract address." });
        }
        throw new Error(`RugCheck API error: ${rugcheckResponse.status}`);
      }

      const data = await rugcheckResponse.json();
      
      const isPumpFun = data.markets?.some((m: any) => 
        m.marketType?.toLowerCase().includes('pump') || 
        m.lp?.lpProvider?.toLowerCase().includes('pump')
      ) || data.tokenMeta?.symbol?.toLowerCase().includes('pump');
      
      const hasMintAuthority = data.token?.mintAuthority !== null && data.token?.mintAuthority !== undefined;
      const hasFreezeAuthority = data.token?.freezeAuthority !== null && data.token?.freezeAuthority !== undefined;
      
      const risks: string[] = [];
      if (data.risks && Array.isArray(data.risks)) {
        data.risks.forEach((risk: any) => {
          risks.push(`${risk.name}: ${risk.description}`);
        });
      }
      
      let riskLevel = 'low';
      let riskScore = data.score || 0;
      if (riskScore < 300) riskLevel = 'high';
      else if (riskScore < 600) riskLevel = 'medium';
      else riskLevel = 'low';

      const contractType = isPumpFun ? 'Pump.fun Token' : 
                          data.tokenMeta?.type || 'Standard SPL Token';

      return res.json({
        address: cleanAddress,
        name: data.tokenMeta?.name || 'Unknown',
        symbol: data.tokenMeta?.symbol || 'Unknown',
        contractType,
        isPumpFun,
        riskScore,
        riskLevel,
        hasMintAuthority,
        hasFreezeAuthority,
        totalSupply: data.token?.supply || 0,
        decimals: data.token?.decimals || 0,
        risks,
        topHolders: data.topHolders?.slice(0, 5).map((h: any) => ({
          address: h.address,
          percentage: h.pct
        })) || [],
        markets: data.markets?.slice(0, 3).map((m: any) => ({
          name: m.marketType || 'Unknown',
          liquidity: m.lp?.usd || 0
        })) || []
      });

    } catch (error) {
      console.error("Error auditing contract:", error);
      res.status(500).json({ error: "Failed to audit contract" });
    }
  });

  app.post("/api/portfolio/analyze", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const cleanAddress = address.trim();
      if (!validateSolanaAddress(cleanAddress)) {
        return res.status(400).json({ error: "Invalid Solana address format" });
      }

      const heliusApiKey = process.env.HELIUS_API_KEY;
      const rpcEndpoint = heliusApiKey 
        ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
        : 'https://api.mainnet-beta.solana.com';

      const balanceResponse = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'balance',
          method: 'getBalance',
          params: [cleanAddress]
        })
      });

      const balanceData = await balanceResponse.json();
      
      let tokensData: any = { result: { items: [] } };
      
      if (heliusApiKey) {
        const tokensResponse = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'tokens',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: cleanAddress,
              page: 1,
              limit: 100,
              displayOptions: { showFungible: true, showNativeBalance: true }
            }
          })
        });
        tokensData = await tokensResponse.json();
      }

      const solBalance = (balanceData.result?.value || 0) / 1e9;
      
      let solPriceUsd = 200;
      try {
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const priceData = await priceResponse.json();
        solPriceUsd = priceData.solana?.usd || 200;
      } catch {}

      const holdings: any[] = [];
      const fungibleTokens = tokensData.result?.items?.filter((item: any) => 
        item.interface === 'FungibleToken' || item.interface === 'FungibleAsset'
      ) || [];

      let totalTokenValue = 0;

      for (const token of fungibleTokens) {
        const balance = token.token_info?.balance || 0;
        const decimals = token.token_info?.decimals || 9;
        const priceUsd = token.token_info?.price_info?.price_per_token || 0;
        const actualBalance = balance / Math.pow(10, decimals);
        const valueUsd = actualBalance * priceUsd;

        if (valueUsd >= 0.01) {
          totalTokenValue += valueUsd;
          holdings.push({
            tokenAddress: token.id,
            symbol: token.content?.metadata?.symbol || token.token_info?.symbol || 'UNKNOWN',
            name: token.content?.metadata?.name || token.token_info?.name || 'Unknown Token',
            imageUrl: token.content?.links?.image || token.content?.files?.[0]?.uri,
            balance: actualBalance,
            decimals,
            priceUsd,
            valueUsd,
            priceChange24h: token.token_info?.price_info?.price_change_24h || 0,
            allocation: 0
          });
        }
      }

      const solValueUsd = solBalance * solPriceUsd;
      const totalValueUsd = solValueUsd + totalTokenValue;

      holdings.unshift({
        tokenAddress: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        imageUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        balance: solBalance,
        decimals: 9,
        priceUsd: solPriceUsd,
        valueUsd: solValueUsd,
        priceChange24h: 0,
        allocation: 0
      });

      for (const holding of holdings) {
        holding.allocation = totalValueUsd > 0 ? (holding.valueUsd / totalValueUsd) * 100 : 0;
      }

      holdings.sort((a, b) => b.valueUsd - a.valueUsd);

      let diversificationScore = 0;
      if (holdings.length >= 5) diversificationScore += 30;
      else if (holdings.length >= 3) diversificationScore += 20;
      else diversificationScore += 10;

      const topHoldingAllocation = holdings[0]?.allocation || 0;
      if (topHoldingAllocation < 50) diversificationScore += 40;
      else if (topHoldingAllocation < 70) diversificationScore += 25;
      else diversificationScore += 10;

      const hasStables = holdings.some(h => ['USDC', 'USDT', 'USDH', 'PYUSD'].includes(h.symbol));
      if (hasStables) diversificationScore += 30;
      else diversificationScore += 15;

      let riskScore = 50;
      if (holdings.length <= 2) riskScore += 20;
      if (topHoldingAllocation > 80) riskScore += 20;
      if (!hasStables) riskScore += 10;
      riskScore = Math.min(100, riskScore);

      const allocationByCategory = [
        { category: 'Native (SOL)', value: solValueUsd, percent: (solValueUsd / totalValueUsd) * 100 || 0 },
        { category: 'Tokens', value: totalTokenValue, percent: (totalTokenValue / totalValueUsd) * 100 || 0 }
      ];

      const snapshots = await storage.getPortfolioSnapshots(cleanAddress, 30);
      const performanceHistory = snapshots.map(s => ({
        timestamp: new Date(s.createdAt!).getTime(),
        valueUsd: s.totalValueUsd
      })).reverse();

      await storage.createPortfolioSnapshot({
        walletAddress: cleanAddress,
        totalValueUsd,
        solBalance,
        tokenCount: holdings.length,
        snapshotData: JSON.stringify({ holdings: holdings.slice(0, 10) })
      });

      return res.json({
        walletAddress: cleanAddress,
        totalValueUsd,
        totalPnlUsd: 0,
        totalPnlPercent: 0,
        solBalance,
        tokenCount: holdings.length,
        riskScore,
        diversificationScore,
        holdings,
        allocationByCategory,
        performanceHistory
      });

    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      res.status(500).json({ error: "Failed to analyze portfolio" });
    }
  });

  app.get("/api/portfolio/:address/history", async (req, res) => {
    try {
      const { address } = req.params;
      if (!validateSolanaAddress(address)) {
        return res.status(400).json({ error: "Invalid Solana address format" });
      }

      const snapshots = await storage.getPortfolioSnapshots(address, 30);
      const history = snapshots.map(s => ({
        timestamp: new Date(s.createdAt!).getTime(),
        valueUsd: s.totalValueUsd,
        solBalance: s.solBalance,
        tokenCount: s.tokenCount
      })).reverse();

      res.json(history);
    } catch (error) {
      console.error("Error fetching portfolio history:", error);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  });

  app.get("/api/portfolio/:address/transactions", async (req, res) => {
    try {
      const { address } = req.params;
      if (!validateSolanaAddress(address)) {
        return res.status(400).json({ error: "Invalid Solana address format" });
      }

      const trades = await getWalletRecentSwaps(address);
      
      const transactions = trades.map(trade => ({
        signature: trade.txnSignature,
        type: trade.side,
        tokenAddress: trade.tokenAddress,
        tokenSymbol: trade.tokenSymbol,
        amount: trade.sizeNative,
        valueUsd: trade.sizeUsd,
        priceUsd: trade.priceUsd,
        timestamp: trade.blockTime * 1000
      }));

      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  return httpServer;
}
