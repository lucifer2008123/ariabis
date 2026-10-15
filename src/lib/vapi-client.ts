import { generateVoiceSystemPrompt, GET_COMPETITOR_LEVERAGE_TOOL, SEND_VENDOR_WHATSAPP_TOOL } from "./prompt";

export interface OutboundCallRequest {
  campaignId: string;
  vendorName: string;
  vendorPhone: string;
  productName: string;
  userName: string;
  mandatorySpecs: string[];
  budgetTarget: number;
  budgetMax: number;
  onlineLowPrice: number;
}

export async function dispatchVapiCall(request: OutboundCallRequest) {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const prompt = generateVoiceSystemPrompt({
    userName: request.userName,
    productName: request.productName,
    mandatorySpecs: request.mandatorySpecs,
    budgetTarget: request.budgetTarget,
    budgetMax: request.budgetMax,
    onlineLowPrice: request.onlineLowPrice,
  });

  if (!apiKey || apiKey.includes("placeholder")) {
    console.log(`[VAPI SIMULATION] Outbound call to ${request.vendorName} (${request.vendorPhone})`);
    return {
      callId: `vapi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: "queued",
      simulated: true,
      vendorPhone: request.vendorPhone,
    };
  }

  try {
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: phoneNumberId,
        customer: {
          number: request.vendorPhone,
          name: request.vendorName,
        },
        assistant: {
          name: `HaggleOS Negotiator - ${request.campaignId}`,
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            tools: [
              {
                ...GET_COMPETITOR_LEVERAGE_TOOL,
                server: {
                  url: `${baseUrl}/api/v1/live-leverage`,
                  timeoutSeconds: 3,
                },
              },
              {
                ...SEND_VENDOR_WHATSAPP_TOOL,
                server: {
                  url: `${baseUrl}/api/v1/live-leverage`,
                  timeoutSeconds: 3,
                },
              },
            ],
          },
          voice: {
            provider: "elevenlabs",
            voiceId: "cjVigY5qzO86Huf0OWal", // Eric or similar sharp, polite voice
            model: "eleven_turbo_v2_5",
          },
          serverUrl: `${baseUrl}/api/v1/call-complete`,
          recordingEnabled: true,
          endCallFunctionEnabled: true,
        },
      }),
    });

    return await response.json();
  } catch (error: any) {
    console.error("Vapi dispatch error:", error);
    return {
      error: error.message,
      simulated: true,
      callId: `vapi_fallback_${Date.now()}`,
    };
  }
}
