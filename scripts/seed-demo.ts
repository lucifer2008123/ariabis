/**
 * Seed Script: Seeds Blueprint Example CMP-2026-8841
 */

import { Store } from "../src/lib/store";

async function seed() {
  console.log("Seeding HaggleOS Demo Campaign CMP-2026-8841...");

  const campaignId = "CMP-2026-8841";

  await Store.saveCampaign({
    campaign_id: campaignId,
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
    portal_slug: `http://localhost:3000/c/${campaignId}`,
  });

  const calls = [
    {
      campaign_id: campaignId,
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
      campaign_id: campaignId,
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
      campaign_id: campaignId,
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
      campaign_id: campaignId,
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
      campaign_id: campaignId,
      vendor_name: "Karnataka Commercial Appliances",
      vendor_phone: "+918041122334",
      vendor_rating: 3.7,
      vendor_reviews_count: 9,
      call_status: "LINE_BUSY",
    },
  ];

  for (const c of calls) {
    await Store.saveCall(c);
  }

  console.log(`✅ Seeded campaign ${campaignId} with ${calls.length} vendor calls successfully.`);
}

seed();
