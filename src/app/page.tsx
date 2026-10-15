import { IntakeForm } from "@/components/IntakeForm";
import { Zap, ArrowRight, ShieldCheck, Flame, Radio } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between">
      {/* Top Ticker Tape Bar */}
      <div className="bg-[#fde047] border-b-2 border-black py-2 px-4 overflow-hidden whitespace-nowrap">
        <div className="font-mono text-xs font-black uppercase tracking-wider flex items-center justify-between max-w-6xl mx-auto">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black rounded-full animate-ping" />
            <span>⚡ VOICE AI TELEPHONY EDGE: ACTIVE</span>
          </span>
          <span className="hidden md:inline">/// 5-10 PARALLEL SIP TRUNK LINES</span>
          <span className="hidden md:inline">/// SUB-280MS BATNA BROKER</span>
          <span className="hidden md:inline">/// VERIFIED AUDIO PROOF ON TAPE</span>
          <span className="neo-badge bg-black text-white text-[10px] py-0.5">V2.4 SPEC</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b-3 border-black bg-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#bef264] border-2 border-black shadow-[3px_3px_0px_#000] rounded-xl flex items-center justify-center font-black text-xl text-black">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight uppercase text-black">
                  THE NEGOTIATOR
                </span>
                <span className="neo-badge bg-[#bef264] text-black">
                  HaggleOS
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-600">
                Autonomous Voice AI Procurement & Market Research
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/c/CMP-2026-8841"
              className="neo-btn bg-[#fde047] text-xs px-4 py-2 font-black uppercase flex items-center gap-1.5"
            >
              Demo Deal Room <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 py-12 w-full space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-[3px_3px_0px_#000] rounded-full text-xs font-black uppercase tracking-wider">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            Deterministic Voice AI Haggling Engine
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight uppercase text-black">
            Lock In Wholesale Deals With <br />
            <span className="bg-[#bef264] border-2 border-black px-3 py-0.5 shadow-[5px_5px_0px_#000] inline-block -rotate-1 mt-2">
              Autonomous Voice AI Agents
            </span>
          </h1>

          <p className="text-sm md:text-base font-medium text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Dispatches 5–10 parallel voice agents to call distributors simultaneously, verifies technical specs on tape,
            cross-references live leverage in <strong className="bg-[#fde047] px-1 border border-black font-bold">&lt;280ms</strong>, and delivers audio proof straight to your Telegram.
          </p>
        </div>

        {/* 4 Neo-Brutalist Metric Blocks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#bef264] border-3 border-black shadow-[4px_4px_0px_#000] rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono font-black text-black block mb-1">
              Voice Turn Latency
            </span>
            <span className="text-2xl font-black font-mono text-black">&lt; 550 ms</span>
          </div>
          <div className="p-4 bg-[#fde047] border-3 border-black shadow-[4px_4px_0px_#000] rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono font-black text-black block mb-1">
              Concurrent Lines
            </span>
            <span className="text-2xl font-black font-mono text-black">5–10 Calls</span>
          </div>
          <div className="p-4 bg-[#38bdf8] border-3 border-black shadow-[4px_4px_0px_#000] rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono font-black text-black block mb-1">
              BATNA Broker
            </span>
            <span className="text-2xl font-black font-mono text-black">&lt; 280 ms</span>
          </div>
          <div className="p-4 bg-[#fda4af] border-3 border-black shadow-[4px_4px_0px_#000] rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono font-black text-black block mb-1">
              Evidence Standard
            </span>
            <span className="text-2xl font-black font-mono text-black">Audio + JSON</span>
          </div>
        </div>

        {/* Intake Form Neo-Brutalist Card */}
        <div className="neo-box-lg p-6 md:p-8 bg-white relative">
          {/* Top Stamp Label */}
          <div className="flex items-center justify-between pb-5 mb-6 border-b-2 border-black">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full border border-black animate-pulse" />
                <h2 className="text-xl font-black uppercase text-black tracking-tight">
                  Initiate Procurement Mission
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                Input your required product and technical constraints. The platform executes autonomous discovery and parallel phone negotiations.
              </p>
            </div>
            <span className="neo-badge bg-[#38bdf8] text-black hidden sm:inline-block">
              STEP 01 // INTAKE
            </span>
          </div>

          <IntakeForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-3 border-black bg-white py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono font-bold text-slate-700">
          <div>
            HAGGLEOS BLUEPRINT V2.4 • NEXT.JS 15 • VAPI VOICE EDGE • TELEGRAM BOT
          </div>
          <div className="flex items-center gap-4">
            <Link href="/c/CMP-2026-8841" className="underline hover:text-black">
              Demo Deal Room
            </Link>
            <a href="https://t.me/ariabis_bot" target="_blank" rel="noreferrer" className="underline hover:text-black">
              Telegram Bot (@ariabis_bot)
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
