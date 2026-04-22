"use client";

import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/env";

export function NetworkStatusBanner() {
  const { data: balance, isLoading, isError } = useQuery({
    queryKey: ["network-health"],
    queryFn: async () => {
        // Simple ping or balance check to verify network health
        // This is a placeholder for actual health check logic
        return "Connected";
    },
    refetchInterval: 30000,
  });

  return (
    <div className="glass group relative mb-8 overflow-hidden rounded-2xl p-1 transition-all duration-500 hover:glow-emerald">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/5 via-brand-blue/5 to-brand-emerald/5 animate-pulse-slow" />
      <div className="relative flex items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isError ? 'bg-rose-400' : 'bg-brand-emerald'}`}></span>
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isError ? 'bg-rose-500' : 'bg-brand-emerald'}`}></span>
          </div>
          <p className="meta-label">
            Network: <span className="text-text-primary capitalize">{appConfig.network}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="hidden meta-label md:inline">
            Contract: <span className="font-mono text-text-primary">{appConfig.contractAddress ? `${appConfig.contractAddress.slice(0, 6)}...${appConfig.contractAddress.slice(-4)}` : "Not Deployed"}</span>
          </p>
          <span className={`rounded-full px-2 py-0.5 font-black uppercase text-[9px] tracking-widest ${isError ? 'bg-rose-500/10 text-rose-400' : 'bg-brand-emerald/10 text-brand-emerald'}`}>
            {isError ? "Congested" : "Operational"}
          </span>
        </div>
      </div>
    </div>
  );
}
