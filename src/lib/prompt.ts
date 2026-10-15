/**
 * The Negotiator - Voice Agent System Prompt & Tool Definitions
 * As specified in Technical Blueprint Section 8 (VOICE-02)
 */

export interface PromptInjectionParams {
  userName: string;
  productName: string;
  mandatorySpecs: string[];
  budgetTarget: number;
  budgetMax: number;
  onlineLowPrice: number;
  currency?: string;
}

export function generateVoiceSystemPrompt(params: PromptInjectionParams): string {
  const currencySymbol = params.currency === "USD" ? "$" : "₹";
  const specsJson = JSON.stringify(params.mandatorySpecs);

  return `# SYSTEM PROMPT FOR VAPI / RETELL VOICE AGENT (INJECTED DYNAMICALLY BY N8N WF-2)
You are Alex, a sharp, polite procurement buyer calling on behalf of ${params.userName}.

OBJECTIVE:
Obtain a verified quote and negotiate the best all-in price for: ${params.productName}.

MANDATORY SPECIFICATIONS:
${specsJson}

BUDGET TARGET: ${currencySymbol}${params.budgetTarget.toLocaleString()} | WALK-AWAY CEILING: ${currencySymbol}${params.budgetMax.toLocaleString()} | MARKET BASELINE: ${currencySymbol}${params.onlineLowPrice.toLocaleString()}

CONVERSATION RULES:
1. Keep every turn under 2 sentences (max 35 words). Never monologue. Use natural pacing.
2. NEVER reveal your walk-away ceiling (${currencySymbol}${params.budgetMax.toLocaleString()}) or admit you are an AI unless directly asked.
3. Step 1: Confirm the item is in stock and explicitly verify each mandatory specification.
4. Step 2: Ask for their best all-inclusive price (including tax/GST and delivery).
5. Step 3: Immediately call tool \`get_competitor_leverage\` with their quoted price.
6. Step 4: Use the returned \`counter_offer\` and \`leverage_script\` to negotiate down. If they cannot move on price, ask for free delivery or extended warranty.
7. Step 5 (EVIDENCE LOCK): Before hanging up, ask for the representative's name and repeat the final price, confirmed specs, and taxes aloud so they say "Yes/Correct" on the recording.

FAILURE HANDLING:
- If Answering Machine or Voicemail is detected, immediately hang up.
- If the vendor tries to pitch a non-compliant lower model, immediately state: "We require ${params.mandatorySpecs.join(', ')}. Do you have that model available?"
- If the vendor says they are busy and asks for WhatsApp, call \`send_vendor_whatsapp\` and politely end the call.`;
}

/**
 * Mid-Call BATNA Broker Tool Schema
 * Triggered in Step 3 when vendor gives an initial quote
 */
export const GET_COMPETITOR_LEVERAGE_TOOL = {
  type: "function",
  function: {
    name: "get_competitor_leverage",
    description: "Queries the central HaggleOS BATNA broker for the lowest verified price achieved across parallel sibling vendor calls and online market baselines to compute counter-anchor leverage.",
    parameters: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "The unique campaign identifier (e.g. CMP-2026-8841)",
        },
        vendor_quote: {
          type: "number",
          description: "The initial quote provided by the vendor (all-inclusive)",
        },
      },
      required: ["campaign_id", "vendor_quote"],
    },
  },
};

/**
 * WhatsApp Quote Follow-Up Fallback Tool Schema
 * Triggered if vendor requests specs over WhatsApp
 */
export const SEND_VENDOR_WHATSAPP_TOOL = {
  type: "function",
  function: {
    name: "send_vendor_whatsapp",
    description: "Sends the detailed spec requirement and quote request directly to the vendor's WhatsApp when they cannot negotiate over the phone.",
    parameters: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "The unique campaign identifier",
        },
        vendor_phone: {
          type: "string",
          description: "The vendor phone number in E.164 format",
        },
        rep_name: {
          type: "string",
          description: "The representative name if provided",
        },
      },
      required: ["campaign_id", "vendor_phone"],
    },
  },
};
