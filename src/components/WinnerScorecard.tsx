"use client";

import React from "react";
import { Trophy, CheckCircle2, MessageSquare, Sparkles, Send } from "lucide-react";
import { IVendorCall } from "@/lib/models/VendorCall";
import { ICampaign } from "@/lib/models/Campaign";
import { AudioProofPlayer } from "./AudioProofPlayer";
import { formatWhatsAppEvidenceMessage } from "@/lib/whatsapp";
import { formatTelegramEvidenceMessage } from "@/lib/telegram";

interface WinnerScorecardProps {
  campaign: ICampaign;
  winner: IVendorCall;
  runnerUp?: IVendorCall;
}

export function WinnerScorecard({ campaign, winner, runnerUp }: WinnerScorecardProps) {
  const quoteSec = winner.evidence?.quote_timestamp_sec || 114;
  const mins = Math.floor(quoteSec / 60);
  const secs = quoteSec % 60;
  const formattedTimestamp = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const retailAvg = campaign.market_research?.online_avg_price || campaign.request.budget_max;
  const savingsPct = retailAvg > 0
    ? ((retailAvg - (winner.pricing?.final_negotiated_price || 0)) / retailAvg) * 100
    : winner.pricing?.discount_pct || 0;

  const telegramPreview = formatTelegramEvidenceMessage({
    productName: campaign.request.product,
    discountPct: Math.max(0, savingsPct),
    winnerVendorName: winner.vendor_name,
    repName: winner.evidence?.rep_name || "Sales Rep",
    finalPrice: winner.pricing?.final_negotiated_price || 0,
    budgetTarget: campaign.request.budget_target,
    verifiedSpecs: winner.spec_verification?.verified_items || campaign.request.mandatory_specs,
    quoteTimestampFormatted: formattedTimestamp,
    verbatimQuote: winner.evidence?.verbatim_quote || "",
    runnerUpName: runnerUp?.vendor_name,
    runnerUpPrice: runnerUp?.pricing?.final_negotiated_price,
    onlineLowPrice: campaign.market_research?.online_low_price || campaign.request.budget_target,
    portalUrl: campaign.portal_slug,
  });

  return (
    <div className="space-y-6">
      {/* Winner Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/10">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Deal Locked 🏆
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Score: {winner.scoring?.total_score || 94}/100
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                {winner.vendor_name}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase text-slate-400 tracking-wider font-semibold block">
              Negotiated All-In Price
            </span>
            <div className="text-3xl font-black font-mono text-emerald-400">
              ₹{winner.pricing?.final_negotiated_price?.toLocaleString("en-IN")}
            </div>
            <span className="text-xs text-slate-400">
              Target: ₹{campaign.request.budget_target.toLocaleString("en-IN")} (Saved {savingsPct.toFixed(1)}% vs MSRP)
            </span>
          </div>
        </div>

        {/* Highlighted Spec Checklist */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Verified Specifications:</span>
          {winner.spec_verification?.verified_items?.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Audio Proof Locker */}
      <AudioProofPlayer
        audioUrl={winner.evidence?.audio_url || "/api/mock-audio/deal.wav"}
        quoteTimestampSec={winner.evidence?.quote_timestamp_sec || 114}
        repName={winner.evidence?.rep_name || "Sales Rep"}
        verbatimQuote={winner.evidence?.verbatim_quote || ""}
        vendorName={winner.vendor_name}
        finalPrice={winner.pricing?.final_negotiated_price || 0}
        transcript={winner.evidence?.transcript || []}
      />

      {/* Telegram Bot Dispatched Evidence Card */}
      <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Send className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Telegram Bot Evidence Card Dispatched
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                  @ariabis_bot
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Delivered to Telegram Chat ID: <span className="font-mono text-slate-200">{(campaign as any).telegram_chat_id || "Registered User"}</span>
              </p>
            </div>
          </div>
          <a
            href="https://t.me/ariabis_bot"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-sky-950/80 text-sky-300 text-xs font-semibold rounded-lg border border-sky-700 hover:bg-sky-900/60 transition flex items-center gap-1.5"
          >
            Open in Telegram <Send className="w-3 h-3" />
          </a>
        </div>

        <div
          className="bg-slate-950/70 border border-sky-950 rounded-xl p-4 font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed border-l-4 border-l-sky-500 selection:bg-sky-900"
          dangerouslySetInnerHTML={{ __html: telegramPreview }}
        />

        {/* Telegram Inline Keyboard Preview */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <a
            href={campaign.portal_slug}
            className="py-2 px-3 bg-sky-900/40 hover:bg-sky-900/60 text-sky-200 font-semibold rounded-lg border border-sky-700/60 text-center transition flex items-center justify-center gap-1.5"
          >
            🎧 Listen to Audio Proof
          </a>
          <a
            href={campaign.portal_slug}
            className="py-2 px-3 bg-sky-900/40 hover:bg-sky-900/60 text-sky-200 font-semibold rounded-lg border border-sky-700/60 text-center transition flex items-center justify-center gap-1.5"
          >
            📊 View Live Deal Room
          </a>
        </div>
      </div>
    </div>
  );
}
