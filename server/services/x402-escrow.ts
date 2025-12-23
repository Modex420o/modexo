import { X402_PROTOCOL_VERSION, X402_NETWORK_ID, validateSolanaAddress } from "@shared/x402";
import { randomBytes } from "crypto";

const ESCROW_EXPIRY_MS = 86400000;
const MAX_ESCROW_AMOUNT = 1000;
const MIN_ESCROW_AMOUNT = 0.001;
const ESCROW_FEE_PERCENT = 0.5;

type EscrowStatus = "held" | "released" | "refunded" | "disputed" | "expired";

interface EscrowAccount {
  id: string;
  depositor: string;
  beneficiary: string;
  amount: number;
  fee: number;
  status: EscrowStatus;
  createdAt: number;
  expiresAt: number;
  releasedAt?: number;
  releaseCondition: string;
  metadata?: Record<string, string>;
}

interface EscrowDispute {
  escrowId: string;
  initiatedBy: string;
  reason: string;
  evidence: string[];
  createdAt: number;
  resolvedAt?: number;
  resolution?: "release" | "refund" | "split";
}

interface EscrowMetrics {
  totalEscrows: number;
  activeEscrows: number;
  totalReleased: number;
  totalRefunded: number;
  totalDisputed: number;
  totalFeesCollected: number;
  averageHoldTime: number;
}

const escrowAccounts = new Map<string, EscrowAccount>();
const escrowsByDepositor = new Map<string, Set<string>>();
const escrowsByBeneficiary = new Map<string, Set<string>>();
const activeDisputes = new Map<string, EscrowDispute>();
const escrowMetrics: EscrowMetrics = {
  totalEscrows: 0,
  activeEscrows: 0,
  totalReleased: 0,
  totalRefunded: 0,
  totalDisputed: 0,
  totalFeesCollected: 0,
  averageHoldTime: 0,
};

function generateEscrowId(): string {
  const secureToken = randomBytes(12).toString('hex');
  return `x402_escrow_${Date.now()}_${secureToken}`;
}

function calculateEscrowFee(amount: number): number {
  return amount * (ESCROW_FEE_PERCENT / 100);
}

export function createEscrow(
  depositor: string,
  beneficiary: string,
  amount: number,
  releaseCondition: string,
  expiryMs: number = ESCROW_EXPIRY_MS,
  metadata?: Record<string, string>
): EscrowAccount | null {
  if (!validateSolanaAddress(depositor) || !validateSolanaAddress(beneficiary)) {
    return null;
  }

  if (amount < MIN_ESCROW_AMOUNT || amount > MAX_ESCROW_AMOUNT) {
    return null;
  }

  if (depositor === beneficiary) {
    return null;
  }

  const now = Date.now();
  const fee = calculateEscrowFee(amount);
  
  const escrow: EscrowAccount = {
    id: generateEscrowId(),
    depositor,
    beneficiary,
    amount,
    fee,
    status: "held",
    createdAt: now,
    expiresAt: now + expiryMs,
    releaseCondition,
    metadata,
  };

  escrowAccounts.set(escrow.id, escrow);
  
  if (!escrowsByDepositor.has(depositor)) {
    escrowsByDepositor.set(depositor, new Set());
  }
  escrowsByDepositor.get(depositor)!.add(escrow.id);
  
  if (!escrowsByBeneficiary.has(beneficiary)) {
    escrowsByBeneficiary.set(beneficiary, new Set());
  }
  escrowsByBeneficiary.get(beneficiary)!.add(escrow.id);
  
  escrowMetrics.totalEscrows++;
  escrowMetrics.activeEscrows++;

  return escrow;
}

export function getEscrow(escrowId: string): EscrowAccount | null {
  return escrowAccounts.get(escrowId) || null;
}

export function releaseEscrow(escrowId: string, authorizedBy: string): boolean {
  const escrow = escrowAccounts.get(escrowId);
  
  if (!escrow) return false;
  if (escrow.status !== "held") return false;
  if (authorizedBy !== escrow.depositor) return false;

  escrow.status = "released";
  escrow.releasedAt = Date.now();
  
  escrowMetrics.activeEscrows--;
  escrowMetrics.totalReleased++;
  escrowMetrics.totalFeesCollected += escrow.fee;
  
  updateAverageHoldTime(escrow);

  return true;
}

export function refundEscrow(escrowId: string, reason: string): boolean {
  const escrow = escrowAccounts.get(escrowId);
  
  if (!escrow) return false;
  if (escrow.status !== "held" && escrow.status !== "disputed") return false;

  escrow.status = "refunded";
  escrow.releasedAt = Date.now();
  
  escrowMetrics.activeEscrows--;
  escrowMetrics.totalRefunded++;
  
  updateAverageHoldTime(escrow);

  return true;
}

function updateAverageHoldTime(escrow: EscrowAccount): void {
  const holdTime = (escrow.releasedAt || Date.now()) - escrow.createdAt;
  const completedCount = escrowMetrics.totalReleased + escrowMetrics.totalRefunded;
  const totalTime = escrowMetrics.averageHoldTime * (completedCount - 1);
  escrowMetrics.averageHoldTime = (totalTime + holdTime) / completedCount;
}

export function initiateDispute(
  escrowId: string,
  initiatedBy: string,
  reason: string,
  evidence: string[] = []
): EscrowDispute | null {
  const escrow = escrowAccounts.get(escrowId);
  
  if (!escrow) return null;
  if (escrow.status !== "held") return null;
  if (initiatedBy !== escrow.depositor && initiatedBy !== escrow.beneficiary) {
    return null;
  }

  if (activeDisputes.has(escrowId)) {
    return activeDisputes.get(escrowId)!;
  }

  const dispute: EscrowDispute = {
    escrowId,
    initiatedBy,
    reason,
    evidence,
    createdAt: Date.now(),
  };

  escrow.status = "disputed";
  activeDisputes.set(escrowId, dispute);
  escrowMetrics.totalDisputed++;

  return dispute;
}

export function resolveDispute(
  escrowId: string,
  resolution: "release" | "refund" | "split"
): boolean {
  const dispute = activeDisputes.get(escrowId);
  const escrow = escrowAccounts.get(escrowId);
  
  if (!dispute || !escrow) return false;
  if (escrow.status !== "disputed") return false;

  dispute.resolvedAt = Date.now();
  dispute.resolution = resolution;

  if (resolution === "release") {
    escrow.status = "released";
    escrow.releasedAt = Date.now();
    escrowMetrics.totalReleased++;
  } else if (resolution === "refund") {
    escrow.status = "refunded";
    escrow.releasedAt = Date.now();
    escrowMetrics.totalRefunded++;
  } else {
    escrow.status = "released";
    escrow.releasedAt = Date.now();
    escrowMetrics.totalReleased++;
  }

  escrowMetrics.activeEscrows--;
  activeDisputes.delete(escrowId);

  return true;
}

export function checkExpiredEscrows(): string[] {
  const now = Date.now();
  const expired: string[] = [];
  const entries = Array.from(escrowAccounts.entries());

  for (const [id, escrow] of entries) {
    if (escrow.status === "held" && now > escrow.expiresAt) {
      escrow.status = "expired";
      escrowMetrics.activeEscrows--;
      expired.push(id);
    }
  }

  return expired;
}

export function getDepositorEscrows(depositor: string): EscrowAccount[] {
  const escrowIds = escrowsByDepositor.get(depositor);
  
  if (!escrowIds) return [];

  const escrows: EscrowAccount[] = [];
  const ids = Array.from(escrowIds);
  
  for (const id of ids) {
    const escrow = escrowAccounts.get(id);
    if (escrow) {
      escrows.push(escrow);
    }
  }

  return escrows;
}

export function getBeneficiaryEscrows(beneficiary: string): EscrowAccount[] {
  const escrowIds = escrowsByBeneficiary.get(beneficiary);
  
  if (!escrowIds) return [];

  const escrows: EscrowAccount[] = [];
  const ids = Array.from(escrowIds);
  
  for (const id of ids) {
    const escrow = escrowAccounts.get(id);
    if (escrow) {
      escrows.push(escrow);
    }
  }

  return escrows;
}

export function getActiveEscrows(): EscrowAccount[] {
  const entries = Array.from(escrowAccounts.values());
  return entries.filter(e => e.status === "held" || e.status === "disputed");
}

export function getEscrowMetrics(): EscrowMetrics {
  return { ...escrowMetrics };
}

export function getDisputeStatus(escrowId: string): EscrowDispute | null {
  return activeDisputes.get(escrowId) || null;
}

export function calculateNetAmount(escrow: EscrowAccount): number {
  return escrow.amount - escrow.fee;
}

export function extendEscrowExpiry(escrowId: string, additionalMs: number): boolean {
  const escrow = escrowAccounts.get(escrowId);
  
  if (!escrow) return false;
  if (escrow.status !== "held") return false;

  escrow.expiresAt += additionalMs;
  return true;
}

export const X402_ESCROW_CONFIG = {
  version: X402_PROTOCOL_VERSION,
  network: X402_NETWORK_ID,
  defaultExpiry: ESCROW_EXPIRY_MS,
  maxAmount: MAX_ESCROW_AMOUNT,
  minAmount: MIN_ESCROW_AMOUNT,
  feePercent: ESCROW_FEE_PERCENT,
};
