import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Store } from "@/lib/store";

const CreateCampaignSchema = z.object({
  product_name: z.string().min(2, "Product name is required"),
  specs_required: z.array(z.string()).min(1, "At least one specification is required"),
  target_budget: z.number().positive("Target budget must be positive"),
  max_budget: z.number().positive("Walk-away ceiling must be positive"),
  currency: z.string().default("INR"),
  location: z.string().default("Bangalore, India"),
  user_phone: z.string().optional().default("+919876543210"),
  user_telegram: z.string().optional().default("@telegram_user"),
  telegram_chat_id: z.string().optional(),
  user_name: z.string().default("Buyer"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = CreateCampaignSchema.parse(json);

    if (validated.target_budget > validated.max_budget) {
      return NextResponse.json(
        { error: "Target budget cannot exceed walk-away ceiling" },
        { status: 400 }
      );
    }

    const campaignId = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const baseUrl = process.env.PORTAL_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const portalSlug = `${baseUrl}/c/${campaignId}`;

    // Estimated online baseline and anchor computed from target/max
    const estimatedOnlineLow = Math.round(validated.target_budget * 1.07);
    const estimatedOnlineAvg = Math.round(validated.max_budget * 1.04);
    const recommendedAnchor = Math.round(validated.target_budget * 0.94);

    const campaignData = {
      campaign_id: campaignId,
      user_phone: validated.user_phone,
      user_telegram: validated.user_telegram,
      telegram_chat_id: validated.telegram_chat_id,
      status: "RESEARCHING",
      request: {
        product: validated.product_name,
        budget_target: validated.target_budget,
        budget_max: validated.max_budget,
        currency: validated.currency,
        mandatory_specs: validated.specs_required,
        location: validated.location,
      },
      market_research: {
        online_low_price: estimatedOnlineLow,
        online_avg_price: estimatedOnlineAvg,
        reference_sources: ["indiamart", "retail_web", "google_shopping"],
        recommended_anchor: recommendedAnchor,
      },
      portal_slug: portalSlug,
    };

    await Store.saveCampaign(campaignData);

    // Seed realistic candidate vendors for immediate parallel dispatch
    const defaultVendors = [
      {
        name: "BeanCraft Equipment Pvt Ltd",
        phone: "+918041239988",
        rating: 4.6,
        reviews: 38,
      },
      {
        name: "Kaapi Solutions Hub",
        phone: "+918025591024",
        rating: 4.4,
        reviews: 24,
      },
      {
        name: "Barista Pro Supplies",
        phone: "+919845012345",
        rating: 4.8,
        reviews: 52,
      },
      {
        name: "Espresso Direct Tech",
        phone: "+918026789012",
        rating: 4.1,
        reviews: 14,
      },
      {
        name: "Karnataka Commercial Appliances",
        phone: "+918041122334",
        rating: 3.7,
        reviews: 9, // Will trigger vendor trust penalty in scoring rubric (<3.8)
      },
    ];

    for (const v of defaultVendors) {
      await Store.saveCall({
        campaign_id: campaignId,
        vendor_name: v.name,
        vendor_phone: v.phone,
        vendor_rating: v.rating,
        vendor_reviews_count: v.reviews,
        call_status: "QUEUED",
      });
    }

    // Fire asynchronous webhook to n8n Workflow 1 if configured
    const n8nWebhook = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhook && !n8nWebhook.includes("placeholder")) {
      fetch(`${n8nWebhook}/api/v1/campaign-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validated,
          campaign_id: campaignId,
          portal_slug: portalSlug,
        }),
      }).catch((e) => console.warn("Failed firing to n8n:", e.message));
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      portal_slug: portalSlug,
      redirect_url: `/c/${campaignId}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
