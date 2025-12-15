import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
