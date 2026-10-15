import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";
import { dispatchVapiCall } from "@/lib/vapi-client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { campaign_id, phone_number, vendor_name, product_name, target_price } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: "phone_number is required (e.g. +91... or +1...)" }, { status: 400 });
    }

    const apiKey = process.env.VAPI_API_KEY;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const assistantId = process.env.VAPI_ASSISTANT_ID || "a6d8a145-2f52-4e93-8019-12a879208088";

    if (!apiKey || !phoneNumberId || phoneNumberId.includes("placeholder")) {
      return NextResponse.json(
        { error: "Vapi phone number or API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    const campaignId = campaign_id || `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const vendorName = vendor_name || "Live Test Contact";
    const productName = product_name || "Commercial Espresso Machine";
    const targetPrice = target_price || 185000;

    console.log(`[VAPI LIVE CALL] Dispatching real phone call to ${phone_number} from +13513453498...`);

    // Call Vapi's phone API
    const vapiRes = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: phoneNumberId,
        assistantId: assistantId,
        customer: {
          number: phone_number,
          name: vendorName,
        },
        assistantOverrides: {
          variableValues: {
            productName: productName,
            budgetTarget: targetPrice,
            budgetMax: Math.round(targetPrice * 1.15),
          },
        },
      }),
    });

    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error("[VAPI LIVE CALL ERROR]", vapiData);
      return NextResponse.json(
        {
          error: vapiData.message || "Failed to initiate live call with Vapi",
          details: vapiData,
        },
        { status: vapiRes.status }
      );
    }

    // Save call record to database
    await Store.saveCall({
      campaign_id: campaignId,
      vendor_name: vendorName,
      vendor_phone: phone_number,
      vendor_rating: 4.5,
      vendor_reviews_count: 20,
      call_status: "DIALING",
    });

    return NextResponse.json({
      success: true,
      message: `Live call placed to ${phone_number} from +13513453498`,
      vapiCallId: vapiData.id,
      status: vapiData.status || "queued",
      phone_number: phone_number,
      vapiData: vapiData,
    });
  } catch (error: any) {
    console.error("Live call route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
