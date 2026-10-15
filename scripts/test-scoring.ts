/**
 * Unit Test Suite for HaggleOS 5-Dimension Scoring Engine & Audio Grounding
 * Validates PRD Section 6 (DATA-02) Rules and Edge Cases
 */

import { evaluateVendorCall } from "../src/lib/scoring";
import { ICampaignRequest } from "../src/lib/models/Campaign";

const baseRequest: ICampaignRequest = {
  product: "Commercial Espresso Machine",
  budget_target: 185000,
  budget_max: 215000,
  currency: "INR",
  mandatory_specs: [
    "Dual boiler system",
    "Rotary pump",
    "Min 1-year on-site warranty",
  ],
};

function runTests() {
  console.log("=================================================");
  console.log(" RUNNING SCORING ENGINE & AUDIO GROUNDING TESTS ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail}`);
      failed++;
    }
  }

  // TEST 1: Ideal Winning Vendor (BeanCraft)
  {
    const result = evaluateVendorCall({
      request: baseRequest,
      call: {
        vendor_name: "BeanCraft Equipment Pvt Ltd",
        vendor_phone: "+918041239988",
        vendor_rating: 4.6,
        vendor_reviews_count: 38,
        initial_quote: 220000,
        final_price: 189000,
        tax_and_shipping_included: true,
        mandatory_specs_verified: baseRequest.mandatory_specs,
        mandatory_specs_missing: [],
        rep_name: "Rajesh Sharma",
        verbatim_quote: "If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.",
        transcript: [
          { speaker: "agent", text: "Can you confirm specs?", start_time: 10, end_time: 15 },
          { speaker: "vendor", text: "If you confirm today, we will do 1,89,000 all-inclusive with 2-year warranty.", start_time: 114, end_time: 122 },
        ],
        in_stock_today: true,
        payment_flexibility: "cod_or_partial",
      },
    });

    assert("Ideal Vendor is NOT disqualified", !result.is_disqualified);
    assert("Ideal Vendor achieves high score (>85)", result.total_score >= 85, `Score was: ${result.total_score}`);
    assert("Audio Grounding locates quote @ 114s", result.audio_grounding.quote_timestamp_sec === 114);
    assert("Audio Grounding seek timestamp is 111s (quote - 3s)", result.audio_grounding.seek_timestamp_sec === 111);
  }

  // TEST 2: Spec Refusal / Evasion -> Immediate Disqualification (Score = 0)
  {
    const result = evaluateVendorCall({
      request: baseRequest,
      call: {
        vendor_name: "Defective Specs Inc",
        vendor_phone: "+918000000001",
        vendor_rating: 4.5,
        vendor_reviews_count: 30,
        initial_quote: 170000,
        final_price: 165000,
        tax_and_shipping_included: true,
        mandatory_specs_verified: ["Dual boiler system", "Min 1-year on-site warranty"],
        mandatory_specs_missing: ["Rotary pump"], // Spec missing!
        rep_name: "Agent X",
        verbatim_quote: "We don't have rotary pump.",
        transcript: [],
        in_stock_today: true,
        payment_flexibility: "cod_or_partial",
      },
    });

    assert("Spec Refusal triggers immediate disqualification", result.is_disqualified);
    assert("Spec Refusal yields score = 0", result.total_score === 0);
  }

  // TEST 3: Price Exceeds Max Ceiling by > 5% -> Disqualification
  {
    // Max budget is 215,000. 5% tolerance ceiling = 225,750.
    const result = evaluateVendorCall({
      request: baseRequest,
      call: {
        vendor_name: "Overpriced Vendor",
        vendor_phone: "+918000000002",
        vendor_rating: 4.8,
        vendor_reviews_count: 50,
        initial_quote: 240000,
        final_price: 228000, // Exceeds ceiling +5%
        tax_and_shipping_included: true,
        mandatory_specs_verified: baseRequest.mandatory_specs,
        mandatory_specs_missing: [],
        rep_name: "Sales",
        verbatim_quote: "2,28,000 is our best.",
        transcript: [],
        in_stock_today: true,
        payment_flexibility: "cod_or_partial",
      },
    });

    assert("Price exceeding ceiling (>5%) triggers disqualification", result.is_disqualified);
    assert("Price exceeding ceiling yields score = 0", result.total_score === 0);
  }

  // TEST 4: Evidence Quality Penalty (-30 for vague price)
  {
    const result = evaluateVendorCall({
      request: baseRequest,
      call: {
        vendor_name: "Vague Vendor",
        vendor_phone: "+918000000003",
        vendor_rating: 4.5,
        vendor_reviews_count: 20,
        initial_quote: 210000,
        final_price: 195000,
        tax_and_shipping_included: true,
        mandatory_specs_verified: baseRequest.mandatory_specs,
        mandatory_specs_missing: [],
        rep_name: "Ramesh",
        verbatim_quote: "It will be around 1.95L approximately",
        is_price_vague: true,
        transcript: [],
        in_stock_today: true,
        payment_flexibility: "cod_or_partial",
      },
    });

    assert("Vague price suffers evidence quality penalty", result.breakdown.evidence_score <= 10);
  }

  // TEST 5: Vendor Trust Penalty (rating < 3.8 or < 10 reviews)
  {
    const result = evaluateVendorCall({
      request: baseRequest,
      call: {
        vendor_name: "Low Trust Vendor",
        vendor_phone: "+918000000004",
        vendor_rating: 3.5, // Below 3.8
        vendor_reviews_count: 5, // Below 10
        initial_quote: 200000,
        final_price: 188000,
        tax_and_shipping_included: true,
        mandatory_specs_verified: baseRequest.mandatory_specs,
        mandatory_specs_missing: [],
        rep_name: "Suresh",
        verbatim_quote: "Final 1,88,000 confirmed.",
        transcript: [],
        in_stock_today: true,
        payment_flexibility: "cod_or_partial",
      },
    });

    assert("Low rating receives -20 point penalty on trust dimension", result.breakdown.trust_score <= 8);
  }

  // TEST 6: Payment Terms Penalty (100% upfront wire demanded)
  {
    const result = evaluateVendorCall({
      request: baseRequest,
      call: {
        vendor_name: "Strict Wire Vendor",
        vendor_phone: "+918000000005",
        vendor_rating: 4.5,
        vendor_reviews_count: 20,
        initial_quote: 200000,
        final_price: 188000,
        tax_and_shipping_included: true,
        mandatory_specs_verified: baseRequest.mandatory_specs,
        mandatory_specs_missing: [],
        rep_name: "Vijay",
        verbatim_quote: "1,88,000 confirmed.",
        transcript: [],
        in_stock_today: true,
        payment_flexibility: "upfront_100", // Demands 100% wire
      },
    });

    assert("100% upfront wire triggers fulfillment terms penalty", result.breakdown.terms_score < 5);
  }

  console.log("\n-------------------------------------------------");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("-------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
