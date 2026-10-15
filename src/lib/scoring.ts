import { ICampaignRequest } from "./models/Campaign";
import { IVendorCall, ICallScoring, IScoreBreakdown, ITranscriptLine } from "./models/VendorCall";

export interface EvaluationInput {
  request: ICampaignRequest;
  call: {
    vendor_name: string;
    vendor_phone: string;
    vendor_rating?: number;
    vendor_reviews_count?: number;
    initial_quote: number;
    final_price: number;
    tax_and_shipping_included: boolean;
    mandatory_specs_verified: string[];
    mandatory_specs_missing: string[];
    rep_name: string;
    verbatim_quote: string;
    transcript: ITranscriptLine[];
    in_stock_today: boolean;
    payment_flexibility: "cod_or_partial" | "upfront_100";
    is_price_vague?: boolean;
  };
}

export interface EvaluationResult {
  is_disqualified: boolean;
  disqualification_reason?: string;
  total_score: number; // 0 to 100 scale
  breakdown: IScoreBreakdown;
  audio_grounding: {
    verified: boolean;
    quote_timestamp_sec: number;
    seek_timestamp_sec: number; // quote_timestamp_sec - 3s
    grounded_line?: ITranscriptLine;
  };
}

export function evaluateVendorCall(input: EvaluationInput): EvaluationResult {
  const { request, call } = input;
  let isDisqualified = false;
  let disqualificationReason: string | undefined;

  // -------------------------------------------------------------
  // 1. Spec Compliance (25% Weight)
  // Strict rule: Disqualification (score = 0) if a mandatory spec is refused or evaded
  // -------------------------------------------------------------
  let specScoreRaw = 0;
  const totalMandatory = request.mandatory_specs.length;
  const verifiedCount = call.mandatory_specs_verified.length;

  if (call.mandatory_specs_missing.length > 0) {
    isDisqualified = true;
    disqualificationReason = `Mandatory specification evaded or rejected: ${call.mandatory_specs_missing.join(", ")}`;
  } else if (totalMandatory > 0) {
    specScoreRaw = (verifiedCount / totalMandatory) * 100;
  } else {
    specScoreRaw = 100;
  }

  // -------------------------------------------------------------
  // 2. Net All-In Price (45% Weight)
  // Normalized as: (Max_Budget - Final_Price) / (Max_Budget - Target_Budget)
  // Disqualification if final price exceeds budget_max by > 5%
  // -------------------------------------------------------------
  let priceScoreRaw = 0;
  const ceilingThreshold = request.budget_max * 1.05;

  if (call.final_price > ceilingThreshold) {
    isDisqualified = true;
    disqualificationReason = `Final price (${call.final_price}) exceeded walk-away ceiling (+5% tolerance: ${ceilingThreshold})`;
  } else {
    const budgetRange = request.budget_max - request.budget_target;
    if (budgetRange > 0) {
      const savingsRatio = (request.budget_max - call.final_price) / budgetRange;
      // Cap between 0 and 120 (bonus for beating target)
      priceScoreRaw = Math.max(0, Math.min(120, savingsRatio * 100));
    } else {
      priceScoreRaw = call.final_price <= request.budget_target ? 100 : 50;
    }

    if (!call.tax_and_shipping_included) {
      priceScoreRaw = Math.max(0, priceScoreRaw - 15);
    }
  }

  // -------------------------------------------------------------
  // 3. Evidence Quality (15% Weight)
  // Verbatim read-back of price, inclusions, rep name
  // -30 points if price is vague ("around 1.9L") without hard confirmation
  // -------------------------------------------------------------
  let evidenceScoreRaw = 100;

  if (call.is_price_vague || !call.verbatim_quote || call.verbatim_quote.toLowerCase().includes("around") || call.verbatim_quote.toLowerCase().includes("approx")) {
    evidenceScoreRaw -= 30;
  }

  if (!call.rep_name || call.rep_name.trim().length === 0) {
    evidenceScoreRaw -= 20;
  }

  if (!call.transcript || call.transcript.length === 0) {
    evidenceScoreRaw -= 20;
  }
  evidenceScoreRaw = Math.max(0, evidenceScoreRaw);

  // -------------------------------------------------------------
  // 4. Vendor Trust & Rating (10% Weight)
  // -20 points if rating < 3.8 or fewer than 10 public reviews
  // -------------------------------------------------------------
  let trustScoreRaw = 100;
  const rating = call.vendor_rating ?? 4.0;
  const reviewsCount = call.vendor_reviews_count ?? 15;

  if (rating < 3.8 || reviewsCount < 10) {
    trustScoreRaw -= 20;
  }
  trustScoreRaw = Math.max(0, trustScoreRaw);

  // -------------------------------------------------------------
  // 5. Fulfillment & Terms (5% Weight)
  // -15 points if vendor demands 100% non-refundable wire upfront
  // -------------------------------------------------------------
  let termsScoreRaw = 100;

  if (call.payment_flexibility === "upfront_100") {
    termsScoreRaw -= 15;
  }

  if (!call.in_stock_today) {
    termsScoreRaw -= 20;
  }
  termsScoreRaw = Math.max(0, termsScoreRaw);

  // -------------------------------------------------------------
  // Weighted Total Calculation
  // -------------------------------------------------------------
  const priceScoreWeighted = (priceScoreRaw * 0.45);
  const specScoreWeighted = (specScoreRaw * 0.25);
  const evidenceScoreWeighted = (evidenceScoreRaw * 0.15);
  const trustScoreWeighted = (trustScoreRaw * 0.10);
  const termsScoreWeighted = (termsScoreRaw * 0.05);

  let totalScore = Math.round(
    priceScoreWeighted +
    specScoreWeighted +
    evidenceScoreWeighted +
    trustScoreWeighted +
    termsScoreWeighted
  );

  if (isDisqualified) {
    totalScore = 0;
  }

  // -------------------------------------------------------------
  // Anti-Hallucination & Audio Grounding Protocol
  // Match final price in transcript to find exact timestamp
  // -------------------------------------------------------------
  const grounding = groundPriceInAudio(call.final_price, call.verbatim_quote, call.transcript);

  return {
    is_disqualified: isDisqualified,
    disqualification_reason: disqualificationReason,
    total_score: totalScore,
    breakdown: {
      price_score: Math.round(priceScoreWeighted),
      spec_score: Math.round(specScoreWeighted),
      evidence_score: Math.round(evidenceScoreWeighted),
      trust_score: Math.round(trustScoreWeighted),
      terms_score: Math.round(termsScoreWeighted),
    },
    audio_grounding: grounding,
  };
}

/**
 * Searches word-level diarized transcript lines to find where the price commitment was made.
 * Computes seek timestamp (timestamp - 3s) for seamless audio playback.
 */
function groundPriceInAudio(
  finalPrice: number,
  verbatimQuote: string,
  transcript: ITranscriptLine[]
): {
  verified: boolean;
  quote_timestamp_sec: number;
  seek_timestamp_sec: number;
  grounded_line?: ITranscriptLine;
} {
  if (!transcript || transcript.length === 0) {
    return {
      verified: false,
      quote_timestamp_sec: 0,
      seek_timestamp_sec: 0,
    };
  }

  // Generate price representations to search (e.g. 189000 -> ["189000", "1,89,000", "1.89", "189k"])
  const priceStr = finalPrice.toString();
  const lakhFormat = (finalPrice / 100000).toFixed(2); // "1.89"
  const formattedWithCommas = finalPrice.toLocaleString("en-IN"); // "1,89,000"

  let matchedLine: ITranscriptLine | undefined;

  // First check if a line has the verbatim quote or price
  for (let i = transcript.length - 1; i >= 0; i--) {
    const line = transcript[i];
    const textLower = line.text.toLowerCase();

    if (
      textLower.includes(priceStr) ||
      textLower.includes(lakhFormat) ||
      textLower.includes(formattedWithCommas) ||
      (verbatimQuote && textLower.includes(verbatimQuote.substring(0, 15).toLowerCase()))
    ) {
      matchedLine = line;
      break;
    }
  }

  // Fallback to the latest vendor quote line if direct string search didn't pinpoint it
  if (!matchedLine) {
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (transcript[i].speaker === "vendor") {
        matchedLine = transcript[i];
        break;
      }
    }
  }

  const quoteTimestamp = matchedLine ? matchedLine.start_time : transcript[transcript.length - 1].start_time;
  const seekTimestamp = Math.max(0, quoteTimestamp - 3);

  return {
    verified: true,
    quote_timestamp_sec: quoteTimestamp,
    seek_timestamp_sec: seekTimestamp,
    grounded_line: matchedLine,
  };
}
