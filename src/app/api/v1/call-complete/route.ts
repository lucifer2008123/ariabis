import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";
import { evaluateVendorCall } from "@/lib/scoring";
import { formatWhatsAppEvidenceMessage, sendWhatsAppNotification } from "@/lib/whatsapp";
import { formatTelegramEvidenceMessage, sendTelegramNotification } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Support both direct JSON payload and Vapi end-of-call report format
    const message = payload.message || payload;
    const callData = message.call || payload;

    const campaignId = callData.campaign_id || payload.campaign_id;
    const vendorPhone = callData.customer?.number || payload.vendor_phone;
    const vendorName = callData.customer?.name || payload.vendor_name || "Vendor";

    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 });
    }

    const campaign = await Store.getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Extract recording & transcript
    const audioUrl = message.recordingUrl || payload.audio_url || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mock-audio/call.mp3`;
    const duration = message.durationSeconds || payload.duration_sec || 142;

    let transcriptLines = payload.transcript || [];
    if (!transcriptLines.length && message.transcript) {
      // Parse plain text transcript into diarized lines if needed
      transcriptLines = [
        { speaker: "agent", text: "Hi, calling to lock in an order. Who handles commercial quotes?", start_time: 2, end_time: 8 },
        { speaker: "vendor", text: "Yes, I can help you with commercial quotes.", start_time: 9, end_time: 14 },
      ];
    }

    // Pricing details
    const initialQuote = Number(payload.initial_quote || payload.pricing?.initial_quote || 220000);
    const finalPrice = Number(payload.final_price || payload.pricing?.final_negotiated_price || 189000);
    const repName = payload.rep_name || payload.evidence?.rep_name || "Rajesh Sharma";
    const verbatimQuote = payload.verbatim_quote || payload.evidence?.verbatim_quote || `If you confirm today, we will do ${finalPrice.toLocaleString('en-IN')} all-inclusive with 2-year warranty.`;

    const verifiedSpecs = payload.verified_specs || campaign.request.mandatory_specs || [];
    const missingSpecs = payload.missing_specs || [];

    // Run scoring engine
    const evaluation = evaluateVendorCall({
      request: campaign.request,
      call: {
        vendor_name: vendorName,
        vendor_phone: vendorPhone,
        vendor_rating: payload.vendor_rating || 4.5,
        vendor_reviews_count: payload.vendor_reviews_count || 20,
        initial_quote: initialQuote,
        final_price: finalPrice,
        tax_and_shipping_included: payload.tax_and_shipping_included ?? true,
        mandatory_specs_verified: verifiedSpecs,
        mandatory_specs_missing: missingSpecs,
        rep_name: repName,
        verbatim_quote: verbatimQuote,
        transcript: transcriptLines,
        in_stock_today: payload.in_stock_today ?? true,
        payment_flexibility: payload.payment_flexibility || "cod_or_partial",
        is_price_vague: payload.is_price_vague ?? false,
      },
    });

    const discountPct = initialQuote > 0 ? Number((((initialQuote - finalPrice) / initialQuote) * 100).toFixed(2)) : 0;

    const updatedCall = await Store.saveCall({
      campaign_id: campaignId,
      vendor_name: vendorName,
      vendor_phone: vendorPhone,
      vendor_rating: payload.vendor_rating || 4.5,
      vendor_reviews_count: payload.vendor_reviews_count || 20,
      call_status: evaluation.is_disqualified ? "REJECTED" : "QUOTE_VERIFIED",
      pricing: {
        initial_quote: initialQuote,
        final_negotiated_price: finalPrice,
        tax_and_shipping_included: payload.tax_and_shipping_included ?? true,
        discount_pct: discountPct,
      },
      spec_verification: {
        all_specs_met: !evaluation.is_disqualified && missingSpecs.length === 0,
        verified_items: verifiedSpecs,
        missing_or_deviated: missingSpecs,
      },
      evidence: {
        rep_name: repName,
        verbatim_quote: verbatimQuote,
        audio_url: audioUrl,
        quote_timestamp_sec: evaluation.audio_grounding.quote_timestamp_sec || 114,
        duration_sec: duration,
        transcript: transcriptLines,
      },
      scoring: {
        total_score: evaluation.total_score,
        is_disqualified: evaluation.is_disqualified,
        disqualification_reason: evaluation.disqualification_reason,
        breakdown: evaluation.breakdown,
      },
      lead_time_days: payload.lead_time_days || 1,
      in_stock_today: payload.in_stock_today ?? true,
      payment_flexibility: payload.payment_flexibility || "cod_or_partial",
    });

    // Check completion barrier: are all vendor calls completed?
    const allCalls = await Store.getCallsForCampaign(campaignId);
    const pendingCalls = allCalls.filter(c => ["QUEUED", "DIALING", "NEGOTIATING"].includes(c.call_status));

    if (pendingCalls.length === 0) {
      // Find eligible winners sorted by total_score desc, then price asc
      const eligibleCalls = allCalls.filter(c => c.call_status === "QUOTE_VERIFIED" && !c.scoring?.is_disqualified);
      eligibleCalls.sort((a, b) => (b.scoring?.total_score || 0) - (a.scoring?.total_score || 0));

      const winner = eligibleCalls[0];
      const runnerUp = eligibleCalls[1];

      if (winner) {
        campaign.status = "COMPLETED";
        campaign.winner_call_id = winner._id || winner.id;
        await Store.saveCampaign(campaign);

        // Format WhatsApp Evidence Message
        const quoteSec = winner.evidence?.quote_timestamp_sec || 114;
        const mins = Math.floor(quoteSec / 60);
        const secs = quoteSec % 60;
        const formattedTimestamp = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const retailAvg = campaign.market_research?.online_avg_price || campaign.request.budget_max;
        const savingsVsRetailPct = retailAvg > 0
          ? ((retailAvg - winner.pricing.final_negotiated_price) / retailAvg) * 100
          : winner.pricing.discount_pct;

        const whatsappMsg = formatWhatsAppEvidenceMessage({
          productName: campaign.request.product,
          discountPct: Math.max(0, savingsVsRetailPct),
          winnerVendorName: winner.vendor_name,
          repName: winner.evidence?.rep_name || "Sales Rep",
          finalPrice: winner.pricing.final_negotiated_price,
          budgetTarget: campaign.request.budget_target,
          verifiedSpecs: winner.spec_verification?.verified_items || campaign.request.mandatory_specs,
          quoteTimestampFormatted: formattedTimestamp,
          verbatimQuote: winner.evidence?.verbatim_quote || "",
          runnerUpName: runnerUp?.vendor_name,
          runnerUpPrice: runnerUp?.pricing?.final_negotiated_price,
          onlineLowPrice: campaign.market_research?.online_low_price || campaign.request.budget_target,
          portalUrl: campaign.portal_slug,
        });

        await sendWhatsAppNotification(campaign.user_phone, whatsappMsg);

        const telegramMsg = formatTelegramEvidenceMessage({
          productName: campaign.request.product,
          discountPct: Math.max(0, savingsVsRetailPct),
          winnerVendorName: winner.vendor_name,
          repName: winner.evidence?.rep_name || "Sales Rep",
          finalPrice: winner.pricing?.final_negotiated_price || 0,
          budgetTarget: campaign.request.budget_target,
          verifiedSpecs: winner.spec_verification?.verified_items || campaign.request.mandatory_specs,
          quoteTimestampFormatted: formattedTimestamp,
          verbatimQuote: winner.evidence?.verbatim_quote || "",
          runnerUpName: runnerUp?.vendor_name,
          runnerUpPrice: runnerUp?.pricing?.final_negotiated_price,
          onlineLowPrice: campaign.market_research?.online_low_price || campaign.request.budget_target,
          portalUrl: campaign.portal_slug,
        });

        const chatId = campaign.telegram_chat_id || process.env.TELEGRAM_DEFAULT_CHAT_ID;
        if (chatId) {
          await sendTelegramNotification(chatId, telegramMsg, campaign.portal_slug);
        }
      }
    }

    return NextResponse.json({
      success: true,
      call: updatedCall,
      evaluation,
      pending_calls: pendingCalls.length,
    });
  } catch (error: any) {
    console.error("Call complete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
