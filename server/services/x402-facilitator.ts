const X402_VERSION = 1;
const PAYMENT_RECEIVER = "8ShrffvEuv9Uy4hLECKUGRFo6vN1qhY3Lkr4PDz2U92q";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_NETWORK = "solana";
const FACILITATOR_URL = "https://facilitator.payai.network";

function usdToMicroUSDC(usd: number): string {
  return Math.round(usd * 1_000_000).toString();
}

interface AgentConfig {
  priceUSD: number;
  description: string;
}

export async function verifyPaymentWithFacilitator(
  paymentPayload: any, 
  agent: AgentConfig, 
  resourceUrl: string
): Promise<{ valid: boolean; error?: string }> {
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

    console.log("Verifying payment with facilitator. Payload keys:", Object.keys(paymentPayload));
    console.log("Payment payload:", JSON.stringify(paymentPayload).substring(0, 500));

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
    
    if (result.valid === false || result.verified === false) {
      return { valid: false, error: result.reason || result.invalidReason || result.message || "Payment verification failed" };
    }

    return { valid: true };
  } catch (e: any) {
    console.error("Facilitator verify error:", e);
    return { valid: false, error: `Facilitator error: ${e.message}` };
  }
}

export async function settlePaymentWithFacilitator(
  paymentPayload: any, 
  agent: AgentConfig, 
  resourceUrl: string
): Promise<{ success: boolean; receipt?: any; error?: string }> {
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
