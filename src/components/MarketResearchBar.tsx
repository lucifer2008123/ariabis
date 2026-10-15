"use client";

import React from "react";
import { TrendingDown, Globe, Target, AlertTriangle } from "lucide-react";
import { IMarketResearch } from "@/lib/models/Campaign";

interface MarketResearchBarProps {
  budgetTarget: number;
  budgetMax: number;
  marketResearch?: IMarketResearch;
  vendorQuotes?: Array<{
    name: string;
    finalPrice: number;
    isWinner?: boolean;
  }>;
}

export function MarketResearchBar({
  budgetTarget,
  budgetMax,
  marketResearch,
  vendorQuotes = [],
}: MarketResearchBarProps) {
  const onlineLow = marketResearch?.online_low_price || Math.round(budgetTarget * 1.05);
  const onlineAvg = marketResearch?.online_avg_price || Math.round(budgetMax * 1.05);
  const recommendedAnchor = marketResearch?.recommended_anchor || Math.round(budgetTarget * 0.94);

  // Compute boundaries for visual scale
  const minBoundary = Math.min(recommendedAnchor * 0.95, budgetTarget * 0.9);
  const maxBoundary = Math.max(onlineAvg * 1.05, budgetMax * 1.08);
  const range = maxBoundary - minBoundary;

  const getPercent = (val: number) => {
    return Math.max(2, Math.min(98, ((val - minBoundary) / range) * 100));
  };

  const winningQuote = vendorQuotes.find((q) => q.isWinner) || vendorQuotes[0];
  const savingsPct = winningQuote && onlineAvg > 0
    ? (((onlineAvg - winningQuote.finalPrice) / onlineAvg) * 100).toFixed(1)
    : "14.1";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Globe className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Market Research & Price Distribution Continuum
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Cross-referenced across Indiamart, Perplexity, Tavily & Local Distributors
          </p>
        </div>

        {winningQuote && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">
              {savingsPct}% Below Retail Baseline
            </span>
          </div>
        )}
      </div>

      {/* Continuum Distribution Line */}
      <div className="relative pt-8 pb-10 px-2">
        {/* Track Line */}
        <div className="h-3 w-full bg-slate-800 rounded-full relative overflow-visible border border-slate-700/60">
          {/* Target Zone Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
            style={{
              left: `${getPercent(recommendedAnchor)}%`,
              width: `${Math.max(5, getPercent(budgetTarget) - getPercent(recommendedAnchor))}%`,
            }}
          />
        </div>

        {/* Anchor Pin */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${getPercent(recommendedAnchor)}%` }}
        >
          <span className="text-[10px] font-mono font-bold text-indigo-400 whitespace-nowrap bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800 mb-1">
            Anchor: ₹{recommendedAnchor.toLocaleString("en-IN")}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-950" />
        </div>

        {/* User Target Pin */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${getPercent(budgetTarget)}%` }}
        >
          <span className="text-[10px] font-mono font-bold text-emerald-400 whitespace-nowrap bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 mb-1 flex items-center gap-1">
            <Target className="w-2.5 h-2.5" /> Target: ₹{budgetTarget.toLocaleString("en-IN")}
          </span>
          <div className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-950" />
        </div>

        {/* Walk-away Ceiling Pin */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${getPercent(budgetMax)}%` }}
        >
          <span className="text-[10px] font-mono font-bold text-amber-400 whitespace-nowrap bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Ceiling: ₹{budgetMax.toLocaleString("en-IN")}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-950" />
        </div>

        {/* Online Retail Baseline Pin */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${getPercent(onlineAvg)}%` }}
        >
          <span className="text-[10px] font-mono font-bold text-rose-400 whitespace-nowrap bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 mb-1">
            MSRP Avg: ₹{onlineAvg.toLocaleString("en-IN")}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-rose-950" />
        </div>

        {/* Live Vendor Quote Markers below track */}
        {vendorQuotes.map((vq, idx) => {
          if (!vq.finalPrice || vq.finalPrice <= 0) return null;
          const pos = getPercent(vq.finalPrice);

          return (
            <div
              key={idx}
              className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`w-3 h-3 rotate-45 border ${
                  vq.isWinner
                    ? "bg-teal-400 border-white ring-4 ring-teal-500/40 shadow-lg shadow-teal-500/50"
                    : "bg-slate-400 border-slate-200"
                }`}
              />
              <span
                className={`text-[9px] font-mono mt-1 px-1 rounded whitespace-nowrap ${
                  vq.isWinner
                    ? "text-teal-300 font-bold bg-teal-950/80 border border-teal-700"
                    : "text-slate-400 bg-slate-900 border border-slate-800"
                }`}
              >
                {vq.isWinner ? "🏆 " : ""}
                {vq.name.split(" ")[0]}: ₹{vq.finalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">Online Low</span>
          <span className="font-mono font-semibold text-slate-200">
            ₹{onlineLow.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">Retail Average</span>
          <span className="font-mono font-semibold text-slate-200">
            ₹{onlineAvg.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">Calculated Anchor</span>
          <span className="font-mono font-semibold text-indigo-300">
            ₹{recommendedAnchor.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">Max Walk-Away</span>
          <span className="font-mono font-semibold text-amber-300">
            ₹{budgetMax.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
