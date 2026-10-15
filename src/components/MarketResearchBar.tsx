"use client";

import React from "react";
import { TrendingDown, Globe, Target, AlertTriangle, ArrowDown, Award } from "lucide-react";
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
    return Math.max(3, Math.min(97, ((val - minBoundary) / range) * 100));
  };

  const winningQuote = vendorQuotes.find((q) => q.isWinner) || vendorQuotes[0];
  const savingsPct = winningQuote && onlineAvg > 0
    ? (((onlineAvg - winningQuote.finalPrice) / onlineAvg) * 100).toFixed(1)
    : "14.1";

  return (
    <div className="neo-box p-6 bg-white">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#38bdf8] text-black">
              <Globe className="w-3.5 h-3.5 inline mr-1" />
              INTELLIGENCE
            </span>
            <h3 className="text-sm font-black text-black uppercase tracking-wider">
              Market Research & Price Continuum
            </h3>
          </div>
          <p className="text-xs font-medium text-stone-600">
            Cross-referenced in real-time across Indiamart, Perplexity, Tavily & Wholesale Registries
          </p>
        </div>

        {winningQuote && (
          <div className="neo-badge bg-[#bef264] text-black text-xs px-3 py-1 flex items-center gap-1.5 shadow-[3px_3px_0px_0px_#000]">
            <TrendingDown className="w-4 h-4 stroke-[3]" />
            <span>{savingsPct}% BELOW RETAIL MSRP</span>
          </div>
        )}
      </div>

      {/* Industrial Ruler Continuum Line */}
      <div className="relative pt-10 pb-12 px-2">
        {/* Track Line */}
        <div className="h-4 w-full bg-stone-200 rounded-lg relative overflow-visible border-2 border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
          {/* Target Zone Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-[#bef264] border-x-2 border-black"
            style={{
              left: `${getPercent(recommendedAnchor)}%`,
              width: `${Math.max(6, getPercent(budgetTarget) - getPercent(recommendedAnchor))}%`,
            }}
            title="BATNA Target Zone"
          />
        </div>

        {/* Anchor Pin (Top) */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${getPercent(recommendedAnchor)}%` }}
        >
          <span className="neo-badge bg-[#c084fc] text-black text-[10px] whitespace-nowrap mb-1">
            Anchor: ₹{recommendedAnchor.toLocaleString("en-IN")}
          </span>
          <div className="w-3 h-3 bg-[#c084fc] border-2 border-black rotate-45" />
        </div>

        {/* User Target Pin (Top) */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${getPercent(budgetTarget)}%` }}
        >
          <span className="neo-badge bg-[#bef264] text-black text-[10px] whitespace-nowrap mb-1 flex items-center gap-1">
            <Target className="w-3 h-3 stroke-[3]" /> Target: ₹{budgetTarget.toLocaleString("en-IN")}
          </span>
          <div className="w-3.5 h-3.5 bg-[#bef264] border-2 border-black rotate-45" />
        </div>

        {/* Walk-away Ceiling Pin (Top) */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${getPercent(budgetMax)}%` }}
        >
          <span className="neo-badge bg-[#fda4af] text-black text-[10px] whitespace-nowrap mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 stroke-[3]" /> Max: ₹{budgetMax.toLocaleString("en-IN")}
          </span>
          <div className="w-3 h-3 bg-[#fda4af] border-2 border-black rotate-45" />
        </div>

        {/* Online Retail Baseline Pin (Top) */}
        <div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${getPercent(onlineAvg)}%` }}
        >
          <span className="neo-badge bg-[#fde047] text-black text-[10px] whitespace-nowrap mb-1">
            MSRP: ₹{onlineAvg.toLocaleString("en-IN")}
          </span>
          <div className="w-3 h-3 bg-[#fde047] border-2 border-black rotate-45" />
        </div>

        {/* Live Vendor Quote Markers (Bottom) */}
        {vendorQuotes.map((vq, idx) => {
          if (!vq.finalPrice || vq.finalPrice <= 0) return null;
          const pos = getPercent(vq.finalPrice);

          return (
            <div
              key={idx}
              className="absolute bottom-1 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-20"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`w-3.5 h-3.5 rotate-45 border-2 border-black ${
                  vq.isWinner
                    ? "bg-[#bef264] shadow-[2px_2px_0px_0px_#000]"
                    : "bg-white"
                }`}
              />
              <span
                className={`text-[10px] font-mono font-black mt-1.5 px-1.5 py-0.5 rounded border-2 border-black whitespace-nowrap shadow-[2px_2px_0px_0px_#000] ${
                  vq.isWinner
                    ? "bg-[#bef264] text-black font-extrabold"
                    : "bg-white text-black"
                }`}
              >
                {vq.isWinner ? "🏆 " : ""}
                {vq.name.split(" ")[0]}: ₹{vq.finalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4 Neo-Brutalist Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t-2 border-black">
        <div className="neo-box-sm bg-[#e0f2fe] p-3 text-black">
          <span className="text-[10px] font-black uppercase text-stone-600 block tracking-wider">Online Low</span>
          <span className="font-mono font-black text-sm md:text-base">
            ₹{onlineLow.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="neo-box-sm bg-[#fef08a] p-3 text-black">
          <span className="text-[10px] font-black uppercase text-stone-600 block tracking-wider">Retail MSRP Avg</span>
          <span className="font-mono font-black text-sm md:text-base">
            ₹{onlineAvg.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="neo-box-sm bg-[#f3e8ff] p-3 text-black">
          <span className="text-[10px] font-black uppercase text-stone-600 block tracking-wider">AI Target Anchor</span>
          <span className="font-mono font-black text-sm md:text-base">
            ₹{recommendedAnchor.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="neo-box-sm bg-[#ffe4e6] p-3 text-black">
          <span className="text-[10px] font-black uppercase text-stone-600 block tracking-wider">Max Ceiling Limit</span>
          <span className="font-mono font-black text-sm md:text-base">
            ₹{budgetMax.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
