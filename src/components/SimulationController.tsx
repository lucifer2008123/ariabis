"use client";

import React, { useState, useEffect } from "react";
import { Play, Loader2, Zap, PhoneCall, Mic, MicOff, PhoneOutgoing, ShieldCheck, CheckCircle2 } from "lucide-react";
import Vapi from "@vapi-ai/web";

interface SimulationControllerProps {
  campaignId: string;
  onSimulationComplete?: () => void;
}

export function SimulationController({
  campaignId,
  onSimulationComplete,
}: SimulationControllerProps) {
  const [activeTab, setActiveTab] = useState<"live" | "sim" | "web">("live");
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [isDialingLive, setIsDialingLive] = useState(false);
  const [customPhone, setCustomPhone] = useState("+91");
  const [customVendorName, setCustomVendorName] = useState("Direct Distributor");
  const [statusLog, setStatusLog] = useState<string | null>(null);

  // Web Call State
  const [vapiWeb, setVapiWeb] = useState<Vapi | null>(null);
  const [isWebCallActive, setIsWebCallActive] = useState(false);
  const [isConnectingWeb, setIsConnectingWeb] = useState(false);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_KEY || "59d25ac9-e85e-4740-88f2-f9132d88c505";
    const vapi = new Vapi(publicKey);

    vapi.on("call-start", () => {
      setIsConnectingWeb(false);
      setIsWebCallActive(true);
      setStatusLog("🎙️ Live WebRTC Voice Call Active! Speak to Alex now.");
    });

    vapi.on("call-end", () => {
      setIsWebCallActive(false);
      setIsConnectingWeb(false);
      setStatusLog("Web voice call ended.");
    });

    vapi.on("error", (e) => {
      console.error("Vapi Web error:", e);
      setIsConnectingWeb(false);
      setIsWebCallActive(false);
      setStatusLog(`Web call error: ${e.message || "Microphone / WebRTC failed"}`);
    });

    setVapiWeb(vapi);

    return () => {
      try {
        vapi.stop();
      } catch {}
    };
  }, []);

  // Trigger Live PSTN Phone Call via Vapi
  const handleLiveCall = async () => {
    if (!customPhone || customPhone.length < 8) {
      alert("Please enter a valid phone number with country code (e.g., +919876543210 or +14155552671)");
      return;
    }

    setIsDialingLive(true);
    setStatusLog(`📞 Dialing real phone number ${customPhone} from +13513453498...`);

    try {
      const res = await fetch("/api/v1/live-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          phone_number: customPhone.trim(),
          vendor_name: customVendorName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusLog(`⚡ Live call dispatched! Vapi Call ID: ${data.vapiCallId}. Your phone will ring now.`);
        if (onSimulationComplete) onSimulationComplete();
      } else {
        setStatusLog(`❌ Dial error: ${data.error || "Failed to initiate live call"}`);
      }
    } catch (e: any) {
      setStatusLog(`❌ Network error: ${e.message}`);
    } finally {
      setIsDialingLive(false);
    }
  };

  // Toggle Web Voice Call
  const toggleWebCall = async () => {
    if (!vapiWeb) return;

    if (isWebCallActive) {
      vapiWeb.stop();
      setIsWebCallActive(false);
    } else {
      setIsConnectingWeb(true);
      setStatusLog("Connecting microphone to HaggleOS Alex on Vapi...");
      try {
        const assistantId = "a6d8a145-2f52-4e93-8019-12a879208088";
        await vapiWeb.start(assistantId);
      } catch (err: any) {
        setIsConnectingWeb(false);
        setStatusLog(`Failed to connect mic: ${err.message}`);
      }
    }
  };

  // Trigger Multi-Line Simulation
  const runSimulation = async () => {
    setIsRunningSim(true);
    setStatusLog("Triggering parallel voice agents across 5 SIP lines...");

    try {
      const res = await fetch("/api/v1/simulate-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusLog("Negotiation completed! Winner audited and deal locked.");
        if (onSimulationComplete) {
          onSimulationComplete();
        }
      } else {
        setStatusLog(`Simulation error: ${data.error || "Failed"}`);
      }
    } catch (e: any) {
      setStatusLog(`Error: ${e.message}`);
    } finally {
      setIsRunningSim(false);
    }
  };

  return (
    <div className="neo-box p-5 bg-[#fef9c3] border-[3px] border-black space-y-4">
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fde047] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-black uppercase tracking-wide">
                Voice AI Telephony Control Deck
              </h4>
              <span className="neo-badge bg-[#bef264] text-black text-[10px]">
                CALLER ID: +13513453498
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-stone-700 mt-0.5">
              {statusLog || "Ready to dial live PSTN phone lines, test in-browser voice, or run multi-line simulator."}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("live")}
            className={`neo-btn px-3 py-1.5 text-xs font-black uppercase ${
              activeTab === "live" ? "bg-[#38bdf8] text-black" : "bg-white text-stone-600"
            }`}
          >
            <PhoneOutgoing className="w-3.5 h-3.5 mr-1 inline" /> Live Phone Call
          </button>
          <button
            onClick={() => setActiveTab("web")}
            className={`neo-btn px-3 py-1.5 text-xs font-black uppercase ${
              activeTab === "web" ? "bg-[#c084fc] text-black" : "bg-white text-stone-600"
            }`}
          >
            <Mic className="w-3.5 h-3.5 mr-1 inline" /> In-Browser Mic
          </button>
          <button
            onClick={() => setActiveTab("sim")}
            className={`neo-btn px-3 py-1.5 text-xs font-black uppercase ${
              activeTab === "sim" ? "bg-[#bef264] text-black" : "bg-white text-stone-600"
            }`}
          >
            <Play className="w-3.5 h-3.5 mr-1 inline" /> 5-Line Simulator
          </button>
        </div>
      </div>

      {/* Tab 1: Live PSTN Phone Call */}
      {activeTab === "live" && (
        <div className="space-y-3 bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-black">
              📞 Outbound PSTN Dialing (Vapi Provisioned Number: +13513453498)
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-700">
              ● SIP Trunk Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
                Target Phone Number (E.164)
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+919876543210 or +14155552671"
                className="neo-input w-full px-3 py-2 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
                Recipient / Vendor Name
              </label>
              <input
                type="text"
                value={customVendorName}
                onChange={(e) => setCustomVendorName(e.target.value)}
                placeholder="Vendor Name"
                className="neo-input w-full px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleLiveCall}
                disabled={isDialingLive}
                className="neo-btn neo-btn-cyan w-full py-2 px-4 text-xs text-black font-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] disabled:opacity-50"
              >
                {isDialingLive ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    CONNECTING LIVE LINE...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                    DIAL LIVE PHONE CALL NOW
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-stone-600 font-medium italic">
            Enter your mobile number with country code (e.g. +91...) to receive a real phone call from Alex, our Voice AI Negotiator!
          </p>
        </div>
      )}

      {/* Tab 2: In-Browser WebRTC Mic Call */}
      {activeTab === "web" && (
        <div className="space-y-3 bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-black uppercase text-black">
                🎙️ Instant In-Browser Voice Call (No Phone Number Needed)
              </h5>
              <p className="text-[11px] text-stone-600 font-medium">
                Talk directly to Alex using your microphone. Experience the &lt;550ms turn latency in real time.
              </p>
            </div>
            <span className="neo-badge bg-[#c084fc] text-black text-[10px]">
              WEBRTC STREAM
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={toggleWebCall}
              disabled={isConnectingWeb}
              className={`neo-btn py-2.5 px-5 text-xs text-black font-black flex items-center gap-2 shadow-[3px_3px_0px_0px_#000] ${
                isWebCallActive
                  ? "bg-rose-400 hover:bg-rose-500 text-white"
                  : "bg-[#bef264] hover:bg-[#a3e635]"
              }`}
            >
              {isConnectingWeb ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  STARTING MICROPHONE...
                </>
              ) : isWebCallActive ? (
                <>
                  <MicOff className="w-4 h-4" />
                  END WEB VOICE CALL
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  START TALKING TO ALEX NOW (MIC)
                </>
              )}
            </button>

            {isWebCallActive && (
              <span className="neo-badge bg-[#bef264] text-black text-xs animate-pulse">
                ● LIVE AUDIO SESSION CONNECTED
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Multi-Line Simulator */}
      {activeTab === "sim" && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
          <div>
            <h5 className="text-xs font-black uppercase text-black">
              ⚡ Multi-Line SIP Trunk Simulator (5 Concurrent Lines)
            </h5>
            <p className="text-[11px] text-stone-600 font-medium">
              Runs parallel vendor negotiations with dynamic BATNA counter-anchors, audio grounding, and Telegram push.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunningSim}
            className="neo-btn neo-btn-green px-5 py-2.5 text-xs text-black font-black flex items-center gap-2 shadow-[4px_4px_0px_0px_#000] disabled:opacity-50"
          >
            {isRunningSim ? (
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
      )}
    </div>
  );
}
