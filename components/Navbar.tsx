"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Users, HeartHandshake, Compass, PlusCircle } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/demo", label: "Demo Season", icon: Users },
    { href: "/rankings", label: "Rankings & Heatmap", icon: HeartHandshake },
    { href: "/how-it-works", label: "How It Works", icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-surfaceBorder transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gold-dark via-gold to-gold-light flex items-center justify-center text-background shadow-md shadow-gold/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-foreground group-hover:text-gold transition-colors">
              Proxy Hearts
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gold-dark font-medium -mt-1">
              Agentic Dating
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-surfaceHover text-gold border border-gold/30"
                    : "text-muted hover:text-foreground hover:bg-surface/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/add"
            className="flex items-center gap-2 bg-gradient-to-r from-gold via-gold-light to-gold-dark text-background font-semibold px-4 py-2 rounded-xl text-sm shadow-md shadow-gold/20 hover:opacity-95 hover:scale-[1.02] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add a Person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
