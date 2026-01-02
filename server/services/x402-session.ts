import crypto from "crypto";

interface PaymentSession {
  sessionId: string;
  walletAddress: string;
  agentId: string;
  resource: string;
  amountRequired: string;
  status: "pending" | "paid" | "expired" | "used";
  createdAt: Date;
  expiresAt: Date;
  paidAt?: Date;
  transactionSignature?: string;
  usedAt?: Date;
}

interface SessionConfig {
  expirationMinutes: number;
  maxRetries: number;
  cleanupIntervalMs: number;
}

const config: SessionConfig = {
  expirationMinutes: 5,
  maxRetries: 3,
  cleanupIntervalMs: 60000
};

const sessions: Map<string, PaymentSession> = new Map();
const walletSessions: Map<string, Set<string>> = new Map();

export function createSession(
  walletAddress: string,
  agentId: string,
  resource: string,
  amountRequired: string
): PaymentSession {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.expirationMinutes * 60 * 1000);
  
  const session: PaymentSession = {
    sessionId,
    walletAddress,
    agentId,
    resource,
    amountRequired,
    status: "pending",
    createdAt: now,
    expiresAt
  };
  
  sessions.set(sessionId, session);
  
  if (!walletSessions.has(walletAddress)) {
    walletSessions.set(walletAddress, new Set());
  }
  walletSessions.get(walletAddress)!.add(sessionId);
  
  return session;
}

export function getSession(sessionId: string): PaymentSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  
  if (session.status === "pending" && new Date() > session.expiresAt) {
    session.status = "expired";
  }
  
  return session;
}

export function getSessionsByWallet(walletAddress: string): PaymentSession[] {
  const sessionIds = walletSessions.get(walletAddress);
  if (!sessionIds) return [];
  
  return Array.from(sessionIds)
    .map(id => getSession(id))
    .filter((s): s is PaymentSession => s !== undefined);
}

export function markSessionPaid(
  sessionId: string,
  transactionSignature: string
): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (session.status !== "pending") return false;
  if (new Date() > session.expiresAt) {
    session.status = "expired";
    return false;
  }
  
  session.status = "paid";
  session.paidAt = new Date();
  session.transactionSignature = transactionSignature;
  return true;
}

export function markSessionUsed(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (session.status !== "paid") return false;
  
  session.status = "used";
  session.usedAt = new Date();
  return true;
}

export function validateSession(sessionId: string): {
  valid: boolean;
  reason?: string;
  session?: PaymentSession;
} {
  const session = getSession(sessionId);
  
  if (!session) {
    return { valid: false, reason: "Session not found" };
  }
  
  if (session.status === "expired") {
    return { valid: false, reason: "Session expired" };
  }
  
  if (session.status === "used") {
    return { valid: false, reason: "Session already used" };
  }
  
  if (session.status === "pending") {
    return { valid: false, reason: "Payment not completed" };
  }
  
  if (session.status === "paid") {
    return { valid: true, session };
  }
  
  return { valid: false, reason: "Invalid session state" };
}

export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    const expiredThreshold = new Date(session.expiresAt.getTime() + 3600000);
    
    if (now > expiredThreshold && session.status !== "paid") {
      sessions.delete(sessionId);
      
      const walletSet = walletSessions.get(session.walletAddress);
      if (walletSet) {
        walletSet.delete(sessionId);
        if (walletSet.size === 0) {
          walletSessions.delete(session.walletAddress);
        }
      }
      cleaned++;
    }
  }
  
  return cleaned;
}

export function getSessionStats(): {
  total: number;
  pending: number;
  paid: number;
  expired: number;
  used: number;
  uniqueWallets: number;
} {
  const all = Array.from(sessions.values());
  
  return {
    total: all.length,
    pending: all.filter(s => s.status === "pending").length,
    paid: all.filter(s => s.status === "paid").length,
    expired: all.filter(s => s.status === "expired").length,
    used: all.filter(s => s.status === "used").length,
    uniqueWallets: walletSessions.size
  };
}

export function getActiveSessionsForAgent(agentId: string): PaymentSession[] {
  return Array.from(sessions.values())
    .filter(s => s.agentId === agentId && s.status === "paid");
}

export function extendSession(sessionId: string, minutes: number): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.status !== "pending") return false;
  
  session.expiresAt = new Date(session.expiresAt.getTime() + minutes * 60 * 1000);
  return true;
}

setInterval(cleanupExpiredSessions, config.cleanupIntervalMs);
