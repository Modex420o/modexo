import type { Request, Response, NextFunction } from "express";

const X402_VERSION = 1;
const PAYMENT_RECEIVER = "8ShrffvEuv9Uy4hLECKUGRFo6vN1qhY3Lkr4PDz2U92q";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_NETWORK = "solana";
const FACILITATOR_URL = "https://facilitator.payai.network";

export interface X402AgentConfig {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  resource: string;
  method: "GET" | "POST";
  inputSchema?: {
    queryParams?: Record<string, FieldDef>;
    bodyFields?: Record<string, FieldDef>;
  };
  outputSchema?: Record<string, any>;
}

interface FieldDef {
  type?: string;
  required?: boolean;
  description?: string;
  enum?: string[];
}

interface X402Response {
  x402Version: number;
  accepts: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    outputSchema?: object;
    extra?: object;
  }>;
}

export const MODEXO_AGENTS: X402AgentConfig[] = [
  {
    id: "x402-portfolio",
    name: "x402 Portfolio Agent",
    description: "AI-powered portfolio analysis for any Solana wallet. Returns holdings, token distribution, and performance insights.",
    priceUSD: 0.10,
    resource: "/api/x402/portfolio",
    method: "GET",
    inputSchema: {
      queryParams: {
        wallet: {
          type: "string",
          required: true,
          description: "Solana wallet address to analyze"
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        wallet: { type: "string" },
        totalValueUSD: { type: "number" },
        tokens: { type: "array" },
        analysis: { type: "string" }
      }
    }
  },
  {
    id: "x402-entry",
    name: "x402 Smart Entry Agent", 
    description: "AI-calculated optimal entry points for any Solana token. Returns support levels, resistance zones, and entry recommendations.",
    priceUSD: 0.10,
    resource: "/api/x402/entry",
    method: "GET",
    inputSchema: {
      queryParams: {
        token: {
          type: "string",
          required: true,
          description: "Token address or symbol to analyze"
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        token: { type: "string" },
        currentPrice: { type: "number" },
        entryZones: { type: "array" },
        recommendation: { type: "string" }
      }
    }
  },
  {
    id: "x402-liquidity",
    name: "x402 Liquidity Scanner Agent",
    description: "Deep liquidity analysis for Solana tokens. Returns depth analysis, concentration risk, slippage estimates, and safety scoring.",
    priceUSD: 0.10,
    resource: "/api/x402/liquidity",
    method: "GET",
    inputSchema: {
      queryParams: {
        token: {
          type: "string",
          required: true,
          description: "Token address or symbol to scan"
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        token: { type: "string" },
        liquidityUSD: { type: "number" },
        healthScore: { type: "number" },
        analysis: { type: "object" }
      }
    }
  },
  {
    id: "x402-whaletracker",
    name: "x402 Whale Tracker Agent",
    description: "Monitor large wallet movements and whale activity in real-time. Track smart money flows and get buy/sell signals.",
    priceUSD: 0.10,
    resource: "/api/x402/whaletracker",
    method: "GET",
    inputSchema: {
      queryParams: {
        token: {
          type: "string",
          required: true,
          description: "Token address to track whale activity for"
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        token: { type: "string" },
        recentWhaleTrades: { type: "array" },
        netFlow: { type: "string" },
        whaleCount: { type: "number" }
      }
    }
  },
  {
    id: "x402-kyc",
    name: "x402 KYC/AML Verification Agent",
    description: "AI-powered KYC/AML verification for Solana wallets. Analyzes wallet history, transaction patterns, and risk indicators.",
    priceUSD: 0.10,
    resource: "/api/x402/kyc",
    method: "GET",
    inputSchema: {
      queryParams: {
        wallet: {
          type: "string",
          required: true,
          description: "Wallet address to verify"
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        address: { type: "string" },
        trustScore: { type: "number" },
        riskLevel: { type: "string" },
        flags: { type: "array" }
      }
    }
  }
];

function usdToMicroUSDC(usd: number): string {
  return Math.round(usd * 1_000_000).toString();
}

export function create402Response(agent: X402AgentConfig, baseUrl: string): X402Response {
  const fullResourceUrl = `${baseUrl}${agent.resource}`;
  
  return {
    x402Version: X402_VERSION,
    accepts: [
      {
        scheme: "exact",
        network: SOLANA_NETWORK,
        maxAmountRequired: usdToMicroUSDC(agent.priceUSD),
        resource: fullResourceUrl,
        description: agent.description,
        mimeType: "application/json",
        payTo: PAYMENT_RECEIVER,
        maxTimeoutSeconds: 60,
        asset: USDC_MINT,
        outputSchema: {
          input: {
            type: "http",
            method: agent.method,
            ...(agent.inputSchema?.queryParams && { queryParams: agent.inputSchema.queryParams }),
            ...(agent.inputSchema?.bodyFields && { bodyFields: agent.inputSchema.bodyFields })
          },
          output: agent.outputSchema
        },
        extra: {
          agentId: agent.id,
          agentName: agent.name,
          platform: "MODEXO",
          category: "AI Utility",
          name: "USD Coin",
          version: "2",
          feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
        }
      }
    ]
  };
}

export function getAgentById(agentId: string): X402AgentConfig | undefined {
  return MODEXO_AGENTS.find(a => a.id === agentId);
}

export function getAgentByResource(resource: string): X402AgentConfig | undefined {
  return MODEXO_AGENTS.find(a => a.resource === resource);
}

async function verifyPaymentWithFacilitator(paymentPayload: any, agent: X402AgentConfig, resourceUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Build payment requirements matching x402 spec
    const paymentRequirements = {
      scheme: "exact",
      network: SOLANA_NETWORK,
      maxAmountRequired: usdToMicroUSDC(agent.priceUSD),
      asset: USDC_MINT,
      payTo: PAYMENT_RECEIVER,
      resource: resourceUrl,
      description: agent.description,
      mimeType: "application/json",
      maxTimeoutSeconds: 60,
      extra: {
        feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
      }
    };

    console.log("Verifying payment with facilitator. Payload keys:", Object.keys(paymentPayload));
    console.log("Payment payload:", JSON.stringify(paymentPayload).substring(0, 500));

    // Format as expected by PayAI facilitator
    const requestBody = {
      paymentPayload: paymentPayload,
      paymentRequirements: paymentRequirements
    };

    console.log("Request body:", JSON.stringify(requestBody).substring(0, 500));

    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log("Facilitator verify raw response:", responseText);

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch {
      return { valid: false, error: `Invalid facilitator response: ${responseText.substring(0, 200)}` };
    }

    if (!response.ok) {
      return { valid: false, error: result.error || result.message || `HTTP ${response.status}` };
    }
    
    // Check for valid/verified fields
    if (result.valid === false || result.verified === false) {
      return { valid: false, error: result.reason || result.invalidReason || result.message || "Payment verification failed" };
    }

    return { valid: true };
  } catch (e: any) {
    console.error("Facilitator verify error:", e);
    return { valid: false, error: `Facilitator error: ${e.message}` };
  }
}

async function settlePaymentWithFacilitator(paymentPayload: any, agent: X402AgentConfig, resourceUrl: string): Promise<{ success: boolean; receipt?: any; error?: string }> {
  try {
    const paymentRequirements = {
      scheme: "exact",
      network: SOLANA_NETWORK,
      maxAmountRequired: usdToMicroUSDC(agent.priceUSD),
      asset: USDC_MINT,
      payTo: PAYMENT_RECEIVER,
      resource: resourceUrl,
      description: agent.description,
      mimeType: "application/json",
      maxTimeoutSeconds: 60,
      extra: {
        feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
      }
    };

    console.log("Settling payment with facilitator");

    const requestBody = {
      paymentPayload: paymentPayload,
      paymentRequirements: paymentRequirements
    };

    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log("Facilitator settle raw response:", responseText);

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch {
      return { success: false, error: `Invalid facilitator response: ${responseText.substring(0, 200)}` };
    }

    if (!response.ok) {
      return { success: false, error: result.error || result.message || `HTTP ${response.status}` };
    }

    return { success: true, receipt: result };
  } catch (e: any) {
    console.error("Facilitator settle error:", e);
    return { success: false, error: `Settlement error: ${e.message}` };
  }
}

export function x402Middleware(agentId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const agent = getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const paymentHeader = req.headers["x-payment"] as string | undefined;
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const baseUrl = `${protocol}://${req.get("host")}`;
    const resourceUrl = `${baseUrl}${agent.resource}`;

    if (!paymentHeader) {
      console.log("No X-Payment header, returning 402");
      return res.status(402).json(create402Response(agent, baseUrl));
    }

    console.log("X-Payment header received, length:", paymentHeader.length);

    let paymentPayload: any;
    try {
      paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString());
      console.log("Decoded payment payload keys:", Object.keys(paymentPayload));
    } catch (e) {
      console.log("Failed to decode payment header:", e);
      return res.status(402).json({
        x402Version: X402_VERSION,
        error: "Invalid payment header format",
        accepts: create402Response(agent, baseUrl).accepts
      });
    }

    // Verify payment with facilitator
    const verification = await verifyPaymentWithFacilitator(paymentPayload, agent, resourceUrl);
    if (!verification.valid) {
      console.log("Payment verification failed:", verification.error);
      return res.status(402).json({
        x402Version: X402_VERSION,
        error: verification.error,
        accepts: create402Response(agent, baseUrl).accepts
      });
    }

    console.log("Payment verified, proceeding to handler");

    // Store settlement function for later use by the route handler
    (req as any).settlePayment = async () => {
      return await settlePaymentWithFacilitator(paymentPayload, agent, resourceUrl);
    };

    next();
  };
}

export function getAllAgentsInfo(): object[] {
  return MODEXO_AGENTS.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    priceUSD: agent.priceUSD,
    resource: agent.resource,
    method: agent.method
  }));
}
