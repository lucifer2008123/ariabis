export interface WhatsAppPayloadParams {
  productName: string;
  discountPct: number;
  winnerVendorName: string;
  repName: string;
  finalPrice: number;
  budgetTarget: number;
  verifiedSpecs: string[];
  quoteTimestampFormatted: string; // e.g. "01:54"
  verbatimQuote: string;
  runnerUpName?: string;
  runnerUpPrice?: number;
  onlineLowPrice: number;
  portalUrl: string;
  currencySymbol?: string;
}

export function formatWhatsAppEvidenceMessage(params: WhatsAppPayloadParams): string {
  const sym = params.currencySymbol || "₹";
  const specsList = params.verifiedSpecs.join(", ");
  const runnerUpSection = params.runnerUpName && params.runnerUpPrice
    ? `*Runner-Up:* ${params.runnerUpName} — ${sym}${params.runnerUpPrice.toLocaleString()}`
    : "*Runner-Up:* None eligible";

  return `*DEAL LOCKED: ${params.productName}*
Negotiated *${params.discountPct.toFixed(1)}% below* retail average!

*Winner:* ${params.winnerVendorName} (Spoke with ${params.repName || "Sales Rep"})
*Final All-In Price:* ${sym}${params.finalPrice.toLocaleString()} (Target: ${sym}${params.budgetTarget.toLocaleString()})
*Specs Verified:* ${specsList}
*Verbatim Quote (${params.quoteTimestampFormatted}):* "${params.verbatimQuote}"
${runnerUpSection}
*Market Benchmark:* ${sym}${params.onlineLowPrice.toLocaleString()} (Online Low)

*Listen to Audio Proof & Full Logs:*
${params.portalUrl}`;
}

export async function sendWhatsAppNotification(toPhone: string, message: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || token.includes("placeholder")) {
    console.log(`[WHATSAPP SIMULATION] Message to ${toPhone}:\n${message}`);
    return {
      success: true,
      simulated: true,
      recipient: toPhone,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone.replace(/[^0-9]/g, ""),
        type: "text",
        text: { body: message },
      }),
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (error: any) {
    console.error("WhatsApp delivery error:", error);
    return { success: false, error: error.message };
  }
}
