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
  DollarSign,
  MapPin,
  Phone,
  CheckCircle,
  ExternalLink,
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
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-indigo-200 font-medium">
            Demo Blueprint Spec: <strong>Commercial Espresso Machine (₹1.85L Target)</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={loadDemoPreset}
          className="text-xs text-indigo-400 hover:text-white font-semibold underline underline-offset-4"
        >
          Load Blueprint Preset
        </button>
      </div>

      {/* Product Name with Voice/Text Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
          Product / Equipment Required
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Commercial Espresso Machine, CNC Mill, Industrial Air Compressor"
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 pr-12 text-sm transition"
          />
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`absolute right-2.5 p-2 rounded-lg transition ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Voice Dictation"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dynamic Spec Chip-List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Mandatory Specifications (Strict Audit Protocol)
          </label>
          <span className="text-[11px] text-slate-500">
            Vendors missing any spec will be disqualified
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl min-h-[52px] mb-3">
          {mandatorySpecs.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/70 border border-indigo-700/60 text-indigo-200 rounded-lg text-xs font-medium"
            >
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              {spec}
              <button
                type="button"
                onClick={() => removeSpec(spec)}
                className="hover:text-white ml-1 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {mandatorySpecs.length === 0 && (
            <span className="text-xs text-slate-500 self-center">
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
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500"
          />
          <button
            type="button"
            onClick={addSpec}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Dual Budget Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Target Budget
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[10px] text-slate-500 block mt-1">
            Voice Agent attempts to anchor at or below this target
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Walk-Away Ceiling (Strict Max)
            </span>
            <span className="font-mono text-sm font-bold text-amber-400">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-[10px] text-slate-500 block mt-1">
            Agent immediately walks away if vendor exceeds this limit
          </span>
        </div>
      </div>

      {/* Delivery & Alert Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            Vendor Search Location
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              Telegram Alerts (Chat ID)
            </label>
            <a
              href="https://t.me/ariabis_bot"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
            >
              Start @ariabis_bot <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="text"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="e.g. 123456789 (Open @ariabis_bot to get ID)"
            className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Initializing Autonomous Procurement Engine...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 fill-white" />
            Launch Autonomous Voice AI Procurement Campaign
          </>
        )}
      </button>
    </form>
  );
}
