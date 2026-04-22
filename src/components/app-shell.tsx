"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { NetworkStatusBanner } from "@/components/network-status-banner";
import { appConfig } from "@/lib/env";

import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/bounties", label: "Bounties" },
  { href: "/create", label: "Create" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-brand-emerald/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_25%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <header className="glass sticky top-2 z-20 mt-2 rounded-full px-4 py-2 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-gradient text-[15px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105">
                PR-to-Payout
              </Link>
              <div className="hidden h-5 w-px bg-white/10 md:block" />
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                        active
                          ? "bg-brand-emerald/10 text-brand-emerald"
                          : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="hidden h-5 w-px bg-white/10 md:block" />
              <ConnectWalletButton />
            </div>
          </div>
        </header>

        {/* Global Heartbeat Utility Line */}
        <div className="mt-1.5 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="heartbeat h-1.5 w-1.5 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">Testnet Bradbury</span>
                </div>
                <div className="h-3 w-px bg-white/5" />
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40">Gas: 1.28 Gwei</span>
                </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40">Sync: 100%</span>
            </div>
        </div>

        <div className="mt-1">
            <NetworkStatusBanner />
        </div>

        <main className="mt-4">{children}</main>

        <footer className="mt-12 border-t border-white/10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary/40">
          Integrated with Bradbury Testnet • GenLayer Intelligent Contracts
        </footer>
      </div>
    </div>
  );
}
