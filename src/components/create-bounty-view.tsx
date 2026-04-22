"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";

import { CreateBountyForm } from "@/components/create-bounty-form";
import { createBounty } from "@/lib/contract";
import { demoTemplates } from "@/lib/demo";
import { appConfig } from "@/lib/env";
import type { CreateBountyFormValues } from "@/lib/types";
import { buildCreateBountyPayload } from "@/lib/validation";

export function CreateBountyView() {
  const router = useRouter();
  const { address } = useAccount();
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    demoTemplates[0]?.id ?? "",
  );

  const selectedTemplate =
    demoTemplates.find((template) => template.id === selectedTemplateId) ??
    demoTemplates[0];

  const createMutation = useMutation({
    mutationFn: async (values: CreateBountyFormValues) => {
      if (!address) {
        throw new Error("Connect your wallet before creating a bounty.");
      }

      if (!appConfig.isLive) {
        throw new Error(
          "Set NEXT_PUBLIC_CONTRACT_ADDRESS to enable live bounty creation.",
        );
      }

      const payload = buildCreateBountyPayload(values);
      return createBounty(address, payload);
    },
    onSuccess: () => {
      router.push("/bounties");
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="glass rounded-[2rem] p-6 md:p-10">
          <div className="flex items-center gap-2">
            <span className="heartbeat h-1.5 w-1.5 rounded-full bg-brand-emerald" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-emerald/80">Campaign Creation</span>
          </div>
          <h1 className="text-gradient mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Create Bounty
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary opacity-80">
            Creation and funding are separate transactions. Create the record first, then fund escrow from the bounty detail page.
          </p>
        </section>

        <section className="glass space-y-4 rounded-3xl border-white/5 bg-surface-soft p-6">
          <div>
            <p className="meta-label">
              Templates
            </p>
            <h2 className="mt-2 text-xl font-bold text-text-primary">
              Use a Starter Brief
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {demoTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  template.id === selectedTemplateId
                    ? "border-brand-emerald/40 bg-brand-emerald/10 shadow-lg shadow-brand-emerald/5"
                    : "border-white/5 bg-surface-soft/60 hover:bg-white/5"
                }`}
              >
                <p className={`text-sm font-bold ${template.id === selectedTemplateId ? 'text-brand-emerald' : 'text-text-primary'}`}>
                    {template.title}
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-text-secondary opacity-60">
                  {template.payoutAmountGen} GEN
                </p>
              </button>
            ))}
          </div>
        </section>

        <CreateBountyForm
          key={selectedTemplate.id}
          initialValues={{
            title: selectedTemplate.title,
            description: selectedTemplate.description,
            repoUrl: selectedTemplate.repoUrl,
            acceptanceCriteria: selectedTemplate.acceptanceCriteria,
            payoutAmountGen: selectedTemplate.payoutAmountGen,
            extraDomains: selectedTemplate.extraDomains,
          }}
          pending={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values);
          }}
        />

        {createMutation.error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {createMutation.error.message}
          </div>
        ) : null}
      </div>

      <aside className="space-y-6">
        <section className="glass rounded-3xl border-white/5 bg-surface-soft p-6">
          <p className="meta-label">
            Workflow
          </p>
          <ol className="mt-4 space-y-4 text-sm leading-relaxed text-text-secondary">
            <li className="flex gap-3"><span className="font-bold text-brand-emerald">01.</span> Create the bounty record.</li>
            <li className="flex gap-3"><span className="font-bold text-brand-emerald">02.</span> Fund escrow.</li>
            <li className="flex gap-3"><span className="font-bold text-brand-emerald">03.</span> Submit a PR and deployment URL.</li>
            <li className="flex gap-3"><span className="font-bold text-brand-emerald">04.</span> Record the verdict and settlement.</li>
          </ol>
        </section>

        <section className="glass rounded-3xl border-white/5 bg-surface-soft p-6">
          <p className="meta-label">
            Current Limits
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
            <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-emerald" />
                No backend or database.
            </li>
            <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-emerald" />
                Public URLs only.
            </li>
            <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-emerald" />
                Vercel-first deployment.
            </li>
            <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-emerald" />
                One submission per bounty.
            </li>
          </ul>
          <Link
            href="/bounties"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-surface-soft px-4 py-2.5 text-sm font-bold text-text-primary transition hover:bg-white/5"
          >
            Explore Active Bounties
          </Link>
        </section>
      </aside>
    </div>
  );
}
