export const X402_PROTOCOL_VERSION = "1.0.0";
export const X402_NETWORK_ID = "solana-mainnet";
export const X402_MIN_CONFIRMATION_BLOCKS = 32;

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
