"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Plus,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Loader2,
  MapPin,
  CheckCircle,
  ExternalLink,
  Target,
  AlertTriangle,
} from "lucide-react";

export function IntakeForm() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [newSpec, setNewSpec] = useState("");
  const [mandatorySpecs, setMandatorySpecs] = useState<string[]>([
    "Dual boiler system",
    "Rotary pump",
    "Min 1-year on-site warranty",
  ]);
  const [budgetTarget, setBudgetTarget] = useState<number>(185000);
  const [budgetMax, setBudgetMax] = useState<number>(215000);
  const [currency, setCurrency] = useState("INR");
  const [location, setLocation] = useState("Bangalore, India");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [userPhone, setUserPhone] = useState("+919876543210");
  const [userName, setUserName] = useState("Allen");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Speech API for voice dictation
  const toggleVoiceRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your request.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setProductName(transcript);
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const addSpec = () => {
    if (newSpec.trim() && !mandatorySpecs.includes(newSpec.trim())) {
      setMandatorySpecs([...mandatorySpecs, newSpec.trim()]);
      setNewSpec("");
    }
  };

  const removeSpec = (specToRemove: string) => {
    setMandatorySpecs(mandatorySpecs.filter((s) => s !== specToRemove));
  };

  const loadDemoPreset = () => {
    setProductName("Commercial Espresso Machine");
    setMandatorySpecs([
      "Dual boiler system",
      "Rotary pump",
      "Min 1-year on-site warranty",
    ]);
    setBudgetTarget(185000);
    setBudgetMax(215000);
    setLocation("Bangalore, India");
    setUserPhone("+919876543210");
    setUserName("Allen");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) {
      setError("Please specify a product name");
      return;
    }

    if (mandatorySpecs.length === 0) {
      setError("Please add at least one mandatory specification");
      return;
    }

    if (budgetTarget > budgetMax) {
      setError("Target budget cannot exceed walk-away ceiling");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          specs_required: mandatorySpecs,
          target_budget: budgetTarget,
          max_budget: budgetMax,
          currency,
          location,
          user_phone: userPhone,
          telegram_chat_id: telegramChatId,
          user_name: userName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate procurement campaign");
      }

      router.push(data.redirect_url);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-[#fda4af] border-3 border-black shadow-[4px_4px_0px_#000] rounded-xl text-black font-bold text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-black shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Banner */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#fef08a] border-2 border-black shadow-[3px_3px_0px_#000] rounded-xl gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-black" />
          <span className="text-xs font-mono font-bold text-black">
            Blueprint Benchmark: <strong>Commercial Espresso Machine (₹1.85L Target)</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={loadDemoPreset}
          className="neo-btn bg-white text-[11px] px-3 py-1 font-black uppercase"
        >
          Load Blueprint Preset
        </button>
      </div>

      {/* Product Name with Voice/Text Input */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
          Product / Equipment Required
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Commercial Espresso Machine, CNC Mill, Industrial Air Compressor"
            className="w-full neo-input px-4 py-3 text-black font-bold placeholder:text-slate-400 pr-14 text-sm"
          />
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`absolute right-2 px-2.5 py-1.5 rounded-lg border-2 border-black transition font-bold text-xs flex items-center gap-1 ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-[#bef264] text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
            }`}
            title="Voice Dictation"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isRecording ? "Listening" : "Voice"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Spec Chip-List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-black">
            Mandatory Specifications (Strict Audit Protocol)
          </label>
          <span className="text-[11px] font-mono text-slate-600 font-bold">
            Missing spec = Disqualified (Score 0)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-3 bg-[#f1eee7] border-2 border-black rounded-xl min-h-[56px] mb-3">
          {mandatorySpecs.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#bef264] border-2 border-black shadow-[2px_2px_0px_#000] text-black rounded-lg text-xs font-black uppercase tracking-tight"
            >
              <CheckCircle className="w-3.5 h-3.5 text-black" />
              {spec}
              <button
                type="button"
                onClick={() => removeSpec(spec)}
                className="hover:bg-black hover:text-white rounded-full p-0.5 ml-1 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {mandatorySpecs.length === 0 && (
            <span className="text-xs font-mono font-bold text-slate-500 self-center">
              No mandatory specifications added yet.
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSpec}
            onChange={(e) => setNewSpec(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSpec();
              }
            }}
            placeholder="Type a required spec (e.g. Rotary pump, 220V 1-phase) and press Enter"
            className="flex-1 neo-input px-4 py-2 text-xs text-black font-semibold placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={addSpec}
            className="neo-btn bg-[#38bdf8] px-4 py-2 text-xs font-black uppercase flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Spec
          </button>
        </div>
      </div>

      {/* Dual Budget Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[#fef9c3] border-3 border-black shadow-[4px_4px_0px_#000] rounded-xl">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Target Budget
            </span>
            <span className="font-mono text-base font-black text-black bg-[#bef264] px-2 py-0.5 border border-black rounded shadow-[2px_2px_0px_#000]">
              ₹{budgetTarget.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={budgetTarget}
            onChange={(e) => setBudgetTarget(Number(e.target.value))}
            className="w-full h-3 bg-black rounded-lg appearance-none cursor-pointer accent-[#bef264]"
          />
          <span className="text-[10px] font-mono font-bold text-slate-700 block mt-1">
            Voice Agent anchors negotiation at or below this target
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Walk-Away Ceiling
            </span>
            <span className="font-mono text-base font-black text-black bg-[#fda4af] px-2 py-0.5 border border-black rounded shadow-[2px_2px_0px_#000]">
              ₹{budgetMax.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={budgetMax}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
            className="w-full h-3 bg-black rounded-lg appearance-none cursor-pointer accent-[#f43f5e]"
          />
          <span className="text-[10px] font-mono font-bold text-slate-700 block mt-1">
            Strict maximum: Agent rejects deal if vendor exceeds this limit
          </span>
        </div>
      </div>

      {/* Location & Telegram Alert Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Vendor Search Location
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full neo-input px-4 py-2.5 text-xs text-black font-bold"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-600" />
              Telegram Alerts (Chat ID)
            </label>
            <a
              href="https://t.me/ariabis_bot"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono font-black text-sky-700 hover:text-black flex items-center gap-1 underline underline-offset-2"
            >
              Start @ariabis_bot <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="text"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="e.g. 123456789 (Open bot to get your ID)"
            className="w-full neo-input px-4 py-2.5 text-xs text-black font-mono font-bold placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full neo-btn neo-btn-green py-4 px-6 text-sm md:text-base font-black uppercase tracking-wider shadow-[6px_6px_0px_#000] hover:shadow-[3px_3px_0px_#000] active:shadow-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            DISPATCHING AUTONOMOUS PROCUREMENT ENGINE...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            LAUNCH AUTONOMOUS VOICE AI PROCUREMENT CAMPAIGN
          </>
        )}
      </button>
    </form>
  );
}
