import mongoose, { Schema, Document, Model } from "mongoose";

export type CallStatus =
  | "QUEUED"
  | "DIALING"
  | "NEGOTIATING"
  | "QUOTE_VERIFIED"
  | "LINE_BUSY"
  | "VOICEMAIL"
  | "SPEC_MISMATCH"
  | "REJECTED";

export interface ITranscriptLine {
  speaker: "agent" | "vendor" | "system";
  text: string;
  start_time: number;
  end_time: number;
}

export interface IVendorPricing {
  initial_quote: number;
  final_negotiated_price: number;
  tax_and_shipping_included: boolean;
  discount_pct: number;
}

export interface ISpecVerification {
  all_specs_met: boolean;
  verified_items: string[];
  missing_or_deviated: string[];
}

export interface ICallEvidence {
  rep_name: string;
  verbatim_quote: string;
  audio_url: string;
  quote_timestamp_sec: number;
  duration_sec?: number;
  transcript?: ITranscriptLine[];
}

export interface IScoreBreakdown {
  price_score: number;       // 45% weight
  spec_score: number;        // 25% weight
  evidence_score: number;    // 15% weight
  trust_score: number;       // 10% weight
  terms_score: number;       // 5% weight
}

export interface ICallScoring {
  total_score: number;
  is_disqualified: boolean;
  disqualification_reason?: string;
  breakdown: IScoreBreakdown;
}

export interface IVendorCall extends Document {
  campaign_id: string;
  vendor_name: string;
  vendor_phone: string;
  vendor_rating?: number;
  vendor_reviews_count?: number;
  call_status: CallStatus;
  pricing?: IVendorPricing;
  spec_verification?: ISpecVerification;
  evidence?: ICallEvidence;
  scoring?: ICallScoring;
  lead_time_days?: number;
  in_stock_today?: boolean;
  payment_flexibility?: "cod_or_partial" | "upfront_100";
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptLineSchema = new Schema<ITranscriptLine>(
  {
    speaker: { type: String, enum: ["agent", "vendor", "system"], required: true },
    text: { type: String, required: true },
    start_time: { type: Number, required: true },
    end_time: { type: Number, required: true },
  },
  { _id: false }
);

const PricingSchema = new Schema<IVendorPricing>(
  {
    initial_quote: { type: Number, required: true },
    final_negotiated_price: { type: Number, required: true },
    tax_and_shipping_included: { type: Boolean, default: true },
    discount_pct: { type: Number, default: 0 },
  },
  { _id: false }
);

const SpecVerificationSchema = new Schema<ISpecVerification>(
  {
    all_specs_met: { type: Boolean, default: false },
    verified_items: [{ type: String }],
    missing_or_deviated: [{ type: String }],
  },
  { _id: false }
);

const EvidenceSchema = new Schema<ICallEvidence>(
  {
    rep_name: { type: String, default: "" },
    verbatim_quote: { type: String, default: "" },
    audio_url: { type: String, default: "" },
    quote_timestamp_sec: { type: Number, default: 0 },
    duration_sec: { type: Number, default: 0 },
    transcript: [TranscriptLineSchema],
  },
  { _id: false }
);

const ScoringSchema = new Schema<ICallScoring>(
  {
    total_score: { type: Number, default: 0 },
    is_disqualified: { type: Boolean, default: false },
    disqualification_reason: { type: String },
    breakdown: {
      price_score: { type: Number, default: 0 },
      spec_score: { type: Number, default: 0 },
      evidence_score: { type: Number, default: 0 },
      trust_score: { type: Number, default: 0 },
      terms_score: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const VendorCallSchema = new Schema<IVendorCall>(
  {
    campaign_id: { type: String, required: true, index: true },
    vendor_name: { type: String, required: true },
    vendor_phone: { type: String, required: true },
    vendor_rating: { type: Number, default: 4.0 },
    vendor_reviews_count: { type: Number, default: 10 },
    call_status: {
      type: String,
      enum: [
        "QUEUED",
        "DIALING",
        "NEGOTIATING",
        "QUOTE_VERIFIED",
        "LINE_BUSY",
        "VOICEMAIL",
        "SPEC_MISMATCH",
        "REJECTED",
      ],
      default: "QUEUED",
      index: true,
    },
    pricing: { type: PricingSchema },
    spec_verification: { type: SpecVerificationSchema },
    evidence: { type: EvidenceSchema },
    scoring: { type: ScoringSchema },
    lead_time_days: { type: Number, default: 0 },
    in_stock_today: { type: Boolean, default: true },
    payment_flexibility: {
      type: String,
      enum: ["cod_or_partial", "upfront_100"],
      default: "cod_or_partial",
    },
  },
  {
    timestamps: true,
    collection: "vendor_calls",
  }
);

// High-speed compound index for mid-call BATNA lookup (<280ms)
VendorCallSchema.index({ campaign_id: 1, "pricing.final_negotiated_price": 1 });
VendorCallSchema.index({ campaign_id: 1, call_status: 1 });

export const VendorCall: Model<IVendorCall> =
  mongoose.models.VendorCall || mongoose.model<IVendorCall>("VendorCall", VendorCallSchema);
