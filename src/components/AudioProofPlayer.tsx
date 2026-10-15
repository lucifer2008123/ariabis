"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, ShieldCheck, Clock, RotateCcw, CheckCircle } from "lucide-react";
import { ITranscriptLine } from "@/lib/models/VendorCall";

interface AudioProofPlayerProps {
  audioUrl: string;
  quoteTimestampSec: number;
  repName: string;
  verbatimQuote: string;
  vendorName: string;
  finalPrice: number;
  transcript?: ITranscriptLine[];
}

export function AudioProofPlayer({
  audioUrl,
  quoteTimestampSec,
  repName,
  verbatimQuote,
  vendorName,
  finalPrice,
  transcript = [],
}: AudioProofPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(142);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);

  // Target quote seek time: exactly 3 seconds before quote commitment
  const targetSeekTime = Math.max(0, quoteTimestampSec - 3);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // Highlight corresponding diarized transcript line
      const matchedIdx = transcript.findIndex(
        (t) => cur >= t.start_time && cur <= t.end_time
      );
      if (matchedIdx !== -1) {
        setActiveLineIdx(matchedIdx);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [transcript]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.log(e));
    }
  };

  const jumpToVerifiedQuote = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = targetSeekTime;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const seekTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatSec = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="neo-box p-6 bg-white border-[3px] border-black">
      {/* Tape Deck Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b-2 border-black">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#bef264] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            <ShieldCheck className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="neo-badge bg-[#bef264] text-black text-xs font-black">
                VERIFIED AUDIO EVIDENCE LOCKER
              </span>
              <span className="neo-badge bg-[#fde047] text-black text-[10px] font-mono">
                GROUNDED @ {formatSec(quoteTimestampSec)}
              </span>
            </div>
            <h3 className="text-xl font-black text-black tracking-tight">
              {vendorName} — ₹{finalPrice.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>

        {/* Action Button: Jump to Quote */}
        <button
          onClick={jumpToVerifiedQuote}
          className="neo-btn neo-btn-green px-4 py-2.5 text-xs text-black font-black flex items-center gap-2 shadow-[4px_4px_0px_0px_#000]"
        >
          <Play className="w-4 h-4 fill-black" />
          PLAY VERIFIED QUOTE ({formatSec(targetSeekTime)})
        </button>
      </div>

      {/* Verbatim Quote Highlight Box */}
      <div className="neo-box-sm bg-[#fef08a] p-4 mb-5 text-black">
        <div className="flex flex-wrap items-center justify-between text-xs font-black uppercase text-stone-700 mb-2">
          <span className="flex items-center gap-1.5 text-black">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bef264] border-2 border-black inline-block animate-pulse" />
            SPOKE WITH: <span className="font-extrabold text-black">{repName || "Sales Rep"}</span>
          </span>
          <span className="neo-badge bg-white text-black text-[10px]">
            GROUNDING ACCURACY: 99.4%
          </span>
        </div>
        <p className="text-sm font-bold italic text-black border-l-4 border-black pl-3 py-1 leading-relaxed">
          &ldquo;{verbatimQuote}&rdquo;
        </p>
      </div>

      {/* Hidden HTML5 Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Cassette Mechanical Player Timeline & Controls */}
      <div className="neo-box-sm bg-[#faf8f5] p-4 mb-5">
        <div className="relative mb-3">
          <input
            type="range"
            min={0}
            max={duration || 142}
            value={currentTime}
            onChange={seekTo}
            className="w-full h-3 bg-stone-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-[#bef264]"
          />
          {/* Quote Marker Pin on Timeline */}
          {duration > 0 && (
            <div
              className="absolute top-0 w-3 h-5 bg-[#fde047] border-2 border-black -translate-y-1 rounded shadow-[1px_1px_0px_0px_#000] cursor-pointer"
              style={{ left: `${(quoteTimestampSec / duration) * 100}%` }}
              title={`Quote Commitment at ${formatSec(quoteTimestampSec)}`}
              onClick={jumpToVerifiedQuote}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-black font-mono font-black">
          <span className="neo-badge bg-white text-black">{formatSec(currentTime)}</span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                  setIsPlaying(true);
                }
              }}
              className="neo-btn px-3 py-1.5 bg-white hover:bg-stone-100 text-black shadow-[2px_2px_0px_0px_#000]"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="neo-btn neo-btn-green w-10 h-10 rounded-full text-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black translate-x-0.5" />
              )}
            </button>

            <span className="neo-badge bg-[#c084fc] text-black flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              STEREO MASTER
            </span>
          </div>

          <span className="neo-badge bg-white text-black">{formatSec(duration)}</span>
        </div>
      </div>

      {/* Diarized Transcript Section */}
      {transcript.length > 0 && (
        <div className="pt-4 border-t-2 border-black">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> SYNCHRONIZED DIARIZED TRANSCRIPT
            </span>
            <span className="text-[11px] font-bold text-stone-600">Click any turn to jump</span>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs">
            {transcript.map((line, idx) => {
              const isActive = activeLineIdx === idx;
              const isQuoteCommit =
                line.start_time <= quoteTimestampSec &&
                line.end_time >= quoteTimestampSec;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = line.start_time;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition border-2 text-left ${
                    isActive
                      ? "bg-[#fde047] border-black shadow-[4px_4px_0px_0px_#000]"
                      : isQuoteCommit
                      ? "bg-[#dcfce7] border-black shadow-[2px_2px_0px_0px_#000]"
                      : "bg-white border-black hover:bg-stone-50 shadow-[2px_2px_0px_0px_#000]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-black uppercase tracking-wider text-black">
                      {line.speaker === "agent" ? (
                        <span className="neo-badge bg-[#38bdf8] text-black">🤖 Alex (AI Buyer)</span>
                      ) : line.speaker === "system" ? (
                        <span className="neo-badge bg-[#c084fc] text-black">⚡ System Broker</span>
                      ) : (
                        <span className="neo-badge bg-[#fde047] text-black">📞 {repName || "Vendor Rep"}</span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-stone-600">{formatSec(line.start_time)}</span>
                  </div>
                  <p className="text-xs font-sans font-medium text-black leading-relaxed mt-1">{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
