import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICampaignRequest {
  product: string;
  budget_target: number;
  budget_max: number;
  currency: string;
  mandatory_specs: string[];
  location?: string;
}

export interface IMarketResearch {
  online_low_price: number;
  online_avg_price: number;
  reference_sources: string[];
  recommended_anchor: number;
}

export interface ICampaign extends Document {
  campaign_id: string;
  user_phone: string;
  status: "RESEARCHING" | "NEGOTIATING" | "COMPLETED";
  request: ICampaignRequest;
  market_research?: IMarketResearch;
  portal_slug: string;
  winner_call_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignRequestSchema = new Schema<ICampaignRequest>(
  {
    product: { type: String, required: true },
    budget_target: { type: Number, required: true },
    budget_max: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    mandatory_specs: [{ type: String, required: true }],
    location: { type: String },
  },
  { _id: false }
);

const MarketResearchSchema = new Schema<IMarketResearch>(
  {
    online_low_price: { type: Number, required: true },
    online_avg_price: { type: Number, required: true },
    reference_sources: [{ type: String }],
    recommended_anchor: { type: Number, required: true },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    campaign_id: { type: String, required: true, unique: true, index: true },
    user_phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["RESEARCHING", "NEGOTIATING", "COMPLETED"],
      default: "RESEARCHING",
      index: true,
    },
    request: { type: CampaignRequestSchema, required: true },
    market_research: { type: MarketResearchSchema },
    portal_slug: { type: String, required: true },
    winner_call_id: { type: String },
  },
  {
    timestamps: true,
    collection: "campaigns",
  }
);


export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
