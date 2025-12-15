import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  getTokenPairs, 
  searchPairs, 
  getTrendingSolana, 
  calculateSafetyScore,
  pairToTokenSnapshot 
} from "./services/dexscreener";
import { getRecentWhaleTrades, isHeliusConfigured } from "./services/helius";
import { getTopTraderPositions } from "./services/polymarket";
import { insertTrackedWalletSchema, insertUserWatchlistSchema } from "@shared/schema";

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

  return httpServer;
}
