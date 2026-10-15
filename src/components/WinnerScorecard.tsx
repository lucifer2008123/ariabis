"use client";

import React from "react";
import { Trophy, CheckCircle2, Sparkles, Send, ExternalLink, Headphones, BarChart3 } from "lucide-react";
import { IVendorCall } from "@/lib/models/VendorCall";
import { ICampaign } from "@/lib/models/Campaign";
import { AudioProofPlayer } from "./AudioProofPlayer";
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
      <div className="bg-[#bef264] border-[3px] border-black rounded-2xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#fde047] border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
              <Trophy className="w-9 h-9 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="neo-badge bg-white text-black text-xs font-black">
                  DEAL LOCKED 🏆
                </span>
                <span className="neo-badge bg-[#fde047] text-black text-xs font-mono font-black">
                  Score: {winner.scoring?.total_score || 94}/100
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-black tracking-tight">
                {winner.vendor_name}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase text-black tracking-wider font-black block">
              Negotiated All-In Price
            </span>
            <div className="text-3xl md:text-5xl font-black font-mono text-black">
              ₹{winner.pricing?.final_negotiated_price?.toLocaleString("en-IN")}
            </div>
            <div className="mt-1">
              <span className="neo-badge bg-white text-black text-xs font-mono font-bold">
                Target: ₹{campaign.request.budget_target.toLocaleString("en-IN")} (Saved {savingsPct.toFixed(1)}% vs MSRP)
              </span>
            </div>
          </div>
        </div>

        {/* Highlighted Spec Checklist */}
        <div className="mt-6 pt-4 border-t-2 border-black flex flex-wrap items-center gap-2 text-xs">
          <span className="text-black font-black uppercase tracking-wider mr-2">
            Verified Specifications:
          </span>
          {winner.spec_verification?.verified_items?.map((item, idx) => (
            <span
              key={idx}
              className="neo-badge bg-white text-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5] text-black" />
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
      <div className="neo-box p-6 bg-white border-[3px] border-black">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <Send className="w-5 h-5 text-black" />
            </div>
            <div>
              <h4 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
                Telegram Bot Evidence Card Dispatched
                <span className="neo-badge bg-[#38bdf8] text-black text-[10px]">
                  @ariabis_bot
                </span>
              </h4>
              <p className="text-xs font-medium text-stone-600">
                Delivered to Telegram Chat ID: <span className="font-mono font-bold text-black">{(campaign as any).telegram_chat_id || "Active Subscriber"}</span>
              </p>
            </div>
          </div>
          <a
            href="https://t.me/ariabis_bot"
            target="_blank"
            rel="noreferrer"
            className="neo-btn neo-btn-cyan px-4 py-2 text-xs text-black font-black flex items-center gap-1.5 shadow-[3px_3px_0px_0px_#000]"
          >
            OPEN IN TELEGRAM <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Message Preview in Neo-Brutalist Frame */}
        <div
          className="bg-[#faf8f5] border-2 border-black border-l-8 border-l-[#38bdf8] rounded-xl p-4 font-sans text-xs text-black whitespace-pre-line leading-relaxed shadow-[3px_3px_0px_0px_#000]"
          dangerouslySetInnerHTML={{ __html: telegramPreview }}
        />

        {/* Telegram Inline Keyboard Preview */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <a
            href={campaign.portal_slug}
            className="neo-btn bg-[#e0f2fe] hover:bg-[#bae6fd] py-2.5 px-3 text-black font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000]"
          >
            <Headphones className="w-4 h-4" /> LISTEN TO AUDIO PROOF
          </a>
          <a
            href={campaign.portal_slug}
            className="neo-btn bg-[#fef08a] hover:bg-[#fde047] py-2.5 px-3 text-black font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000]"
          >
            <BarChart3 className="w-4 h-4" /> VIEW LIVE DEAL ROOM
          </a>
        </div>
      </div>
    </div>
  );
}
