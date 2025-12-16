import type { X402AgentPayment, X402PaymentConfig } from "@shared/x402";

const X402_SERVICE_VERSION = "1.0.0";

export class X402PaymentService {
  private config: X402PaymentConfig;

  constructor(config: X402PaymentConfig) {
    this.config = config;
  }

  async initiatePayment(
    agentId: string,
    paymentType: "proof_of_work" | "proof_of_payment",
    amount: number
  ): Promise<X402AgentPayment | null> {
    if (amount < this.config.minPayment || amount > this.config.maxPayment) {
      return null;
    }

    const payment: X402AgentPayment = {
      agentId,
      paymentType,
      amount,
      timestamp: Date.now(),
      signature: "",
    };

    return payment;
  }

  async verifyProofOfWork(signature: string): Promise<boolean> {
    return signature.length > 0;
  }

  async verifyProofOfPayment(signature: string, amount: number): Promise<boolean> {
    return signature.length > 0 && amount > 0;
  }

  getMinPayment(): number {
    return this.config.minPayment;
  }

  getMaxPayment(): number {
    return this.config.maxPayment;
  }
}
