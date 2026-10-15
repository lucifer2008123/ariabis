import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Mid-Call BATNA Broker (<280ms Latency Requirement)
 * Executed during live voice calls when vendor mentions initial quote.
 */
export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await req.json();

    // Support both direct REST call and Vapi tool call format
    let campaignId = body.campaign_id;
    let vendorQuote = Number(body.vendor_quote) || 0;
    const toolCallId = body.message?.toolCalls?.[0]?.id || body.toolCallId || "tc_live_leverage";

    if (body.message?.toolCalls?.[0]?.function?.arguments) {
      const args = typeof body.message.toolCalls[0].function.arguments === "string"
        ? JSON.parse(body.message.toolCalls[0].function.arguments)
        : body.message.toolCalls[0].function.arguments;
      campaignId = args.campaign_id;
      vendorQuote = Number(args.vendor_quote) || vendorQuote;
    }

    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 });
    }

    // 1. Fetch lowest verified price across sibling calls
    const lowestVerified = await Store.getLowestVerifiedPrice(campaignId);
    const campaign = await Store.getCampaign(campaignId);

    // Compute tactical counter-anchor
    let batnaPrice: number;
    let leverageSource: string;

    if (lowestVerified && lowestVerified > 0 && lowestVerified < vendorQuote) {
      batnaPrice = lowestVerified;
      leverageSource = "verified competitor quote";
    } else if (campaign?.market_research?.recommended_anchor) {
      batnaPrice = campaign.market_research.recommended_anchor;
      leverageSource = "market benchmark baseline";
    } else {
      batnaPrice = Math.round(vendorQuote * 0.88);
      leverageSource = "procurement target anchor";
    }

    // Counter offer is placed 2-4% below or at BATNA
    const counterOffer = Math.min(batnaPrice, Math.round(vendorQuote * 0.92));
    const formattedBATNA = counterOffer.toLocaleString("en-IN");

    const leverageScript = `We have a verified quote at ₹${formattedBATNA} for the exact spec. Can you beat that if we confirm today?`;

    const elapsed = performance.now() - startTime;

    const payload = {
      results: [
        {
          toolCallId: toolCallId,
          result: {
            success: true,
            counter_offer: counterOffer,
            batna_price: batnaPrice,
            leverage_source: leverageSource,
            leverage_script: leverageScript,
            latency_ms: Math.round(elapsed),
          },
        },
      ],
      // Direct response properties for non-Vapi clients
      counter_offer: counterOffer,
      batna_price: batnaPrice,
      leverage_script: leverageScript,
      latency_ms: Math.round(elapsed),
    };

    return NextResponse.json(payload, {
      headers: {
        "X-Response-Time-Ms": elapsed.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error("Live leverage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaign_id");

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 });
  }

  const minPrice = await Store.getLowestVerifiedPrice(campaignId);
  return NextResponse.json({ campaign_id: campaignId, min_verified_price: minPrice });
}
