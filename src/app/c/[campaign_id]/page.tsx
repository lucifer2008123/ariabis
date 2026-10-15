import { notFound } from "next/navigation";
import { Store } from "@/lib/store";
import { DealRoom } from "@/components/DealRoom";

interface PageProps {
  params: Promise<{
    campaign_id: string;
  }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { campaign_id } = await params;

  let campaign = await Store.getCampaign(campaign_id);
  let calls = await Store.getCallsForCampaign(campaign_id);

  // If campaign_id matches demo or seed doesn't exist yet, seed demo instance
  if (!campaign) {
    if (campaign_id === "CMP-2026-8841" || campaign_id.startsWith("CMP-")) {
      campaign = {
        campaign_id: campaign_id,
        user_phone: "+919876543210",
        status: "COMPLETED",
        request: {
          product: "Commercial Espresso Machine",
          budget_target: 185000,
          budget_max: 215000,
          currency: "INR",
          mandatory_specs: [
            "Dual boiler system",
            "Rotary pump",
            "Min 1-year on-site warranty",
          ],
          location: "Bangalore, India",
        },
        market_research: {
          online_low_price: 198000,
          online_avg_price: 224000,
          reference_sources: ["indiamart", "retail_web"],
          recommended_anchor: 175000,
        },
        portal_slug: `http://localhost:3000/c/${campaign_id}`,
      };
      await Store.saveCampaign(campaign);

      // Seed default calls
      const defaultCalls = [
        {
          campaign_id: campaign_id,
          vendor_name: "BeanCraft Equipment Pvt Ltd",
          vendor_phone: "+918041239988",
          vendor_rating: 4.6,
          vendor_reviews_count: 38,
          call_status: "QUOTE_VERIFIED",
          pricing: {
            initial_quote: 220000,
            final_negotiated_price: 189000,
            tax_and_shipping_included: true,
            discount_pct: 14.09,
          },
          spec_verification: {
            all_specs_met: true,
            verified_items: [
              "Dual boiler system",
              "Rotary pump",
              "Min 1-year on-site warranty",
            ],
            missing_or_deviated: [],
          },
          evidence: {
            rep_name: "Rajesh Sharma",
            verbatim_quote:
              "If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.",
            audio_url: "/api/mock-audio/8841-b.wav",
            quote_timestamp_sec: 114,
            duration_sec: 142,
            transcript: [
              { speaker: "agent", text: "Hi, calling on behalf of purchasing desk—looking to lock in an order for Commercial Espresso Machine today. Who handles commercial quotes?", start_time: 2, end_time: 8 },
              { speaker: "vendor", text: "Hello! Rajesh here from BeanCraft. I handle commercial kitchen accounts.", start_time: 9, end_time: 14 },
              { speaker: "agent", text: "Great. Can you confirm stock for the dual boiler system with rotary pump and 1-year on-site warranty?", start_time: 15, end_time: 22 },
              { speaker: "vendor", text: "Yes, we have 4 units in stock right now, dual boiler with commercial rotary pump.", start_time: 23, end_time: 30 },
              { speaker: "agent", text: "What is your best all-inclusive out-the-door price including GST and delivery?", start_time: 31, end_time: 38 },
              { speaker: "vendor", text: "Our catalog price is 2,20,000 INR plus taxes.", start_time: 39, end_time: 46 },
              { speaker: "system", text: "[TOOL TRIGGER: get_competitor_leverage(vendor_quote=220000) -> Returned BATNA counter-anchor: ₹1,85,000]", start_time: 47, end_time: 48 },
              { speaker: "agent", text: "We have a verified quote at ₹1,85,000 for the exact spec. Can you beat that if we confirm today?", start_time: 49, end_time: 57 },
              { speaker: "vendor", text: "Let me check with my GM... The lowest we can do is 1,92,000.", start_time: 58, end_time: 75 },
              { speaker: "agent", text: "If we issue the purchase order immediately, can we settle at 1,89,000 all-in with the 2-year warranty?", start_time: 76, end_time: 85 },
              { speaker: "vendor", text: "If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.", start_time: 86, end_time: 114 },
              { speaker: "agent", text: "Perfect. Rajesh from BeanCraft, locking in 1,89,000 all-inclusive dual boiler with 2-year warranty. Correct?", start_time: 115, end_time: 125 },
              { speaker: "vendor", text: "Yes, correct. Send over the GST details.", start_time: 126, end_time: 132 },
            ],
          },
          scoring: {
            total_score: 95,
            is_disqualified: false,
            breakdown: {
              price_score: 41,
              spec_score: 25,
              evidence_score: 15,
              trust_score: 10,
              terms_score: 4,
            },
          },
        },
        {
          campaign_id: campaign_id,
          vendor_name: "Kaapi Solutions Hub",
          vendor_phone: "+918025591024",
          vendor_rating: 4.4,
          vendor_reviews_count: 24,
          call_status: "QUOTE_VERIFIED",
          pricing: {
            initial_quote: 205000,
            final_negotiated_price: 195000,
            tax_and_shipping_included: true,
            discount_pct: 4.88,
          },
          spec_verification: {
            all_specs_met: true,
            verified_items: [
              "Dual boiler system",
              "Rotary pump",
              "Min 1-year on-site warranty",
            ],
            missing_or_deviated: [],
          },
          evidence: {
            rep_name: "Pooja Hegde",
            verbatim_quote: "Best we can do is 1,95,000 with free Bangalore delivery.",
            audio_url: "/api/mock-audio/8841-b.wav",
            quote_timestamp_sec: 88,
            duration_sec: 110,
          },
          scoring: {
            total_score: 82,
            is_disqualified: false,
            breakdown: {
              price_score: 30,
              spec_score: 25,
              evidence_score: 13,
              trust_score: 10,
              terms_score: 4,
            },
          },
        },
        {
          campaign_id: campaign_id,
          vendor_name: "Barista Pro Supplies",
          vendor_phone: "+919845012345",
          vendor_rating: 4.8,
          vendor_reviews_count: 52,
          call_status: "REJECTED",
          pricing: {
            initial_quote: 235000,
            final_negotiated_price: 228000,
            tax_and_shipping_included: true,
            discount_pct: 2.98,
          },
          scoring: {
            total_score: 0,
            is_disqualified: true,
            disqualification_reason: "Price exceeded walk-away ceiling (+5%)",
            breakdown: { price_score: 0, spec_score: 0, evidence_score: 0, trust_score: 0, terms_score: 0 },
          },
        },
        {
          campaign_id: campaign_id,
          vendor_name: "Espresso Direct Tech",
          vendor_phone: "+918026789012",
          vendor_rating: 4.1,
          vendor_reviews_count: 14,
          call_status: "SPEC_MISMATCH",
          pricing: {
            initial_quote: 165000,
            final_negotiated_price: 165000,
            tax_and_shipping_included: true,
            discount_pct: 0,
          },
          scoring: {
            total_score: 0,
            is_disqualified: true,
            disqualification_reason: "Vendor refused rotary pump spec",
            breakdown: { price_score: 0, spec_score: 0, evidence_score: 0, trust_score: 0, terms_score: 0 },
          },
        },
        {
          campaign_id: campaign_id,
          vendor_name: "Karnataka Commercial Appliances",
          vendor_phone: "+918041122334",
          vendor_rating: 3.7,
          vendor_reviews_count: 9,
          call_status: "LINE_BUSY",
        },
      ];

      for (const dc of defaultCalls) {
        await Store.saveCall(dc);
      }

      calls = await Store.getCallsForCampaign(campaign_id);
    } else {
      notFound();
    }
  }

  return (
    <DealRoom
      initialCampaign={JSON.parse(JSON.stringify(campaign))}
      initialCalls={JSON.parse(JSON.stringify(calls))}
    />
  );
}
