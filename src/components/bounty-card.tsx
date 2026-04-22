import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { formatGen, formatTimestamp } from "@/lib/format";
import type { Bounty } from "@/lib/types";
import { getDeployAllowedDomains } from "@/lib/validation";

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const deployAllowedDomains = getDeployAllowedDomains(bounty.allowedDomains);

  return (
    <Link
      href={`/bounties/${bounty.id}`}
      className="glass group block rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:glow-emerald hover:bg-white/[0.03] hover:shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={bounty.status} />
        {bounty.source === "demo" ? (
          <span className="meta-label rounded-full border border-brand-emerald/20 bg-brand-emerald/10 px-3 py-1">
            Sandbox
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-xl font-bold text-text-primary transition group-hover:text-brand-emerald">
        {bounty.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary">
        {bounty.description}
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <p className="meta-label">
            Escrow
          </p>
          <p className="mt-1 text-lg font-bold text-text-primary">
            {formatGen(bounty.payoutAmount)}
          </p>
        </div>
        <div>
          <p className="meta-label">
            Deadline
          </p>
          <p className="mt-1 text-xs font-semibold text-text-secondary">
            {formatTimestamp(bounty.deadlineTimestamp)}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {deployAllowedDomains.map((domain) => (
          <span
            key={domain}
            className="rounded-full border border-white/5 bg-surface-soft px-3 py-1 text-[11px] font-medium text-text-secondary"
          >
            {domain}
          </span>
        ))}
      </div>
    </Link>
  );
}
