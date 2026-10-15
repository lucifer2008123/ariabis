/**
 * The Negotiator - Telegram Bot Delivery Module
 * Handles rich notification payloads, inline action buttons, and bot commands
 */

export interface TelegramEvidenceParams {
  productName: string;
  discountPct: number;
  winnerVendorName: string;
  repName: string;
  finalPrice: number;
  budgetTarget: number;
  verifiedSpecs: string[];
  quoteTimestampFormatted: string; // e.g. "01:54"
  verbatimQuote: string;
  runnerUpName?: string;
  runnerUpPrice?: number;
  onlineLowPrice: number;
  portalUrl: string;
  currencySymbol?: string;
}

export function formatTelegramEvidenceMessage(params: TelegramEvidenceParams): string {
  const sym = params.currencySymbol || "₹";
  const specsList = params.verifiedSpecs.join(", ");
  const runnerUpSection =
    params.runnerUpName && params.runnerUpPrice
      ? `🥈 <b>Runner-Up:</b> ${params.runnerUpName} — ${sym}${params.runnerUpPrice.toLocaleString("en-IN")}`
      : `🥈 <b>Runner-Up:</b> None eligible`;

  return `🎯 <b>DEAL LOCKED: ${params.productName}</b>
Negotiated <b>${params.discountPct.toFixed(1)}% below</b> retail average!

🏆 <b>Winner:</b> ${params.winnerVendorName}
📞 <b>Spoke with:</b> ${params.repName || "Sales Rep"}
💰 <b>Final All-In Price:</b> ${sym}${params.finalPrice.toLocaleString("en-IN")} <i>(Target: ${sym}${params.budgetTarget.toLocaleString("en-IN")})</i>
✅ <b>Specs Verified:</b> ${specsList}

🎙️ <b>Verbatim Audio Commitment (${params.quoteTimestampFormatted}):</b>
<i>"${params.verbatimQuote}"</i>

${runnerUpSection}
📊 <b>Market Benchmark:</b> ${sym}${params.onlineLowPrice.toLocaleString("en-IN")} (Online Low)

⚡ <i>Audio proof grounded to exact second and ready for playback.</i>`;
}

export async function sendTelegramNotification(
  chatId: string,
  htmlMessage: string,
  portalUrl?: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token.includes("placeholder")) {
    console.log(`[TELEGRAM SIMULATION] Message to Chat ID ${chatId}:\n${htmlMessage}\nPortal URL: ${portalUrl}`);
    return {
      success: true,
      simulated: true,
      chat_id: chatId,
      timestamp: new Date().toISOString(),
    };
  }

  const cleanChatId = chatId.trim();

  const payload: any = {
    chat_id: cleanChatId,
    text: htmlMessage,
    parse_mode: "HTML",
  };

  if (portalUrl) {
    payload.reply_markup = {
      inline_keyboard: [
        [
          {
            text: "🎧 Listen to Audio Proof",
            url: portalUrl,
          },
          {
            text: "📊 View Live Deal Room",
            url: portalUrl,
          },
        ],
      ],
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return {
      success: data.ok,
      data,
    };
  } catch (error: any) {
    console.error("Telegram delivery error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
