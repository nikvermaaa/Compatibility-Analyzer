import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const serifFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proxy Hearts | Autonomous Agentic Dating Platform",
  description:
    "Each person is represented by an AI agent. The agent reads their LinkedIn and public Instagram, goes on real dates, and ranks matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable} dark`}>
      <body className="bg-background text-foreground flex flex-col min-h-screen antialiased selection:bg-gold/20 selection:text-gold">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
