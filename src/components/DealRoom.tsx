"use client";

import React, { useEffect, useState } from "react";
import { ICampaign } from "@/lib/models/Campaign";
import { IVendorCall } from "@/lib/models/VendorCall";
import { MarketResearchBar } from "./MarketResearchBar";
import { VendorCallMatrix } from "./VendorCallMatrix";
import { WinnerScorecard } from "./WinnerScorecard";
import { AudioProofPlayer } from "./AudioProofPlayer";
import { SimulationController } from "./SimulationController";
import { ShieldCheck, ArrowLeft, RefreshCw, Radio, Sparkles } from "lucide-react";
import Link from "next/link";

interface DealRoomProps {
  initialCampaign: ICampaign;
  initialCalls: IVendorCall[];
}

export function DealRoom({ initialCampaign, initialCalls }: DealRoomProps) {
  const [campaign, setCampaign] = useState<ICampaign>(initialCampaign);
  const [calls, setCalls] = useState<IVendorCall[]>(initialCalls);
  const [selectedCallForAudio, setSelectedCallForAudio] = useState<IVendorCall | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  const campaignId = campaign.campaign_id;

  // Real-time Server-Sent Events (SSE) listener
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/stream/${campaignId}`);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "INIT") {
            if (data.campaign) setCampaign(data.campaign);
            if (data.calls) setCalls(data.calls);
          } else if (data.type === "CALL_UPDATE" && data.call) {
            setCalls((prev) => {
              const updated = [...prev];
              const idx = updated.findIndex(
                (c) =>
                  String(c._id || (c as any).id) ===
                  String(data.call._id || data.call.id)
              );
              if (idx !== -1) {
                updated[idx] = data.call;
              } else {
                updated.push(data.call);
              }
              return updated;
            });
          } else if (data.type === "CAMPAIGN_UPDATE" && data.campaign) {
            setCampaign(data.campaign);
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (e) {
      console.warn("EventSource setup failed:", e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [campaignId]);

  // Identify winner call
  const winner = calls.find((c) => String(c._id || (c as any).id) === String(campaign.winner_call_id)) ||
    calls.filter((c) => c.call_status === "QUOTE_VERIFIED" && !c.scoring?.is_disqualified)
      .sort((a, b) => (b.scoring?.total_score || 0) - (a.scoring?.total_score || 0))[0];

  const runnerUp = calls.filter((c) => c.call_status === "QUOTE_VERIFIED" && c._id !== winner?._id)[0];

  // Map vendor quotes for distribution bar
  const vendorQuotes = calls
    .filter((c) => c.pricing?.final_negotiated_price)
    .map((c) => ({
      name: c.vendor_name,
      finalPrice: c.pricing!.final_negotiated_price,
      isWinner: winner ? (c._id === winner._id || (c as any).id === (winner as any).id) : false,
    }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
              title="Back to Intake"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-400 font-bold">
                  {campaign.campaign_id}
                </span>
                <span className="text-slate-600">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    campaign.status === "COMPLETED"
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-600/40"
                      : "bg-indigo-950/80 text-indigo-300 border border-indigo-600/40 animate-pulse"
                  }`}
                >
                  <Radio className="w-3 h-3 text-current" />
                  {campaign.status}
                </span>
                {sseConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                    SSE Live
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white mt-0.5">
                {campaign.request.product}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="text-slate-500 block">Target / Max Ceiling</span>
              <span className="font-mono font-bold text-slate-200">
                ₹{campaign.request.budget_target.toLocaleString("en-IN")} / ₹
                {campaign.request.budget_max.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Test Harness / Simulation Controller */}
        <SimulationController
          campaignId={campaignId}
          onSimulationComplete={() => {
            fetch(`/api/stream/${campaignId}`)
              .catch(() => {});
          }}
        />

        {/* Panel 1: Market Research Continuum */}
        <MarketResearchBar
          budgetTarget={campaign.request.budget_target}
          budgetMax={campaign.request.budget_max}
          marketResearch={campaign.market_research}
          vendorQuotes={vendorQuotes}
        />

        {/* If a specific call was clicked for audio verification */}
        {selectedCallForAudio && selectedCallForAudio.evidence && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Inspecting Call Audio Evidence
              </span>
              <button
                onClick={() => setSelectedCallForAudio(null)}
                className="text-xs text-slate-500 hover:text-white"
              >
                Close Inspector
              </button>
            </div>
            <AudioProofPlayer
              audioUrl={selectedCallForAudio.evidence.audio_url || "/api/mock-audio/inspect.wav"}
              quoteTimestampSec={selectedCallForAudio.evidence.quote_timestamp_sec}
              repName={selectedCallForAudio.evidence.rep_name}
              verbatimQuote={selectedCallForAudio.evidence.verbatim_quote}
              vendorName={selectedCallForAudio.vendor_name}
              finalPrice={selectedCallForAudio.pricing?.final_negotiated_price || 0}
              transcript={selectedCallForAudio.evidence.transcript || []}
            />
          </div>
        )}

        {/* Panel 3: Winner Scorecard (When deal locked or available) */}
        {winner && campaign.status === "COMPLETED" && (
          <WinnerScorecard
            campaign={campaign}
            winner={winner}
            runnerUp={runnerUp}
          />
        )}

        {/* Panel 2: Live Vendor Call Matrix */}
        <VendorCallMatrix
          calls={calls}
          onSelectCallForAudio={(c) => setSelectedCallForAudio(c)}
          selectedCallId={
            selectedCallForAudio
              ? String(selectedCallForAudio._id || (selectedCallForAudio as any).id)
              : undefined
          }
        />
      </div>
    </div>
  );
}
