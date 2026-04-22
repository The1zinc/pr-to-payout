"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

import { formatAddress } from "@/lib/format";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="glass group flex items-center gap-3 rounded-full bg-surface-soft px-4 py-2 text-sm transition-all hover:bg-white/10"
      >
        <span className="font-bold tracking-tight text-text-primary">
            {formatAddress(address)}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary transition-colors group-hover:text-rose-400">
            Disconnect
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!connector || isPending}
      onClick={() => connector && connect({ connector })}
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-emerald px-6 py-2.5 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:glow-emerald hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 -translate-x-full group-hover:translate-x-full" />
      <span className="relative">
        {isPending ? "Syncing..." : "Connect Wallet"}
      </span>
    </button>
  );
}
