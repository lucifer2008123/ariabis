import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Telegram Bot Webhook Receiver
 * Handles /start, /status <campaign_id>, and interactive query commands.
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const userName = update.message.from?.first_name || "Buyer";

    let replyText = "";
    let replyMarkup: any = null;

    if (text === "/start" || text.startsWith("/start")) {
      replyText = `👋 <b>Hello ${userName}! Welcome to The Negotiator (HaggleOS).</b>

I am your autonomous Voice AI Procurement assistant. When you launch a mission, our parallel voice agents will call distributors, negotiate the best wholesale prices, audit specs on tape, and deliver the final deal proof directly here!

🆔 <b>Your Telegram Chat ID:</b>
<code>${chatId}</code>
<i>(Copy this Chat ID into the web portal to receive your deal notifications!)</i>

💡 <b>Commands:</b>
• /status &lt;campaign_id&gt; — Check live deal room status
• /demo — View demo espresso machine deal room`;

      replyMarkup = {
        inline_keyboard: [
          [
            {
              text: "🚀 Open Web Portal",
              url: process.env.PORTAL_BASE_URL || "http://localhost:3000",
            },
            {
              text: "☕ Demo Deal Room",
              url: `${process.env.PORTAL_BASE_URL || "http://localhost:3000"}/c/CMP-2026-8841`,
            },
          ],
        ],
      };
    } else if (text.startsWith("/status")) {
      const parts = text.split(" ");
      const campaignId = parts[1] || "CMP-2026-8841";

      const campaign = await Store.getCampaign(campaignId);
      if (!campaign) {
        replyText = `❌ <b>Campaign not found:</b> <code>${campaignId}</code>\n\nPlease check the ID or launch a new campaign.`;
      } else {
        const calls = await Store.getCallsForCampaign(campaignId);
        const verifiedCalls = calls.filter((c) => c.call_status === "QUOTE_VERIFIED");

        replyText = `📊 <b>Status for Campaign:</b> <code>${campaign.campaign_id}</code>
📦 <b>Product:</b> ${campaign.request.product}
⚡ <b>Status:</b> ${campaign.status}
📞 <b>Verified Calls:</b> ${verifiedCalls.length} / ${calls.length}

Target: ₹${campaign.request.budget_target.toLocaleString("en-IN")} | Ceiling: ₹${campaign.request.budget_max.toLocaleString("en-IN")}`;

        replyMarkup = {
          inline_keyboard: [
            [
              {
                text: "🎧 View Deal Room & Audio",
                url: campaign.portal_slug,
              },
            ],
          ],
        };
      }
    } else if (text === "/demo") {
      replyText = `☕ <b>Blueprint Demo: Commercial Espresso Machine</b>
Target: ₹1,85,000 | Won at: ₹1,89,000 (14.09% discount)`;

      replyMarkup = {
        inline_keyboard: [
          [
            {
              text: "🎧 Open Demo Deal Room",
              url: `${process.env.PORTAL_BASE_URL || "http://localhost:3000"}/c/CMP-2026-8841`,
            },
          ],
        ],
      };
    } else {
      replyText = `🤖 Received: "${text}"\n\nTo check your campaign status, send:\n<code>/status CMP-2026-8841</code>\n\nYour Chat ID is: <code>${chatId}</code>`;
    }

    if (token && !token.includes("placeholder")) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "HTML",
          reply_markup: replyMarkup,
        }),
      });
    } else {
      console.log(`[TELEGRAM BOT WEBHOOK SIMULATED] Reply to ${chatId}:\n${replyText}`);
    }

    return NextResponse.json({ ok: true, replied_to: chatId });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    bot_integration: "The Negotiator Telegram Bot Webhook",
  });
}
