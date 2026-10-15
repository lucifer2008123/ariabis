import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";
import { evaluateVendorCall } from "@/lib/scoring";
import { formatWhatsAppEvidenceMessage, sendWhatsAppNotification } from "@/lib/whatsapp";
import { formatTelegramEvidenceMessage, sendTelegramNotification } from "@/lib/telegram";
import { triggerEmailFallback } from "@/lib/email-fallback";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { campaign_id, mode } = await req.json();

    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
    }

    const campaign = await Store.getCampaign(campaign_id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const calls = await Store.getCallsForCampaign(campaign_id);
    if (!calls || calls.length === 0) {
      return NextResponse.json({ error: "No calls found for this campaign" }, { status: 400 });
    }

    // Update campaign status to NEGOTIATING
    campaign.status = "NEGOTIATING";
    await Store.saveCampaign(campaign);

    // Realistic simulation scenarios for vendors
    const vendorScenarios = [
      {
        vendor_name: calls[0]?.vendor_name || "BeanCraft Equipment Pvt Ltd",
        vendor_phone: calls[0]?.vendor_phone || "+918041239988",
        rep_name: "Rajesh Sharma",
        initial_quote: 220000,
        final_price: 189000,
        tax_and_shipping: true,
        specs_met: true,
        in_stock: true,
        payment: "cod_or_partial" as const,
        verbatim_quote: "If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.",
        quote_timestamp: 114,
        status: "QUOTE_VERIFIED" as const,
        transcript: [
          { speaker: "agent" as const, text: "Hi, calling on behalf of purchasing desk—looking to lock in an order for Commercial Espresso Machine today. Who handles commercial quotes?", start_time: 2, end_time: 8 },
          { speaker: "vendor" as const, text: "Hello! Rajesh here from BeanCraft. I handle commercial kitchen accounts.", start_time: 9, end_time: 14 },
          { speaker: "agent" as const, text: "Great. Can you confirm stock for the dual boiler system with rotary pump and 1-year on-site warranty?", start_time: 15, end_time: 22 },
          { speaker: "vendor" as const, text: "Yes, we have 4 units in stock right now, dual boiler with commercial rotary pump.", start_time: 23, end_time: 30 },
          { speaker: "agent" as const, text: "What is your best all-inclusive out-the-door price including GST and delivery?", start_time: 31, end_time: 38 },
          { speaker: "vendor" as const, text: "Our catalog price is 2,20,000 INR plus taxes.", start_time: 39, end_time: 46 },
          { speaker: "system" as const, text: "[TOOL TRIGGER: get_competitor_leverage(vendor_quote=220000) -> Returned BATNA counter-anchor: ₹1,85,000]", start_time: 47, end_time: 48 },
          { speaker: "agent" as const, text: "We have a verified quote at ₹1,85,000 for the exact spec. Can you beat that if we confirm today?", start_time: 49, end_time: 57 },
          { speaker: "vendor" as const, text: "Let me check with my GM... The lowest we can do is 1,92,000.", start_time: 58, end_time: 75 },
          { speaker: "agent" as const, text: "If we issue the purchase order immediately, can we settle at 1,89,000 all-in with the 2-year warranty?", start_time: 76, end_time: 85 },
          { speaker: "vendor" as const, text: "If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.", start_time: 86, end_time: 114 },
          { speaker: "agent" as const, text: "Perfect. Rajesh from BeanCraft, locking in 1,89,000 all-inclusive dual boiler with 2-year warranty. Correct?", start_time: 115, end_time: 125 },
          { speaker: "vendor" as const, text: "Yes, correct. Send over the GST details.", start_time: 126, end_time: 132 },
        ],
      },
      {
        vendor_name: calls[1]?.vendor_name || "Kaapi Solutions Hub",
        vendor_phone: calls[1]?.vendor_phone || "+918025591024",
        rep_name: "Pooja Hegde",
        initial_quote: 205000,
        final_price: 195000,
        tax_and_shipping: true,
        specs_met: true,
        in_stock: true,
        payment: "cod_or_partial" as const,
        verbatim_quote: "Best we can do is 1,95,000 with free Bangalore delivery.",
        quote_timestamp: 88,
        status: "QUOTE_VERIFIED" as const,
        transcript: [
          { speaker: "agent" as const, text: "Hi, calling from purchasing to lock in a commercial espresso unit. Who handles sales?", start_time: 2, end_time: 7 },
          { speaker: "vendor" as const, text: "Pooja from Kaapi Solutions. What machine are you looking for?", start_time: 8, end_time: 13 },
          { speaker: "agent" as const, text: "Commercial dual boiler with rotary pump and warranty.", start_time: 14, end_time: 19 },
          { speaker: "vendor" as const, text: "We have it available. Baseline is 2,05,000.", start_time: 20, end_time: 25 },
          { speaker: "system" as const, text: "[TOOL TRIGGER: get_competitor_leverage(vendor_quote=205000) -> Returned BATNA counter-anchor: ₹1,89,000 from BeanCraft]", start_time: 26, end_time: 27 },
          { speaker: "agent" as const, text: "We have an approved quote at 1,89,000 right now. Can you match or beat that?", start_time: 28, end_time: 35 },
          { speaker: "vendor" as const, text: "Best we can do is 1,95,000 with free Bangalore delivery.", start_time: 36, end_time: 88 },
        ],
      },
      {
        vendor_name: calls[2]?.vendor_name || "Barista Pro Supplies",
        vendor_phone: calls[2]?.vendor_phone || "+919845012345",
        rep_name: "Naveen K",
        initial_quote: 235000,
        final_price: 228000, // Exceeds ceiling +5% -> Disqualified
        tax_and_shipping: true,
        specs_met: true,
        in_stock: true,
        payment: "upfront_100" as const,
        verbatim_quote: "2,28,000 non-negotiable, 100% advance transfer required.",
        quote_timestamp: 62,
        status: "REJECTED" as const,
        transcript: [
          { speaker: "agent" as const, text: "Hi, calling to verify quote for espresso machine.", start_time: 2, end_time: 6 },
          { speaker: "vendor" as const, text: "2,28,000 non-negotiable, 100% advance transfer required.", start_time: 7, end_time: 62 },
        ],
      },
      {
        vendor_name: calls[3]?.vendor_name || "Espresso Direct Tech",
        vendor_phone: calls[3]?.vendor_phone || "+918026789012",
        rep_name: "Amit",
        initial_quote: 165000,
        final_price: 165000,
        tax_and_shipping: true,
        specs_met: false, // Missing rotary pump -> Spec Mismatch
        in_stock: true,
        payment: "cod_or_partial" as const,
        verbatim_quote: "That price is for single boiler vibration pump, rotary pump is not available.",
        quote_timestamp: 45,
        status: "SPEC_MISMATCH" as const,
        transcript: [
          { speaker: "agent" as const, text: "Can you confirm this has the rotary pump and dual boiler?", start_time: 2, end_time: 7 },
          { speaker: "vendor" as const, text: "That price is for single boiler vibration pump, rotary pump is not available.", start_time: 8, end_time: 45 },
        ],
      },
      {
        vendor_name: calls[4]?.vendor_name || "Karnataka Commercial Appliances",
        vendor_phone: calls[4]?.vendor_phone || "+918041122334",
        rep_name: "IVR",
        initial_quote: 0,
        final_price: 0,
        tax_and_shipping: false,
        specs_met: false,
        in_stock: false,
        payment: "cod_or_partial" as const,
        verbatim_quote: "The dialed number is currently busy.",
        quote_timestamp: 10,
        status: "LINE_BUSY" as const,
        transcript: [
          { speaker: "system" as const, text: "Carrier signal: Busy / Line Unreachable. Error Isolation applied.", start_time: 1, end_time: 6 },
        ],
      },
    ];

    // Process each call simulation
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const scenario = vendorScenarios[i] || vendorScenarios[0];

      // Step 1: DIALING
      await Store.updateCallStatus(call._id || call.id, "DIALING");

      // Step 2: NEGOTIATING
      if (scenario.status !== "LINE_BUSY") {
        await Store.updateCallStatus(call._id || call.id, "NEGOTIATING");
      }

      // Step 3: Complete & Audit
      const verifiedItems = scenario.specs_met ? campaign.request.mandatory_specs : [];
      const missingItems = scenario.specs_met ? [] : [campaign.request.mandatory_specs[1] || "Rotary pump"];

      const evalResult = evaluateVendorCall({
        request: campaign.request,
        call: {
          vendor_name: scenario.vendor_name,
          vendor_phone: scenario.vendor_phone,
          vendor_rating: call.vendor_rating || 4.2,
          vendor_reviews_count: call.vendor_reviews_count || 20,
          initial_quote: scenario.initial_quote,
          final_price: scenario.final_price,
          tax_and_shipping_included: scenario.tax_and_shipping,
          mandatory_specs_verified: verifiedItems,
          mandatory_specs_missing: missingItems,
          rep_name: scenario.rep_name,
          verbatim_quote: scenario.verbatim_quote,
          transcript: scenario.transcript,
          in_stock_today: scenario.in_stock,
          payment_flexibility: scenario.payment,
        },
      });

      const discountPct = scenario.initial_quote > 0
        ? Number((((scenario.initial_quote - scenario.final_price) / scenario.initial_quote) * 100).toFixed(2))
        : 0;

      await Store.saveCall({
        ...call,
        vendor_name: scenario.vendor_name,
        vendor_phone: scenario.vendor_phone,
        call_status: scenario.status,
        pricing: {
          initial_quote: scenario.initial_quote,
          final_negotiated_price: scenario.final_price,
          tax_and_shipping_included: scenario.tax_and_shipping,
          discount_pct: discountPct,
        },
        spec_verification: {
          all_specs_met: scenario.specs_met,
          verified_items: verifiedItems,
          missing_or_deviated: missingItems,
        },
        evidence: {
          rep_name: scenario.rep_name,
          verbatim_quote: scenario.verbatim_quote,
          audio_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mock-audio/8841-b.mp3`,
          quote_timestamp_sec: scenario.quote_timestamp,
          duration_sec: 142,
          transcript: scenario.transcript,
        },
        scoring: {
          total_score: evalResult.total_score,
          is_disqualified: evalResult.is_disqualified,
          disqualification_reason: evalResult.disqualification_reason,
          breakdown: evalResult.breakdown,
        },
        email_fallback: scenario.status === "LINE_BUSY"
          ? await triggerEmailFallback(scenario, campaign)
          : undefined,
      });
    }

    // Set Winner and finish campaign
    const updatedCalls = await Store.getCallsForCampaign(campaign_id);
    const eligible = updatedCalls.filter(c => c.call_status === "QUOTE_VERIFIED" && !c.scoring?.is_disqualified);
    eligible.sort((a, b) => (b.scoring?.total_score || 0) - (a.scoring?.total_score || 0));

    const winner = eligible[0];
    const runnerUp = eligible[1];

    if (winner) {
      campaign.status = "COMPLETED";
      campaign.winner_call_id = winner._id || winner.id;
      await Store.saveCampaign(campaign);

      const quoteSec = winner.evidence?.quote_timestamp_sec || 114;
      const mins = Math.floor(quoteSec / 60);
      const secs = quoteSec % 60;
      const formattedTimestamp = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const retailAvg = campaign.market_research?.online_avg_price || 224000;
      const savingsPct = ((retailAvg - winner.pricing.final_negotiated_price) / retailAvg) * 100;

      const whatsappMsg = formatWhatsAppEvidenceMessage({
        productName: campaign.request.product,
        discountPct: savingsPct,
        winnerVendorName: winner.vendor_name,
        repName: winner.evidence?.rep_name || "Rajesh Sharma",
        finalPrice: winner.pricing.final_negotiated_price,
        budgetTarget: campaign.request.budget_target,
        verifiedSpecs: winner.spec_verification?.verified_items || campaign.request.mandatory_specs,
        quoteTimestampFormatted: formattedTimestamp,
        verbatimQuote: winner.evidence?.verbatim_quote || "",
        runnerUpName: runnerUp?.vendor_name,
        runnerUpPrice: runnerUp?.pricing?.final_negotiated_price,
        onlineLowPrice: campaign.market_research?.online_low_price || 198000,
        portalUrl: campaign.portal_slug,
      });

      await sendWhatsAppNotification(campaign.user_phone, whatsappMsg);

      const telegramMsg = formatTelegramEvidenceMessage({
        productName: campaign.request.product,
        discountPct: savingsPct,
        winnerVendorName: winner.vendor_name,
        repName: winner.evidence?.rep_name || "Rajesh Sharma",
        finalPrice: winner.pricing?.final_negotiated_price || 0,
        budgetTarget: campaign.request.budget_target,
        verifiedSpecs: winner.spec_verification?.verified_items || campaign.request.mandatory_specs,
        quoteTimestampFormatted: formattedTimestamp,
        verbatimQuote: winner.evidence?.verbatim_quote || "",
        runnerUpName: runnerUp?.vendor_name,
        runnerUpPrice: runnerUp?.pricing?.final_negotiated_price,
        onlineLowPrice: campaign.market_research?.online_low_price || 198000,
        portalUrl: campaign.portal_slug,
      });

      const chatId = campaign.telegram_chat_id || process.env.TELEGRAM_DEFAULT_CHAT_ID;
      if (chatId) {
        await sendTelegramNotification(chatId, telegramMsg, campaign.portal_slug);
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
      winner: winner || null,
      calls_count: updatedCalls.length,
    });
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
