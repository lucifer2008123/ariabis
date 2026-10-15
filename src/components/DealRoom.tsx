"use client";

import React, { useEffect, useState } from "react";
import { ICampaign } from "@/lib/models/Campaign";
import { IVendorCall } from "@/lib/models/VendorCall";
import { MarketResearchBar } from "./MarketResearchBar";
import { VendorCallMatrix } from "./VendorCallMatrix";
import { WinnerScorecard } from "./WinnerScorecard";
import { AudioProofPlayer } from "./AudioProofPlayer";
import { SimulationController } from "./SimulationController";
import { ArrowLeft, Radio, Sparkles, SlidersHorizontal, ShieldCheck, X } from "lucide-react";
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
    <div className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header Card */}
        <div className="neo-box p-5 md:p-6 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="neo-btn px-3 py-2 bg-white hover:bg-stone-100 text-black text-sm"
                title="Back to Procurement Intake"
              >
                <ArrowLeft className="w-5 h-5 mr-1" /> BACK
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="neo-badge bg-[#38bdf8] text-black">
                    {campaign.campaign_id}
                  </span>
                  <span
                    className={`neo-badge ${
                      campaign.status === "COMPLETED"
                        ? "bg-[#bef264] text-black"
                        : "bg-[#fde047] text-black animate-pulse"
                    }`}
                  >
                    <Radio className="w-3 h-3 inline mr-1" />
                    {campaign.status === "COMPLETED" ? "DEAL LOCKED 🏆" : "NEGOTIATING LIVE ⚡"}
                  </span>
                  {sseConnected && (
                    <span className="neo-badge bg-[#c084fc] text-black">
                      SSE STREAM LIVE
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-black mt-2 tracking-tight">
                  {campaign.request.product}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="neo-box-sm bg-[#fef08a] px-4 py-2 text-right">
                <span className="text-[10px] font-black uppercase text-stone-700 block tracking-wider">
                  Target / Walk-away Max
                </span>
                <span className="font-mono font-black text-black text-base md:text-lg">
                  ₹{campaign.request.budget_target.toLocaleString("en-IN")} / ₹
                  {campaign.request.budget_max.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Harness / Simulation Controller */}
        <SimulationController
          campaignId={campaignId}
          onSimulationComplete={() => {
            fetch(`/api/stream/${campaignId}`).catch(() => {});
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
          <div className="neo-box p-4 md:p-6 bg-[#fef9c3] border-[3px] border-black">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-black" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  INSPECTING AUDIO EVIDENCE: {selectedCallForAudio.vendor_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCallForAudio(null)}
                className="neo-btn px-2.5 py-1 text-xs bg-white hover:bg-stone-200 text-black font-black flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> CLOSE INSPECTOR
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
