"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { ReadingLogEntry } from "@/lib/analysis";

interface ReadingLogViewerProps {
  logs: ReadingLogEntry[];
}

export function ReadingLogViewer({ logs }: ReadingLogViewerProps) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || visibleCount >= logs.length) return;

    const timer = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [visibleCount, isPlaying, logs.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider">
          <Terminal className="w-4 h-4" />
          <span>Watch the Agent Read (Auditable Trace)</span>
        </div>

        <div className="flex items-center gap-2">
          {visibleCount < logs.length ? (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded bg-surface hover:bg-surfaceHover text-muted hover:text-foreground text-xs"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle className="w-3 h-3" /> Synthesis Done
            </span>
          )}
          <button
            onClick={() => {
              setVisibleCount(1);
              setIsPlaying(true);
            }}
            className="p-1 rounded bg-surface hover:bg-surfaceHover text-muted hover:text-foreground text-xs"
            title="Replay"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-background border border-surfaceBorder rounded-xl p-4 font-mono text-xs text-muted max-h-48 overflow-y-auto space-y-1.5">
        {logs.slice(0, visibleCount).map((entry, idx) => (
          <div key={idx} className="flex items-start gap-2 animate-fade-in">
            <span className="text-gold/60">&gt;</span>
            <span className="text-foreground/90 leading-relaxed">{entry.text}</span>
            {entry.source && (
              <span className="text-[10px] text-muted/60 ml-auto shrink-0 bg-surface px-1.5 py-0.5 rounded border border-surfaceBorder/40">
                {entry.source}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
