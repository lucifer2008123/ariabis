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

  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Queued
          </span>
        );
      case "DIALING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/50 animate-pulse">
            <PhoneCall className="w-3 h-3 text-blue-400 animate-spin" />
            Dialing Trunk
          </span>
        );
      case "NEGOTIATING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/50 animate-pulse">
            <Zap className="w-3 h-3 text-purple-400" />
            Negotiating Live
          </span>
        );
      case "QUOTE_VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Quote Verified
          </span>
        );
      case "LINE_BUSY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <PhoneOff className="w-3 h-3 text-amber-400" />
            Line Busy (Isolated)
          </span>
        );
      case "VOICEMAIL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <Voicemail className="w-3 h-3 text-slate-400" />
            Voicemail / AMD
          </span>
        );
      case "SPEC_MISMATCH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Spec Mismatch
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-950/80 text-red-300 border border-red-500/50">
            <AlertCircle className="w-3 h-3 text-red-400" />
            Ceiling Exceeded
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
            <PhoneForwarded className="w-4 h-4 text-indigo-400" />
            Parallel Voice Agent Dispatch Matrix (5-10 Concurrent Lines)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time state machine telemetry, mid-call BATNA brokers, and error-isolated trunk lines
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
          {calls.filter((c) => c.call_status === "QUOTE_VERIFIED").length} / {calls.length} Completed
        </span>
      </div>

      <div className="space-y-3">
        {calls.map((call, idx) => {
          const callId = String(call._id || (call as any).id || idx);
          const isSelected = selectedCallId === callId;
          const isExpanded = expandedCallId === callId;
          const hasQuote = call.pricing?.final_negotiated_price && call.pricing.final_negotiated_price > 0;

          return (
            <div
              key={callId}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30"
                  : "bg-slate-950/50 border-slate-800/90 hover:border-slate-700"
              }`}
            >
              {/* Main Card Row */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                    L{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {call.vendor_name}
                      {call.scoring?.total_score ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Score: {call.scoring.total_score}
                        </span>
                      ) : null}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>{call.vendor_phone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {call.vendor_rating || 4.0} ({call.vendor_reviews_count || 10})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(call.call_status)}

                  {/* Pricing Overview */}
                  {hasQuote && (
                    <div className="text-right min-w-[130px]">
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        ₹{call.pricing?.final_negotiated_price?.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-500 line-through">
                        ₹{call.pricing?.initial_quote?.toLocaleString("en-IN")} (-{call.pricing?.discount_pct}%)
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {call.evidence?.audio_url && onSelectCallForAudio && (
                      <button
                        onClick={() => onSelectCallForAudio(call)}
                        className="px-2.5 py-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition font-medium flex items-center gap-1"
                      >
                        <FileCheck className="w-3 h-3" />
                        Audio Proof
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedCallId(isExpanded ? null : callId)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/70 text-xs space-y-3">
                  {/* Spec Verification Chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Specification Compliance Audit:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {call.spec_verification?.verified_items?.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[11px] flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {spec}
                        </span>
                      ))}
                      {call.spec_verification?.missing_or_deviated?.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800 text-[11px] flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          {spec} (Missing/Evaded)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verbatim quote & Rep info */}
                  {call.evidence?.verbatim_quote && (
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[11px] mb-1">
                        Spoke with: <strong className="text-slate-200">{call.evidence.rep_name || "Representative"}</strong>
                      </div>
                      <p className="italic text-slate-300">
                        &ldquo;{call.evidence.verbatim_quote}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Email Fallback & Simulated Supplier Reply */}
                  {(call as any).email_fallback && (
                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <span>📧 Automated Email RFQ & Simulated Supplier Response</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 border border-amber-500/30">
                          Voice Unreachable Fallback
                        </span>
                      </div>

                      {/* Outgoing RFQ sent by AI Buyer */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                        <div className="text-[11px] font-bold text-indigo-300 mb-1">
                          📤 Outgoing RFQ Sent to {call.vendor_name}:
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 mb-1">
                          Subject: {(call as any).email_fallback.rfq.subject}
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {(call as any).email_fallback.rfq.body}
                        </div>
                      </div>

                      {/* Incoming Supplier Reply */}
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
                        <div className="text-[11px] font-bold text-emerald-300 mb-1">
                          📥 Formal Quotation Received from Supplier:
                        </div>
                        <div className="font-mono text-[10px] text-emerald-400 mb-1">
                          Subject: {(call as any).email_fallback.supplierReply.subject}
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded font-mono text-[10px] text-emerald-100 whitespace-pre-wrap leading-relaxed border border-emerald-900/50">
                          {(call as any).email_fallback.supplierReply.body}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5-Dimension Score Breakdown */}
                  {call.scoring?.breakdown && (
                    <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-800/60 font-mono text-[10px]">
                      <div className="text-center p-1.5 rounded bg-slate-900">
                        <span className="text-slate-500 block">Price (45%)</span>
                        <span className="font-bold text-slate-200">{call.scoring.breakdown.price_score}</span>
                      </div>
                      <div className="text-center p-1.5 rounded bg-slate-900">
                        <span className="text-slate-500 block">Specs (25%)</span>
                        <span className="font-bold text-slate-200">{call.scoring.breakdown.spec_score}</span>
                      </div>
                      <div className="text-center p-1.5 rounded bg-slate-900">
                        <span className="text-slate-500 block">Evidence (15%)</span>
                        <span className="font-bold text-slate-200">{call.scoring.breakdown.evidence_score}</span>
                      </div>
                      <div className="text-center p-1.5 rounded bg-slate-900">
                        <span className="text-slate-500 block">Trust (10%)</span>
                        <span className="font-bold text-slate-200">{call.scoring.breakdown.trust_score}</span>
                      </div>
                      <div className="text-center p-1.5 rounded bg-slate-900">
                        <span className="text-slate-500 block">Terms (5%)</span>
                        <span className="font-bold text-slate-200">{call.scoring.breakdown.terms_score}</span>
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
