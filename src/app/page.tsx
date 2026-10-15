import { IntakeForm } from "@/components/IntakeForm";
import { Zap, ShieldCheck, PhoneCall, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
              N
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white flex items-center gap-2">
                THE NEGOTIATOR
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  v2.4
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Voice AI Procurement & Market Research System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/c/CMP-2026-8841"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/80 transition"
            >
              Demo Deal Room <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Autonomous Outbound Voice AI Telephony + Real-Time BATNA Broker
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Lock In Wholesale Deals With <br />
            <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Autonomous Voice AI Agents
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
            Dispatches 5–10 parallel voice agents directly to verified distributors, verifies technical specs on tape,
            cross-references live leverage in &lt;280ms, and delivers verified audio proof to your WhatsApp.
          </p>
        </div>

        {/* Spec Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Voice Latency</span>
            <span className="text-sm font-bold font-mono text-emerald-400">&lt; 550 ms</span>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Parallel Calls</span>
            <span className="text-sm font-bold font-mono text-indigo-400">5–10 Lines</span>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">BATNA Broker</span>
            <span className="text-sm font-bold font-mono text-amber-400">&lt; 280 ms</span>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Evidence Standard</span>
            <span className="text-sm font-bold font-mono text-teal-400">Audio + JSON</span>
          </div>
        </div>

        {/* Intake Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Initiate Procurement Mission</h2>
            <p className="text-xs text-slate-400">
              Enter your required product and technical constraints. The system handles automated research, parallel phone calls, and price negotiation.
            </p>
          </div>

          <IntakeForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-600">
        <p>HaggleOS Technical Blueprint v2.4 • Next.js 15 • n8n Pro Cloud • MongoDB Atlas • Vapi.ai Telephony</p>
      </footer>
    </main>
  );
}
