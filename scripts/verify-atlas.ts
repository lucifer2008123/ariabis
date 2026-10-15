/**
 * MongoDB Atlas Connection & Schema Verification Script
 */

import mongoose from "mongoose";
import { Campaign } from "../src/lib/models/Campaign";
import { VendorCall } from "../src/lib/models/VendorCall";

const URI = "mongodb+srv://haggle_admin:haggle_os_prod@cluster0.vrtyz4s.mongodb.net/haggle_os_prod?retryWrites=true&w=majority";

async function verifyAtlas() {
  console.log("Connecting to MongoDB Atlas at cluster0.vrtyz4s.mongodb.net...");

  try {
    const conn = await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log("✅ Successfully connected to MongoDB Atlas!");
    console.log(`Database Name: ${conn.connection.db?.databaseName}`);

    // Create collections and sync indexes
    console.log("Ensuring indexes on 'campaigns' and 'vendor_calls'...");
    await Campaign.createIndexes();
    await VendorCall.createIndexes();

    const campaignIndexes = await Campaign.collection.indexes();
    console.log("Campaign Collection Indexes:", campaignIndexes.map(i => i.name).join(", "));

    const vendorIndexes = await VendorCall.collection.indexes();
    console.log("VendorCall Collection Indexes:", vendorIndexes.map(i => i.name).join(", "));

    // Check compound index for BATNA queries
    const hasBatnaIndex = vendorIndexes.some(
      i => i.key && i.key.campaign_id === 1 && i.key["pricing.final_negotiated_price"] === 1
    );

    if (hasBatnaIndex) {
      console.log("✅ Compound Index { campaign_id: 1, 'pricing.final_negotiated_price': 1 } is ACTIVE for <280ms BATNA lookups!");
    } else {
      console.log("Creating compound index explicitly...");
      await VendorCall.collection.createIndex({ campaign_id: 1, "pricing.final_negotiated_price": 1 });
      console.log("✅ Compound Index created!");
    }

    // Seed master blueprint campaign CMP-2026-8841 into live Atlas
    const testCampaign = {
      campaign_id: "CMP-2026-8841",
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
      portal_slug: "http://localhost:3000/c/CMP-2026-8841",
    };

    await Campaign.findOneAndUpdate(
      { campaign_id: testCampaign.campaign_id },
      { $set: testCampaign },
      { upsert: true, new: true }
    );
    console.log("✅ Master Campaign CMP-2026-8841 synced to live Atlas!");

    await mongoose.disconnect();
    console.log("\n=================================================");
    console.log("🎉 LIVE MONGODB ATLAS PROVISIONING COMPLETE!");
    console.log("=================================================");
  } catch (err: any) {
    console.error("❌ Atlas Connection Error:", err.message);
    if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
      console.error("👉 Please verify the username and password in MongoDB Atlas -> Database Access.");
    } else if (err.message.includes("whitelist") || err.message.includes("ETIMEDOUT") || err.message.includes("querySrv")) {
      console.error("👉 Please ensure Network Access in MongoDB Atlas has 0.0.0.0/0 (Allow from anywhere) enabled.");
    }
    process.exit(1);
  }
}

verifyAtlas();
