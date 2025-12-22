import { validateSolanaAddress, validateX402Signature } from "@shared/x402";

const AUTH_TOKEN_EXPIRY_MS = 3600000;
const NONCE_LENGTH = 32;
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_LOCKOUT_MS = 900000;

interface WalletAuthSession {
  walletAddress: string;
  nonce: string;
  signature?: string;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  attempts: number;
  lockedUntil?: number;
}

interface AuthToken {
  token: string;
  walletAddress: string;
  issuedAt: number;
  expiresAt: number;
  permissions: string[];
}

interface AuthMetrics {
  totalAuthAttempts: number;
  successfulAuths: number;
  failedAuths: number;
  activeTokens: number;
  lockedWallets: number;
}

const authSessions = new Map<string, WalletAuthSession>();
const activeTokens = new Map<string, AuthToken>();
const authMetrics: AuthMetrics = {
  totalAuthAttempts: 0,
  successfulAuths: 0,
  failedAuths: 0,
  activeTokens: 0,
  lockedWallets: 0,
};

function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < NONCE_LENGTH; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function generateToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 15);
  const extra = Math.random().toString(36).slice(2, 15);
  return `x402_${timestamp}_${random}${extra}`;
}

export function initiateWalletAuth(walletAddress: string): WalletAuthSession | null {
  if (!validateSolanaAddress(walletAddress)) {
    return null;
  }

  const existingSession = authSessions.get(walletAddress);
  if (existingSession?.lockedUntil && Date.now() < existingSession.lockedUntil) {
    return null;
  }

  const now = Date.now();
  const session: WalletAuthSession = {
    walletAddress,
    nonce: generateNonce(),
    createdAt: now,
    expiresAt: now + AUTH_TOKEN_EXPIRY_MS,
    verified: false,
    attempts: 0,
  };

  authSessions.set(walletAddress, session);
  return session;
}

export function verifyWalletSignature(
  walletAddress: string,
  signature: string
): { success: boolean; token?: AuthToken; error?: string } {
  authMetrics.totalAuthAttempts++;

  const session = authSessions.get(walletAddress);
  if (!session) {
    authMetrics.failedAuths++;
    return { success: false, error: "No active auth session" };
  }

  if (session.lockedUntil && Date.now() < session.lockedUntil) {
    return { success: false, error: "Wallet temporarily locked" };
  }

  if (Date.now() > session.expiresAt) {
    authSessions.delete(walletAddress);
    authMetrics.failedAuths++;
    return { success: false, error: "Auth session expired" };
  }

  if (!validateX402Signature(signature)) {
    session.attempts++;
    
    if (session.attempts >= MAX_AUTH_ATTEMPTS) {
      session.lockedUntil = Date.now() + AUTH_LOCKOUT_MS;
      authMetrics.lockedWallets++;
      authMetrics.failedAuths++;
      return { success: false, error: "Max attempts exceeded, wallet locked" };
    }
    
    authMetrics.failedAuths++;
    return { success: false, error: "Invalid signature format" };
  }

  session.signature = signature;
  session.verified = true;

  const now = Date.now();
  const token: AuthToken = {
    token: generateToken(),
    walletAddress,
    issuedAt: now,
    expiresAt: now + AUTH_TOKEN_EXPIRY_MS,
    permissions: ["read", "write", "execute"],
  };

  activeTokens.set(token.token, token);
  authMetrics.successfulAuths++;
  authMetrics.activeTokens = activeTokens.size;

  return { success: true, token };
}

export function validateAuthToken(token: string): AuthToken | null {
  const authToken = activeTokens.get(token);
  
  if (!authToken) {
    return null;
  }

  if (Date.now() > authToken.expiresAt) {
    activeTokens.delete(token);
    authMetrics.activeTokens = activeTokens.size;
    return null;
  }

  return authToken;
}

export function revokeAuthToken(token: string): boolean {
  const deleted = activeTokens.delete(token);
  authMetrics.activeTokens = activeTokens.size;
  return deleted;
}

export function revokeAllTokensForWallet(walletAddress: string): number {
  let revoked = 0;
  const entries = Array.from(activeTokens.entries());
  
  for (const [token, authToken] of entries) {
    if (authToken.walletAddress === walletAddress) {
      activeTokens.delete(token);
      revoked++;
    }
  }
  
  authMetrics.activeTokens = activeTokens.size;
  return revoked;
}

export function getAuthSession(walletAddress: string): WalletAuthSession | null {
  return authSessions.get(walletAddress) || null;
}

export function isWalletLocked(walletAddress: string): boolean {
  const session = authSessions.get(walletAddress);
  return !!(session?.lockedUntil && Date.now() < session.lockedUntil);
}

export function unlockWallet(walletAddress: string): boolean {
  const session = authSessions.get(walletAddress);
  
  if (!session || !session.lockedUntil) {
    return false;
  }

  session.lockedUntil = undefined;
  session.attempts = 0;
  authMetrics.lockedWallets = Math.max(0, authMetrics.lockedWallets - 1);
  
  return true;
}

export function cleanupExpiredSessions(): number {
  const now = Date.now();
  let cleaned = 0;

  const sessionEntries = Array.from(authSessions.entries());
  for (const [wallet, session] of sessionEntries) {
    if (now > session.expiresAt && !session.verified) {
      authSessions.delete(wallet);
      cleaned++;
    }
  }

  const tokenEntries = Array.from(activeTokens.entries());
  for (const [token, authToken] of tokenEntries) {
    if (now > authToken.expiresAt) {
      activeTokens.delete(token);
      cleaned++;
    }
  }

  authMetrics.activeTokens = activeTokens.size;
  return cleaned;
}

export function getAuthMetrics(): AuthMetrics {
  return { ...authMetrics };
}

export function hasPermission(token: string, permission: string): boolean {
  const authToken = validateAuthToken(token);
  return authToken?.permissions.includes(permission) ?? false;
}

export function extendTokenExpiry(token: string, additionalMs: number): boolean {
  const authToken = activeTokens.get(token);
  
  if (!authToken || Date.now() > authToken.expiresAt) {
    return false;
  }

  authToken.expiresAt += additionalMs;
  return true;
}

export const X402_WALLET_AUTH_CONFIG = {
  tokenExpiryMs: AUTH_TOKEN_EXPIRY_MS,
  nonceLength: NONCE_LENGTH,
  maxAuthAttempts: MAX_AUTH_ATTEMPTS,
  lockoutDurationMs: AUTH_LOCKOUT_MS,
};
