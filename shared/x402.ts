export const X402_PROTOCOL_VERSION = "1.1.0";
export const X402_NETWORK_ID = "solana-mainnet";
export const X402_MIN_CONFIRMATION_BLOCKS = 32;
export const TRANSACTION_EXPIRY_MS = 120000;

interface TransactionState {
  id: string;
  status: "pending" | "confirmed" | "failed" | "expired";
  createdAt: number;
  confirmedAt?: number;
  blockHeight?: number;
  retryCount: number;
}

const transactionStates = new Map<string, TransactionState>();

export function createTransaction(id: string): TransactionState {
  const state: TransactionState = {
    id,
    status: "pending",
    createdAt: Date.now(),
    retryCount: 0,
  };
  transactionStates.set(id, state);
  return state;
}

export function confirmTransaction(id: string, blockHeight: number): boolean {
  const state = transactionStates.get(id);
  if (!state || state.status !== "pending") return false;
  
  state.status = "confirmed";
  state.confirmedAt = Date.now();
  state.blockHeight = blockHeight;
  return true;
}

export function failTransaction(id: string): boolean {
  const state = transactionStates.get(id);
  if (!state) return false;
  
  state.status = "failed";
  return true;
}

export function checkExpiredTransactions(): string[] {
  const now = Date.now();
  const expired: string[] = [];
  
  for (const [id, state] of transactionStates) {
    if (state.status === "pending" && now - state.createdAt > TRANSACTION_EXPIRY_MS) {
      state.status = "expired";
      expired.push(id);
    }
  }
  
  return expired;
}

export function getTransactionState(id: string): TransactionState | undefined {
  return transactionStates.get(id);
}

export function clearCompletedTransactions(): number {
  let cleared = 0;
  for (const [id, state] of transactionStates) {
    if (state.status === "confirmed" || state.status === "failed" || state.status === "expired") {
      transactionStates.delete(id);
      cleared++;
    }
  }
  return cleared;
}

export interface X402PaymentConfig {
  network: "mainnet-beta" | "devnet";
  minPayment: number;
  maxPayment: number;
  feeRecipient: string;
  tokenMint: string;
}

export interface X402AgentPayment {
  agentId: string;
  paymentType: "proof_of_work" | "proof_of_payment";
  amount: number;
  timestamp: number;
  signature: string;
}

export const DEFAULT_X402_CONFIG: X402PaymentConfig = {
  network: "mainnet-beta",
  minPayment: 0.001,
  maxPayment: 100,
  feeRecipient: "",
  tokenMint: "So11111111111111111111111111111111111111112",
};

export function calculateAgentFee(
  baseRate: number,
  complexity: number,
  priority: "low" | "normal" | "high"
): number {
  const priorityMultiplier = {
    low: 0.8,
    normal: 1.0,
    high: 1.5,
  };
  return baseRate * complexity * priorityMultiplier[priority];
}

export function validateX402Signature(signature: string): boolean {
  return signature.length === 88 && /^[A-Za-z0-9+/=]+$/.test(signature);
}

export function validateSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function validatePaymentRequest(
  amount: number,
  config: X402PaymentConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Invalid payment amount");
  }
  
  if (amount < config.minPayment) {
    errors.push(`Amount below minimum: ${config.minPayment}`);
  }
  
  if (amount > config.maxPayment) {
    errors.push(`Amount exceeds maximum: ${config.maxPayment}`);
  }
  
  if (!validateSolanaAddress(config.tokenMint)) {
    errors.push("Invalid token mint address");
  }
  
  return { valid: errors.length === 0, errors };
}

export function formatPaymentAmount(amount: number, decimals: number = 9): string {
  return (amount / Math.pow(10, decimals)).toFixed(decimals);
}

export function parsePaymentAmount(formatted: string, decimals: number = 9): number {
  return Math.round(parseFloat(formatted) * Math.pow(10, decimals));
}

export function estimateTransactionFee(
  priorityLevel: "low" | "normal" | "high"
): number {
  const baseFee = 5000;
  const multipliers = { low: 1, normal: 2, high: 5 };
  return baseFee * multipliers[priorityLevel];
}
