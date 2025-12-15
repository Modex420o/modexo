import { 
  users, type User, type InsertUser,
  trackedWallets, type TrackedWallet, type InsertTrackedWallet,
  walletActivity, type WalletActivity, type InsertWalletActivity,
  tokenSnapshots, type TokenSnapshot, type InsertTokenSnapshot,
  insiderRelations, type InsiderRelation, type InsertInsiderRelation,
  userWatchlist, type UserWatchlist, type InsertUserWatchlist,
  whaleTrades, type WhaleTrade, type InsertWhaleTrade
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTrackedWallets(): Promise<TrackedWallet[]>;
  getTrackedWallet(address: string): Promise<TrackedWallet | undefined>;
  createTrackedWallet(wallet: InsertTrackedWallet): Promise<TrackedWallet>;
  deleteTrackedWallet(id: string): Promise<void>;
  
  getWalletActivity(walletAddress: string, limit?: number): Promise<WalletActivity[]>;
  createWalletActivity(activity: InsertWalletActivity): Promise<WalletActivity>;
  
  getTokenSnapshots(limit?: number): Promise<TokenSnapshot[]>;
  getTokenSnapshot(tokenAddress: string): Promise<TokenSnapshot | undefined>;
  upsertTokenSnapshot(snapshot: InsertTokenSnapshot): Promise<TokenSnapshot>;
  getTrendingTokens(limit?: number): Promise<TokenSnapshot[]>;
  
  getInsiderRelations(): Promise<InsiderRelation[]>;
  createInsiderRelation(relation: InsertInsiderRelation): Promise<InsiderRelation>;
  
  getUserWatchlist(): Promise<UserWatchlist[]>;
  addToWatchlist(item: InsertUserWatchlist): Promise<UserWatchlist>;
  removeFromWatchlist(tokenAddress: string): Promise<void>;
  
  getWhaleTrades(limit?: number): Promise<WhaleTrade[]>;
  createWhaleTrade(trade: InsertWhaleTrade): Promise<WhaleTrade>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTrackedWallets(): Promise<TrackedWallet[]> {
    return db.select().from(trackedWallets).orderBy(desc(trackedWallets.createdAt));
  }

  async getTrackedWallet(address: string): Promise<TrackedWallet | undefined> {
    const [wallet] = await db.select().from(trackedWallets).where(eq(trackedWallets.address, address));
    return wallet || undefined;
  }

  async createTrackedWallet(wallet: InsertTrackedWallet): Promise<TrackedWallet> {
    const [created] = await db.insert(trackedWallets).values(wallet).returning();
    return created;
  }

  async deleteTrackedWallet(id: string): Promise<void> {
    await db.delete(trackedWallets).where(eq(trackedWallets.id, id));
  }

  async getWalletActivity(walletAddress: string, limit = 50): Promise<WalletActivity[]> {
    return db.select().from(walletActivity)
      .where(eq(walletActivity.walletAddress, walletAddress))
      .orderBy(desc(walletActivity.blockTime))
      .limit(limit);
  }

  async createWalletActivity(activity: InsertWalletActivity): Promise<WalletActivity> {
    const [created] = await db.insert(walletActivity).values(activity).returning();
    return created;
  }

  async getTokenSnapshots(limit = 100): Promise<TokenSnapshot[]> {
    return db.select().from(tokenSnapshots)
      .orderBy(desc(tokenSnapshots.volumeH24Usd))
      .limit(limit);
  }

  async getTokenSnapshot(tokenAddress: string): Promise<TokenSnapshot | undefined> {
    const [snapshot] = await db.select().from(tokenSnapshots)
      .where(eq(tokenSnapshots.tokenAddress, tokenAddress));
    return snapshot || undefined;
  }

  async upsertTokenSnapshot(snapshot: InsertTokenSnapshot): Promise<TokenSnapshot> {
    const [upserted] = await db.insert(tokenSnapshots)
      .values(snapshot)
      .onConflictDoUpdate({
        target: tokenSnapshots.tokenAddress,
        set: {
          ...snapshot,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getTrendingTokens(limit = 20): Promise<TokenSnapshot[]> {
    return db.select().from(tokenSnapshots)
      .orderBy(desc(tokenSnapshots.trendingScore))
      .limit(limit);
  }

  async getInsiderRelations(): Promise<InsiderRelation[]> {
    return db.select().from(insiderRelations)
      .orderBy(desc(insiderRelations.confidence));
  }

  async createInsiderRelation(relation: InsertInsiderRelation): Promise<InsiderRelation> {
    const [created] = await db.insert(insiderRelations).values(relation).returning();
    return created;
  }

  async getUserWatchlist(): Promise<UserWatchlist[]> {
    return db.select().from(userWatchlist)
      .orderBy(userWatchlist.displayOrder);
  }

  async addToWatchlist(item: InsertUserWatchlist): Promise<UserWatchlist> {
    const [created] = await db.insert(userWatchlist).values(item).returning();
    return created;
  }

  async removeFromWatchlist(tokenAddress: string): Promise<void> {
    await db.delete(userWatchlist).where(eq(userWatchlist.tokenAddress, tokenAddress));
  }

  async getWhaleTrades(limit = 50): Promise<WhaleTrade[]> {
    return db.select().from(whaleTrades)
      .orderBy(desc(whaleTrades.blockTime))
      .limit(limit);
  }

  async createWhaleTrade(trade: InsertWhaleTrade): Promise<WhaleTrade> {
    const [created] = await db.insert(whaleTrades).values(trade).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
