import Link from "next/link";
import { Sparkles, Shield, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-surfaceBorder bg-surface/40 mt-20 py-12 text-sm text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2 text-foreground font-serif font-bold text-base">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>Proxy Hearts</span>
          </div>
          <p className="text-xs text-muted">
            Autonomous multi-agent dating simulation. Your agent dates for you.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <Link href="/how-it-works" className="hover:text-gold transition-colors">
            Architecture
          </Link>
          <Link href="/demo" className="hover:text-gold transition-colors">
            Frozen 25-Person Demo
          </Link>
          <div className="flex items-center gap-1.5 text-muted/80">
            <Shield className="w-3.5 h-3.5 text-gold/80" />
            <span>Two Sources Only (LinkedIn + Public IG)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
