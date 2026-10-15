"use client";

import React, { useState } from "react";
import { Play, Loader2, Zap } from "lucide-react";

interface SimulationControllerProps {
  campaignId: string;
  onSimulationComplete?: () => void;
}

export function SimulationController({
  campaignId,
  onSimulationComplete,
}: SimulationControllerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  const runSimulation = async () => {
    setIsRunning(true);
    setLog("Triggering parallel voice agents across 5 SIP lines...");

    try {
      const res = await fetch("/api/v1/simulate-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      const data = await res.json();
      if (res.ok) {
        setLog("Negotiation completed! Winner audited and deal locked.");
        if (onSimulationComplete) {
          onSimulationComplete();
        }
      } else {
        setLog(`Simulation error: ${data.error || "Failed"}`);
      }
    } catch (e: any) {
      setLog(`Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="neo-box p-4 md:p-5 bg-[#fef9c3] flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#fde047] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
          <Zap className="w-5 h-5 text-black fill-black" />
        </div>
        <div>
          <h4 className="text-sm font-black text-black flex items-center gap-2 uppercase tracking-wide">
            Autonomous Voice AI Test Harness
            <span className="neo-badge bg-white text-black text-[10px]">
              SIMULATOR
            </span>
          </h4>
          <p className="text-xs font-mono font-bold text-stone-700 mt-0.5">
            {log || "Execute parallel SIP trunk negotiation with live BATNA broker & Telegram push"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="neo-btn neo-btn-green px-5 py-2.5 text-xs text-black font-black flex items-center gap-2 shadow-[4px_4px_0px_0px_#000] disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
              RUNNING PARALLEL CALLS...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black" />
              DISPATCH PARALLEL CALLS (5 LINES)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
