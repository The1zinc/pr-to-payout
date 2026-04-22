"use client";

import { useQuery } from "@tanstack/react-query";

import { BountyCard } from "@/components/bounty-card";
import { getLiveBounties } from "@/lib/contract";
import { getDemoBounties } from "@/lib/demo";
import { appConfig } from "@/lib/env";

export function BountyListView() {
  const liveBountiesQuery = useQuery({
    queryKey: ["bounties", appConfig.contractAddress],
    queryFn: getLiveBounties,
    enabled: appConfig.isLive,
  });

  const liveBounties = liveBountiesQuery.data ?? [];
  const demoBounties = getDemoBounties();
  const primaryBounties = appConfig.isLive ? liveBounties : demoBounties;

  return (
    <div className="space-y-8">
      <section className="glass glow-emerald relative overflow-hidden rounded-[2.5rem] p-8 md:p-12">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-emerald/10 via-transparent to-brand-blue/10 opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="heartbeat h-1.5 w-1.5 rounded-full bg-brand-emerald" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-emerald/80">Available Bounties</span>
          </div>
          <h1 className="text-gradient mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-7xl">
            Audit. Submit. <span className="text-brand-emerald">Earn.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary opacity-80">
            Secure GitHub PR settlement powered by GenLayer. Fund, review, and settle bounties with the reliability of intelligent smart contracts.
          </p>
        </div>
      </section>

      {liveBountiesQuery.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {liveBountiesQuery.error.message}
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
          <h2 className="text-xl font-bold text-text-primary">
            {appConfig.isLive ? "On-chain Bounties" : "Sample Bounties"}
          </h2>
          <span className="text-sm font-medium text-text-secondary">
            {primaryBounties.length} available
          </span>
        </div>

        {liveBountiesQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-3xl border border-white/5 bg-surface-soft/60 shadow-inner"
              />
            ))}
          </div>
        ) : primaryBounties.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {primaryBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-surface-soft/40 p-12 text-center text-sm text-text-secondary">
            <p>No active bounties found.</p>
            <p className="mt-1 opacity-60">Create one and fund escrow to accept submissions.</p>
          </div>
        )}
      </section>

      {appConfig.isLive ? (
        <section className="space-y-6 pt-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <h2 className="text-xl font-bold text-text-primary">Reference Templates</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {demoBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
