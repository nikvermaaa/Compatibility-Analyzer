"use client";

import React from "react";
import { Flame, Heart } from "lucide-react";

interface ChemistryMeterProps {
  score: number; // 0 to 100
}

export function ChemistryMeter({ score }: ChemistryMeterProps) {
  const percentage = Math.min(100, Math.max(0, score));

  let label = "Warming Up";
  let color = "from-amber-500 to-yellow-400";
  if (percentage >= 80) {
    label = "Electric Spark";
    color = "from-rose-500 via-pink-500 to-gold";
  } else if (percentage >= 60) {
    label = "Strong Connection";
    color = "from-gold via-amber-400 to-rose-400";
  } else if (percentage >= 40) {
    label = "Comfortable Vibe";
    color = "from-blue-400 to-teal-400";
  }

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
      <div className="flex items-center justify-between w-full text-xs font-medium">
        <span className="flex items-center gap-1 text-gold text-[11px] uppercase tracking-wider font-semibold">
          <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          Chemistry Meter
        </span>
        <span className="text-foreground font-mono font-bold">{percentage}% · {label}</span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-surfaceBorder/80 p-0.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
