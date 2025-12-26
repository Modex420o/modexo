import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const SCHEMA_VERSION = "1.1.0";

export const solanaAddressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
export const txSignatureSchema = z.string().regex(/^[A-Za-z0-9]{87,88}$/);

export function validateSolanaAddress(address: string): boolean {
  return solanaAddressSchema.safeParse(address).success;
}

export function validateTxSignature(signature: string): boolean {
  return txSignatureSchema.safeParse(signature).success;
}

export function sanitizeLabel(label: string): string {
  return label.trim().slice(0, 100).replace(/[<>]/g, "");
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim().toLowerCase().slice(0, 50))
    .filter(tag => tag.length > 0)
    .slice(0, 20);
}

export function normalizeTokenSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().slice(0, 20);
}

export function calculateRiskScore(flags: string[]): number {
  const weights: Record<string, number> = {
    honeypot: 0.4,
    rugpull: 0.35,
    lowLiquidity: 0.15,
    newToken: 0.05,
    highConcentration: 0.2,
  };
  
  let score = 0;
  for (const flag of flags) {
    score += weights[flag] || 0.05;
  }
  return Math.min(1, score);
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const trackedWallets = pgTable("tracked_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  label: text("label"),
  category: text("category").default("general"),
  tags: text("tags").array(),
  isInsider: boolean("is_insider").default(false),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackedWalletSchema = createInsertSchema(trackedWallets).omit({
  id: true,
  createdAt: true,
});

export type InsertTrackedWallet = z.infer<typeof insertTrackedWalletSchema>;
export type TrackedWallet = typeof trackedWallets.$inferSelect;

export const walletActivity = pgTable("wallet_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol"),
  txnSignature: text("txn_signature").notNull().unique(),
  side: text("side").notNull(),
  sizeUsd: real("size_usd"),
  sizeNative: real("size_native"),
  priceUsd: real("price_usd"),
  blockTime: timestamp("block_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWalletActivitySchema = createInsertSchema(walletActivity).omit({
  id: true,
  createdAt: true,
});

export type InsertWalletActivity = z.infer<typeof insertWalletActivitySchema>;
export type WalletActivity = typeof walletActivity.$inferSelect;

export const tokenSnapshots = pgTable("token_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenAddress: text("token_address").notNull().unique(),
  pairAddress: text("pair_address"),
  dexId: text("dex_id"),
  symbol: text("symbol").notNull(),
  name: text("name"),
  priceUsd: real("price_usd"),
  priceNative: real("price_native"),
  priceChange5m: real("price_change_5m"),
  priceChange1h: real("price_change_1h"),
  priceChange6h: real("price_change_6h"),
  priceChange24h: real("price_change_24h"),
  liquidityUsd: real("liquidity_usd"),
  fdvUsd: real("fdv_usd"),
  marketCapUsd: real("market_cap_usd"),
  volumeH24Usd: real("volume_h24_usd"),
  txBuysH24: integer("tx_buys_h24"),
  txSellsH24: integer("tx_sells_h24"),
  trendingScore: real("trending_score"),
  safetyScore: real("safety_score"),
  riskFlags: text("risk_flags").array(),
  imageUrl: text("image_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTokenSnapshotSchema = createInsertSchema(tokenSnapshots).omit({
  id: true,
  updatedAt: true,
});

export type InsertTokenSnapshot = z.infer<typeof insertTokenSnapshotSchema>;
export type TokenSnapshot = typeof tokenSnapshots.$inferSelect;

export const insiderRelations = pgTable("insider_relations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectName: text("project_name"),
  tokenAddress: text("token_address"),
  devWalletAddress: text("dev_wallet_address").notNull(),
  confidence: real("confidence").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInsiderRelationSchema = createInsertSchema(insiderRelations).omit({
  id: true,
  createdAt: true,
});

export type InsertInsiderRelation = z.infer<typeof insertInsiderRelationSchema>;
export type InsiderRelation = typeof insiderRelations.$inferSelect;

export const userWatchlist = pgTable("user_watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenAddress: text("token_address").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserWatchlistSchema = createInsertSchema(userWatchlist).omit({
  id: true,
  createdAt: true,
});

export type InsertUserWatchlist = z.infer<typeof insertUserWatchlistSchema>;
export type UserWatchlist = typeof userWatchlist.$inferSelect;

export const whaleTrades = pgTable("whale_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol"),
  txnSignature: text("txn_signature").notNull().unique(),
  side: text("side").notNull(),
  sizeUsd: real("size_usd").notNull(),
  sizeNative: real("size_native"),
  priceUsd: real("price_usd"),
  blockTime: timestamp("block_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhaleTradeSchema = createInsertSchema(whaleTrades).omit({
  id: true,
  createdAt: true,
});

export type InsertWhaleTrade = z.infer<typeof insertWhaleTradeSchema>;
export type WhaleTrade = typeof whaleTrades.$inferSelect;

export const AGENT_EXECUTION_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  TIMEOUT: "timeout",
} as const;

export const EXECUTION_PRIORITY = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 20,
} as const;

export interface ExecutionMetadata {
  startedAt: number;
  completedAt?: number;
  retryCount: number;
  errorMessage?: string;
  resourceUsage: {
    cpuMs: number;
    memoryMb: number;
    apiCalls: number;
  };
}

export function calculateExecutionDuration(metadata: ExecutionMetadata): number {
  if (!metadata.completedAt) return Date.now() - metadata.startedAt;
  return metadata.completedAt - metadata.startedAt;
}

export function isExecutionTerminal(status: string): boolean {
  const terminalStates = [
    AGENT_EXECUTION_STATUS.COMPLETED,
    AGENT_EXECUTION_STATUS.FAILED,
    AGENT_EXECUTION_STATUS.CANCELLED,
    AGENT_EXECUTION_STATUS.TIMEOUT,
  ];
  return terminalStates.includes(status as any);
}

export function getExecutionPriorityLabel(priority: number): string {
  if (priority >= EXECUTION_PRIORITY.CRITICAL) return "Critical";
  if (priority >= EXECUTION_PRIORITY.HIGH) return "High";
  if (priority >= EXECUTION_PRIORITY.NORMAL) return "Normal";
  return "Low";
}

export const agentExecutions = pgTable("agent_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: text("agent_id").notNull(),
  taskType: text("task_type").notNull(),
  status: text("status").notNull().default("pending"),
  inputData: text("input_data"),
  outputData: text("output_data"),
  x402Signature: text("x402_signature"),
  paymentType: text("payment_type"),
  paymentAmount: real("payment_amount"),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAgentExecutionSchema = createInsertSchema(agentExecutions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertAgentExecution = z.infer<typeof insertAgentExecutionSchema>;
export type AgentExecution = typeof agentExecutions.$inferSelect;

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
  avgBuyPrice?: number;
  pnlUsd?: number;
  pnlPercent?: number;
  allocation: number;
}

export interface PortfolioSummary {
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

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  totalValueUsd: real("total_value_usd").notNull(),
  solBalance: real("sol_balance").notNull(),
  tokenCount: integer("token_count").notNull(),
  snapshotData: text("snapshot_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertPortfolioSnapshot = z.infer<typeof insertPortfolioSnapshotSchema>;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
