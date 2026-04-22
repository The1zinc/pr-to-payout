"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { EvaluationResultBox } from "@/components/evaluation-result-box";
import { StatusBadge } from "@/components/status-badge";
import { SubmissionForm } from "@/components/submission-form";
import {
  appealSubmission,
  cancelBounty,
  fundBounty,
  getLiveBountyById,
  getLiveSubmissionByBountyId,
  refundBounty,
  submitProof,
} from "@/lib/contract";
import { getDemoBountyById, getDemoSubmissionByBountyId } from "@/lib/demo";
import { appConfig } from "@/lib/env";
import { formatAddress, formatGen, formatTimestamp } from "@/lib/format";
import type { SubmissionFormValues } from "@/lib/types";
import { buildSubmissionPayload, getDeployAllowedDomains } from "@/lib/validation";

export function BountyDetailView({ bountyId }: { bountyId: string }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(() =>
    Math.floor(Date.now() / 1000),
  );
  const isDemo = bountyId.startsWith("demo-");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const bountyQuery = useQuery({
    queryKey: ["bounty", bountyId],
    queryFn: () => getLiveBountyById(bountyId),
    enabled: !isDemo && appConfig.isLive,
  });

  const submissionQuery = useQuery({
    queryKey: ["submission", bountyId],
    queryFn: () => getLiveSubmissionByBountyId(bountyId),
    enabled: !isDemo && appConfig.isLive,
  });

  const bounty = isDemo ? getDemoBountyById(bountyId) : bountyQuery.data;
  const submission = isDemo
    ? getDemoSubmissionByBountyId(bountyId)
    : submissionQuery.data;

  const isSponsor = Boolean(
    address && bounty && address.toLowerCase() === bounty.sponsor.toLowerCase(),
  );
  const isBuilder = Boolean(
    address &&
      submission?.builder &&
      address.toLowerCase() === submission.builder.toLowerCase(),
  );
  const deadlinePassed = Boolean(
    bounty?.deadlineTimestamp && Number(bounty.deadlineTimestamp) < currentTimestamp,
  );

  async function refresh(message: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["bounties"] }),
      queryClient.invalidateQueries({ queryKey: ["bounty", bountyId] }),
      queryClient.invalidateQueries({ queryKey: ["submission", bountyId] }),
    ]);
    setNotice(message);
  }

  const fundMutation = useMutation({
    mutationFn: async () => {
      if (!address || !bounty) {
        throw new Error("Connect the sponsor wallet to fund the bounty.");
      }

      return fundBounty(address, bounty.id, bounty.payoutAmount);
    },
    onSuccess: () => refresh("Escrow funded. Submissions are open."),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!address || !bounty) {
        throw new Error("Connect the sponsor wallet to cancel the bounty.");
      }

      return cancelBounty(address, bounty.id);
    },
    onSuccess: () => refresh("Bounty closed."),
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!address || !bounty) {
        throw new Error("Connect the sponsor wallet to request a refund.");
      }

      return refundBounty(address, bounty.id);
    },
    onSuccess: () => refresh("Refund completed."),
  });

  const appealMutation = useMutation({
    mutationFn: async () => {
      if (!address || !bounty) {
        throw new Error("Connect the builder wallet to appeal.");
      }

      return appealSubmission(address, bounty.id);
    },
    onSuccess: () => refresh("Appeal submitted."),
  });

  const submitMutation = useMutation({
    mutationFn: async (values: SubmissionFormValues) => {
      if (!address || !bounty) {
        throw new Error("Connect a wallet before submitting proof.");
      }

      const payload = buildSubmissionPayload(
        values,
        bounty.allowedDomains,
        bounty.repoUrl,
      );
      return submitProof(address, bounty.id, payload);
    },
    onSuccess: () => refresh("Submission recorded."),
  });

  const activeError =
    fundMutation.error ??
    cancelMutation.error ??
    refundMutation.error ??
    appealMutation.error ??
    submitMutation.error ??
    bountyQuery.error ??
    submissionQuery.error;

  if (!appConfig.isLive && !isDemo) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-8 text-sm text-slate-300">
        Live bounty details require a configured contract. Open a sample entry instead.
      </div>
    );
  }

  if (!bounty && (bountyQuery.isSuccess || isDemo)) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-8 text-sm text-slate-300">
        Bounty not found.
      </div>
    );
  }

  if (!bounty && activeError) {
    return (
      <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-8 text-sm text-rose-200">
        {activeError.message}
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="space-y-4">
        <div className="h-52 animate-pulse rounded-3xl border border-white/10 bg-slate-950/60" />
        <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-slate-950/60" />
      </div>
    );
  }

  const deployAllowedDomains = getDeployAllowedDomains(bounty.allowedDomains);

  const canFund = !isDemo && isSponsor && bounty.status === "open";
  const canCancel =
    !isDemo &&
    isSponsor &&
    (bounty.status === "open" || (bounty.status === "funded" && !submission));
  const canRefund =
    !isDemo &&
    isSponsor &&
    (bounty.status === "rejected" ||
      (deadlinePassed && bounty.status === "funded"));
  const canSubmit = !isDemo && Boolean(address) && bounty.status === "funded" && !submission;
  const canAppeal =
    !isDemo &&
    Boolean(
      submission &&
        isBuilder &&
        !submission.appealUsed &&
        submission.verdict !== "approved" &&
        ["rejected", "submitted"].includes(bounty.status),
    );

  return (
    <div className="space-y-8">
      <section className="glass glow-emerald relative overflow-hidden rounded-[2.5rem] p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/5 via-transparent to-brand-blue/5 opacity-50" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={bounty.status} />
              {bounty.source === "demo" ? (
                <span className="meta-label rounded-full border border-brand-emerald/20 bg-brand-emerald/10 px-3 py-1 text-[10px] tracking-widest text-brand-emerald">
                  Sandbox Data
                </span>
              ) : null}
            </div>
            <div>
              <h1 className="text-gradient max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                {bounty.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">
                {bounty.description}
              </p>
            </div>
          </div>
          <div className="glass glow-emerald rounded-3xl p-6 text-right md:min-w-[220px]">
            <p className="meta-label opacity-60">
              Contract Escrow
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tighter text-text-primary">
              {formatGen(bounty.payoutAmount)}
            </p>
            <p className="mt-4 flex items-center justify-end gap-2 text-xs font-medium text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" />
              Due {formatTimestamp(bounty.deadlineTimestamp)}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <DetailCard label="Initiator" value={formatAddress(bounty.sponsor)} />
          <DetailCard label="Repository Source" value={bounty.repoUrl} href={bounty.repoUrl} />
          <DetailCard
            label="Authorized Domains"
            value={deployAllowedDomains.join(", ")}
          />
        </div>

        <div className="glass mt-8 rounded-2xl border-white/5 bg-surface-soft p-6 transition-all hover:bg-white/[0.03]">
          <p className="meta-label text-brand-emerald">
            Technical Acceptance Criteria
          </p>
          <div className="mt-4 text-base leading-relaxed text-text-primary opacity-90">
            {bounty.acceptanceCriteria}
          </div>
        </div>
      </section>

      {notice ? (
        <div className="glass flex items-center gap-3 rounded-2xl border-brand-emerald/20 bg-brand-emerald/5 px-4 py-3 text-sm font-medium text-brand-emerald animate-in fade-in slide-in-from-top-2">
          <span className="h-2 w-2 rounded-full bg-brand-emerald animate-ping" />
          {notice}
        </div>
      ) : null}

      {activeError ? (
        <div className="glass rounded-2xl border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm font-medium text-rose-300">
          Error: {activeError.message}
        </div>
      ) : null}

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          {!isDemo ? (
            <div className="glass rounded-[2rem] p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                Governance Controls
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                {canFund ? (
                  <ActionButton
                    onClick={() => fundMutation.mutate()}
                    busy={fundMutation.isPending}
                  >
                    Authorize Escrow
                  </ActionButton>
                ) : null}
                {canCancel ? (
                  <ActionButton
                    onClick={() => cancelMutation.mutate()}
                    busy={cancelMutation.isPending}
                    variant="ghost"
                  >
                    Terminate Bounty
                  </ActionButton>
                ) : null}
                {canRefund ? (
                  <ActionButton
                    onClick={() => refundMutation.mutate()}
                    busy={refundMutation.isPending}
                    variant="ghost"
                  >
                    Claim Refund
                  </ActionButton>
                ) : null}
                {!canFund && !canCancel && !canRefund ? (
                  <div className="flex items-center gap-3 text-sm text-slate-500 italic">
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    Controls disabled for current status
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {canSubmit ? (
            <SubmissionForm
              allowedDomains={deployAllowedDomains}
              repoUrl={bounty.repoUrl}
              pending={submitMutation.isPending}
              onSubmit={async (values) => {
                await submitMutation.mutateAsync(values);
              }}
            />
          ) : (
            <div className="glass rounded-[2rem] p-8 text-sm leading-relaxed text-slate-400">
              <p>
              {isDemo
                ? "This is a sandbox entry. Connect a live Intelligent Contract to start a real campaign."
                : submission
                  ? "A submission has been recorded. This contract enforces a high-integrity 1:1 bounty-to-submission ratio."
                  : bounty.status === "open"
                    ? "Escrow must be funded before the network accepts evidence submissions."
                    : "The network has locked this bounty. Submissions are no longer authorized."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {submission ? (
            <>
              <section className="glass relative overflow-hidden rounded-[2rem] p-8 transition-all hover:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                      Evidence Package
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Builder Proof
                    </h2>
                  </div>
                  <StatusBadge status={submission.status} />
                </div>
                <div className="mt-8 grid gap-4 text-sm md:grid-cols-2">
                  <DetailCard label="Contributor" value={formatAddress(submission.builder)} />
                  <DetailCard label="Submission Hash Time" value={formatTimestamp(submission.createdAt)} />
                  <DetailCard label="PR Source" value={submission.prUrl} href={submission.prUrl} />
                  <DetailCard
                    label="Deployment Verified URL"
                    value={submission.deployUrl}
                    href={submission.deployUrl}
                  />
                </div>
                {submission.note ? (
                  <div className="glass mt-6 rounded-2xl border-white/5 bg-slate-950/40 p-5 text-sm italic text-slate-300">
                    "{submission.note}"
                  </div>
                ) : null}
              </section>

              <EvaluationResultBox submission={submission} />

              {canAppeal ? (
                <div className="glass glow-emerald rounded-[2rem] p-8">
                  <div className="flex items-start gap-4">
                     <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-emerald/10 text-xs font-bold text-brand-emerald">!</span>
                     <p className="text-sm leading-relaxed text-slate-300">
                        A single appeal is available. This triggers a **re-evaluation** by the GenLayer Consensus Layer using the original evidence. Use this if you believe the initial verdict was incorrect.
                     </p>
                  </div>
                  <div className="mt-8">
                    <ActionButton
                      onClick={() => appealMutation.mutate()}
                      busy={appealMutation.isPending}
                    >
                      Re-run Consensus (Appeal)
                    </ActionButton>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="glass flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border-dashed border-white/10 p-12 text-center text-slate-500">
              <div className="mb-4 text-4xl opacity-20">📂</div>
              <p className="text-sm font-medium italic">Pending builder submission...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailCard({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: string;
}) {
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-2 block truncate text-sm font-bold text-text-primary underline decoration-brand-emerald/30 decoration-2 underline-offset-4 transition hover:text-brand-emerald hover:decoration-brand-emerald"
    >
      {value}
    </a>
  ) : (
    <p className="mt-2 truncate text-sm font-bold text-text-primary">{value}</p>
  );

  return (
    <div className="glass group rounded-2xl border-white/5 bg-surface-soft p-4 transition-all hover:bg-white/[0.03]">
      <p className="meta-label transition group-hover:text-text-primary/60">{label}</p>
      {content}
    </div>
  );
}

function ActionButton({
  busy,
  children,
  onClick,
  variant = "primary",
}: {
  busy?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary"
          ? "bg-brand-emerald px-6 py-2.5 text-xs text-slate-950 hover:glow-emerald"
          : "glass px-6 py-2.5 text-xs text-text-primary hover:bg-white/10"
      }`}
    >
      {variant === "primary" && (
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 -translate-x-full group-hover:translate-x-full" />
      )}
      <span className="relative">{busy ? "Awaiting Network..." : children}</span>
    </button>
  );
}
