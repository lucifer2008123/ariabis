"use client";

import React, { useState } from "react";
import { Play, Loader2, Sparkles, RefreshCw, Zap } from "lucide-react";

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
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
          <Zap className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Autonomous Voice AI Test Harness
            <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded font-mono">
              Simulator
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            {log || "Execute parallel SIP trunk negotiation with live BATNA broker & WhatsApp push"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Parallel Calls...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Dispatch Parallel Calls (5 Lines)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
