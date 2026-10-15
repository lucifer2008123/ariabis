import fs from "fs";
import path from "path";
import { connectToDatabase } from "./db";
import { Campaign } from "./models/Campaign";
import { VendorCall, CallStatus } from "./models/VendorCall";
import { eventBus } from "./events";

// File-backed persistence path for development
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

declare global {
  // eslint-disable-next-line no-var
  var globalCampaigns: Map<string, any> | undefined;
  // eslint-disable-next-line no-var
  var globalCalls: Map<string, any> | undefined;
}

function loadPersistedData(): { campaigns: [string, any][]; calls: [string, any][] } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed reading store.json:", e);
  }
  return { campaigns: [], calls: [] };
}

function persistData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      campaigns: Array.from(memoryCampaigns.entries()),
      calls: Array.from(memoryCalls.entries()),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    // Silently continue if file write fails
  }
}

const initialData = loadPersistedData();
const memoryCampaigns: Map<string, any> =
  global.globalCampaigns || new Map(initialData.campaigns);
const memoryCalls: Map<string, any> =
  global.globalCalls || new Map(initialData.calls);

if (!global.globalCampaigns) global.globalCampaigns = memoryCampaigns;
if (!global.globalCalls) global.globalCalls = memoryCalls;

// Default Demo Blueprint Campaign Generator
function createBlueprintDemoCampaign(campaignId = "CMP-2026-8841") {
  return {
    campaign_id: campaignId,
    user_phone: "+919876543210",
    status: "RESEARCHING",
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
  };
}

export const Store = {
  // --- Campaign Methods ---
  async getCampaign(campaignId: string): Promise<any | null> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const camp = await Campaign.findOne({ campaign_id: campaignId }).lean();
        if (camp) return camp;
      } catch (e) {}
    }

    let camp = memoryCampaigns.get(campaignId);
    if (!camp && (campaignId === "CMP-2026-8841" || campaignId.startsWith("CMP-"))) {
      // Auto-provision demo campaign if missing
      camp = createBlueprintDemoCampaign(campaignId);
      await this.saveCampaign(camp);

      // Seed candidate vendors
      const defaultVendors = [
        { name: "BeanCraft Equipment Pvt Ltd", phone: "+918041239988", rating: 4.6, reviews: 38 },
        { name: "Kaapi Solutions Hub", phone: "+918025591024", rating: 4.4, reviews: 24 },
        { name: "Barista Pro Supplies", phone: "+919845012345", rating: 4.8, reviews: 52 },
        { name: "Espresso Direct Tech", phone: "+918026789012", rating: 4.1, reviews: 14 },
        { name: "Karnataka Commercial Appliances", phone: "+918041122334", rating: 3.7, reviews: 9 },
      ];

      for (const v of defaultVendors) {
        await this.saveCall({
          campaign_id: campaignId,
          vendor_name: v.name,
          vendor_phone: v.phone,
          vendor_rating: v.rating,
          vendor_reviews_count: v.reviews,
          call_status: "QUEUED",
        });
      }
    }

    return camp || null;
  },

  async saveCampaign(campaignData: any): Promise<any> {
    const db = await connectToDatabase();
    let saved = campaignData;
    if (db) {
      try {
        saved = await Campaign.findOneAndUpdate(
          { campaign_id: campaignData.campaign_id },
          { $set: campaignData },
          { upsert: true, new: true }
        ).lean();
      } catch (err) {
        console.warn("Failed saving campaign to Mongo, caching in memory", err);
      }
    }
    const enriched = {
      ...campaignData,
      updatedAt: new Date(),
    };
    memoryCampaigns.set(campaignData.campaign_id, enriched);
    persistData();

    eventBus.emit(`campaign:${campaignData.campaign_id}`, enriched);
    return enriched;
  },

  // --- Vendor Call Methods ---
  async getCallsForCampaign(campaignId: string): Promise<any[]> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const calls = await VendorCall.find({ campaign_id: campaignId })
          .sort({ "pricing.final_negotiated_price": 1 })
          .lean();
        if (calls && calls.length > 0) return calls;
      } catch (err) {
        console.warn("Error fetching calls from Mongo:", err);
      }
    }
    const calls: any[] = [];
    for (const call of memoryCalls.values()) {
      if (call.campaign_id === campaignId) {
        calls.push(call);
      }
    }

    if (calls.length === 0 && (campaignId === "CMP-2026-8841" || campaignId.startsWith("CMP-"))) {
      // Trigger auto-provision
      await this.getCampaign(campaignId);
      for (const call of memoryCalls.values()) {
        if (call.campaign_id === campaignId) {
          calls.push(call);
        }
      }
    }

    return calls.sort((a, b) => {
      const pA = a.pricing?.final_negotiated_price || 999999999;
      const pB = b.pricing?.final_negotiated_price || 999999999;
      return pA - pB;
    });
  },

  async getCall(callId: string): Promise<any | null> {
    const db = await connectToDatabase();
    if (db) {
      try {
        const call = await VendorCall.findById(callId).lean();
        if (call) return call;
      } catch (e) {}
    }
    return memoryCalls.get(callId) || null;
  },

  async saveCall(callData: any): Promise<any> {
    const callId = callData._id ? String(callData._id) : callData.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const enriched = {
      ...callData,
      _id: callId,
      id: callId,
      updatedAt: new Date(),
    };

    const db = await connectToDatabase();
    if (db) {
      try {
        await VendorCall.findOneAndUpdate(
          { campaign_id: enriched.campaign_id, vendor_name: enriched.vendor_name },
          { $set: enriched },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn("Error saving call to Mongo:", err);
      }
    }

    memoryCalls.set(callId, enriched);
    persistData();

    // Broadcast live event for SSE
    eventBus.emit(`stream:${enriched.campaign_id}`, {
      type: "CALL_UPDATE",
      call: enriched,
    });

    return enriched;
  },

  async updateCallStatus(callId: string, status: CallStatus, patchData: Partial<any> = {}) {
    let call = memoryCalls.get(callId);
    if (!call) {
      for (const c of memoryCalls.values()) {
        if (c._id === callId || c.id === callId) {
          call = c;
          break;
        }
      }
    }

    if (call) {
      Object.assign(call, patchData, { call_status: status, updatedAt: new Date() });
      await this.saveCall(call);
      return call;
    }
    return null;
  },

  // High-performance mid-call BATNA lookup (<280ms)
  async getLowestVerifiedPrice(campaignId: string): Promise<number | null> {
    const start = performance.now();
    let minPrice: number | null = null;

    const db = await connectToDatabase();
    if (db) {
      try {
        const lowestCall = await VendorCall.findOne({
          campaign_id: campaignId,
          call_status: "QUOTE_VERIFIED",
          "pricing.final_negotiated_price": { $gt: 0 },
        })
          .sort({ "pricing.final_negotiated_price": 1 })
          .select("pricing.final_negotiated_price")
          .lean();

        if (lowestCall?.pricing?.final_negotiated_price) {
          minPrice = lowestCall.pricing.final_negotiated_price;
        }
      } catch (err) {
        console.warn("Fast BATNA mongo lookup failed, checking memory:", err);
      }
    }

    if (minPrice === null) {
      for (const c of memoryCalls.values()) {
        if (
          c.campaign_id === campaignId &&
          c.call_status === "QUOTE_VERIFIED" &&
          c.pricing?.final_negotiated_price
        ) {
          if (minPrice === null || c.pricing.final_negotiated_price < minPrice) {
            minPrice = c.pricing.final_negotiated_price;
          }
        }
      }
    }

    const duration = performance.now() - start;
    if (duration > 280) {
      console.warn(`[BATNA LATENCY ALERT] Lookup took ${duration.toFixed(2)}ms (>280ms threshold)`);
    }

    return minPrice;
  },
};
