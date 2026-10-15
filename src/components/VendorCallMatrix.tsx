"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  AlertCircle,
  PhoneOff,
  Voicemail,
  ChevronDown,
  ChevronUp,
  Star,
  FileCheck,
  Zap,
  Mail,
} from "lucide-react";
import { IVendorCall, CallStatus } from "@/lib/models/VendorCall";

interface VendorCallMatrixProps {
  calls: IVendorCall[];
  onSelectCallForAudio?: (call: IVendorCall) => void;
  selectedCallId?: string;
}

export function VendorCallMatrix({
  calls,
  onSelectCallForAudio,
  selectedCallId,
}: VendorCallMatrixProps) {
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [callingCallId, setCallingCallId] = useState<string | null>(null);
  const [callNotice, setCallNotice] = useState<string | null>(null);

  const handleCallVendorLive = async (call: IVendorCall) => {
    const callId = String(call._id || (call as any).id);
    setCallingCallId(callId);
    setCallNotice(`Dialing ${call.vendor_name} (${call.vendor_phone}) from +13513453498...`);

    try {
      const res = await fetch("/api/v1/live-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: call.campaign_id,
          phone_number: call.vendor_phone,
          vendor_name: call.vendor_name,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCallNotice(`📞 Live call placed to ${call.vendor_name}! Vapi Call ID: ${data.vapiCallId}`);
      } else {
        setCallNotice(`❌ Dial error: ${data.error || "Failed"}`);
      }
    } catch (e: any) {
      setCallNotice(`❌ Network error: ${e.message}`);
    } finally {
      setCallingCallId(null);
    }
  };

  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case "QUEUED":
        return (
          <span className="neo-badge bg-stone-200 text-black flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-500" />
            Queued
          </span>
        );
      case "DIALING":
        return (
          <span className="neo-badge bg-[#38bdf8] text-black flex items-center gap-1.5 animate-pulse">
            <PhoneCall className="w-3 h-3 animate-spin" />
            Dialing Trunk
          </span>
        );
      case "NEGOTIATING":
        return (
          <span className="neo-badge bg-[#fde047] text-black flex items-center gap-1.5 animate-pulse">
            <Zap className="w-3.5 h-3.5 fill-black" />
            Negotiating Live
          </span>
        );
      case "QUOTE_VERIFIED":
        return (
          <span className="neo-badge bg-[#bef264] text-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            Quote Verified
          </span>
        );
      case "LINE_BUSY":
        return (
          <span className="neo-badge bg-[#fda4af] text-black flex items-center gap-1.5">
            <PhoneOff className="w-3.5 h-3.5" />
            Line Busy (Isolated)
          </span>
        );
      case "VOICEMAIL":
        return (
          <span className="neo-badge bg-stone-200 text-black flex items-center gap-1.5">
            <Voicemail className="w-3.5 h-3.5" />
            Voicemail / AMD
          </span>
        );
      case "SPEC_MISMATCH":
        return (
          <span className="neo-badge bg-[#fda4af] text-black flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Spec Mismatch
          </span>
        );
      case "REJECTED":
        return (
          <span className="neo-badge bg-[#fca5a5] text-black flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Ceiling Exceeded
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="neo-box p-6 bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#38bdf8] text-black">
              <PhoneForwarded className="w-3.5 h-3.5 inline mr-1" />
              TELEPHONY MATRIX
            </span>
            <h3 className="text-sm font-black text-black uppercase tracking-wider">
              Parallel Voice Agent Dispatch (5-10 Concurrent Lines)
            </h3>
          </div>
          <p className="text-xs font-medium text-stone-600">
            Real-time state machine telemetry, mid-call BATNA brokers, and error-isolated trunk lines
          </p>
        </div>
        <span className="neo-badge bg-[#bef264] text-black text-xs font-mono">
          {calls.filter((c) => c.call_status === "QUOTE_VERIFIED").length} / {calls.length} Verified
        </span>
      </div>

      {callNotice && (
        <div className="neo-box-sm bg-[#e0f2fe] p-3 text-black text-xs font-bold font-mono mb-4 flex items-center justify-between">
          <span>{callNotice}</span>
          <button onClick={() => setCallNotice(null)} className="neo-btn px-2 py-0.5 text-[10px] bg-white text-black">DISMISS</button>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        {calls.map((call, idx) => {
          const callId = String(call._id || (call as any).id || idx);
          const isSelected = selectedCallId === callId;
          const isExpanded = expandedCallId === callId;
          const hasQuote = call.pricing?.final_negotiated_price && call.pricing.final_negotiated_price > 0;

          return (
            <div
              key={callId}
              className={`neo-box-sm transition-all overflow-hidden ${
                isSelected
                  ? "bg-[#e0f2fe] ring-2 ring-black"
                  : "bg-white hover:bg-stone-50"
              }`}
            >
              {/* Card Header Row */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="w-9 h-9 rounded-lg bg-[#fde047] border-2 border-black flex items-center justify-center font-mono text-sm font-black text-black shadow-[2px_2px_0px_0px_#000]">
                    L{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black flex items-center gap-2">
                      {call.vendor_name}
                      {call.scoring?.total_score ? (
                        <span className="neo-badge bg-[#bef264] text-black text-[10px] px-1.5 py-0.5">
                          Score: {call.scoring.total_score}
                        </span>
                      ) : null}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5 font-mono">
                      <span>{call.vendor_phone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-black font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#fde047] text-black" />
                        {call.vendor_rating || 4.0} ({call.vendor_reviews_count || 10})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Stats & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(call.call_status)}

                  {/* Pricing Overview */}
                  {hasQuote && (
                    <div className="text-right min-w-[130px]">
                      <div className="text-base font-mono font-black text-black">
                        ₹{call.pricing?.final_negotiated_price?.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-stone-500 line-through font-mono">
                        ₹{call.pricing?.initial_quote?.toLocaleString("en-IN")} (-{call.pricing?.discount_pct}%)
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCallVendorLive(call)}
                      disabled={callingCallId === callId}
                      className="neo-btn neo-btn-cyan px-2.5 py-1.5 text-xs text-black font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
                      title={`Place a live call to ${call.vendor_phone} via Vapi`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {callingCallId === callId ? "DIALING..." : "CALL LIVE"}
                    </button>

                    {call.evidence?.audio_url && onSelectCallForAudio && (
                      <button
                        onClick={() => onSelectCallForAudio(call)}
                        className="neo-btn neo-btn-green px-3 py-1.5 text-xs text-black font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        AUDIO PROOF
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedCallId(isExpanded ? null : callId)}
                      className="neo-btn px-2.5 py-1.5 text-black bg-white hover:bg-stone-100 shadow-[2px_2px_0px_0px_#000]"
                      title="Toggle Call Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="p-4 border-t-2 border-black bg-[#faf8f5] text-xs space-y-4">
                  {/* Specification Compliance Audit */}
                  <div>
                    <span className="text-[11px] font-black text-black uppercase tracking-wider block mb-2">
                      SPECIFICATION COMPLIANCE AUDIT:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {call.spec_verification?.verified_items?.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="neo-badge bg-[#bef264] text-black text-[11px] flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          {spec}
                        </span>
                      ))}
                      {call.spec_verification?.missing_or_deviated?.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="neo-badge bg-[#fda4af] text-black text-[11px] flex items-center gap-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          {spec} (Missing/Evaded)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verbatim quote & Rep info */}
                  {call.evidence?.verbatim_quote && (
                    <div className="neo-box-sm bg-[#fef08a] p-3 text-black">
                      <div className="text-[11px] font-black uppercase text-stone-700 mb-1">
                        SPOKE WITH: <span className="text-black font-extrabold">{call.evidence.rep_name || "Representative"}</span>
                      </div>
                      <p className="font-semibold italic text-stone-900 leading-relaxed">
                        &ldquo;{call.evidence.verbatim_quote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Email Fallback & Simulated Supplier Reply */}
                  {(call as any).email_fallback && (
                    <div className="space-y-3 pt-3 border-t-2 border-black">
                      <div className="flex items-center gap-2">
                        <span className="neo-badge bg-[#fde047] text-black text-xs font-black">
                          <Mail className="w-3.5 h-3.5 inline mr-1" />
                          AUTOMATED EMAIL RFQ & QUOTATION SIMULATION
                        </span>
                        <span className="neo-badge bg-white text-stone-700 text-[10px]">
                          Voice Unreachable Fallback
                        </span>
                      </div>

                      {/* Outgoing RFQ sent by AI Buyer */}
                      <div className="neo-box-sm bg-[#e0f2fe] p-3 text-black">
                        <div className="text-[11px] font-black text-black mb-1 uppercase tracking-wider">
                          📤 Outgoing RFQ Dispatched to {call.vendor_name}:
                        </div>
                        <div className="font-mono text-[10px] text-stone-700 mb-2 font-bold">
                          Subject: {(call as any).email_fallback.rfq.subject}
                        </div>
                        <div className="bg-white p-3 rounded-md border-2 border-black font-mono text-[10px] text-black whitespace-pre-wrap leading-relaxed shadow-[2px_2px_0px_0px_#000]">
                          {(call as any).email_fallback.rfq.body}
                        </div>
                      </div>

                      {/* Incoming Supplier Reply */}
                      <div className="neo-box-sm bg-[#dcfce7] p-3 text-black">
                        <div className="text-[11px] font-black text-black mb-1 uppercase tracking-wider">
                          📥 Formal Quotation Received from Supplier:
                        </div>
                        <div className="font-mono text-[10px] text-stone-700 mb-2 font-bold">
                          Subject: {(call as any).email_fallback.supplierReply.subject}
                        </div>
                        <div className="bg-white p-3 rounded-md border-2 border-black font-mono text-[10px] text-black whitespace-pre-wrap leading-relaxed shadow-[2px_2px_0px_0px_#000]">
                          {(call as any).email_fallback.supplierReply.body}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5-Dimension Score Breakdown */}
                  {call.scoring?.breakdown && (
                    <div className="pt-2 border-t-2 border-black">
                      <span className="text-[11px] font-black uppercase text-black block mb-2 tracking-wider">
                        5-DIMENSION EVALUATION SCORECARD:
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-[11px]">
                        <div className="neo-box-sm bg-[#fef9c3] p-2 text-center text-black">
                          <span className="text-stone-600 block text-[10px] font-black uppercase">Price (45%)</span>
                          <span className="font-black text-base">{call.scoring.breakdown.price_score}</span>
                        </div>
                        <div className="neo-box-sm bg-[#dcfce7] p-2 text-center text-black">
                          <span className="text-stone-600 block text-[10px] font-black uppercase">Specs (25%)</span>
                          <span className="font-black text-base">{call.scoring.breakdown.spec_score}</span>
                        </div>
                        <div className="neo-box-sm bg-[#e0f2fe] p-2 text-center text-black">
                          <span className="text-stone-600 block text-[10px] font-black uppercase">Evidence (15%)</span>
                          <span className="font-black text-base">{call.scoring.breakdown.evidence_score}</span>
                        </div>
                        <div className="neo-box-sm bg-[#f3e8ff] p-2 text-center text-black">
                          <span className="text-stone-600 block text-[10px] font-black uppercase">Trust (10%)</span>
                          <span className="font-black text-base">{call.scoring.breakdown.trust_score}</span>
                        </div>
                        <div className="neo-box-sm bg-[#ffedd5] p-2 text-center text-black">
                          <span className="text-stone-600 block text-[10px] font-black uppercase">Terms (5%)</span>
                          <span className="font-black text-base">{call.scoring.breakdown.terms_score}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
