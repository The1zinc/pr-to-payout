"use client";

import { useState } from "react";
import { ZodError } from "zod";

import type { CreateBountyFormValues } from "@/lib/types";
import { buildCreateBountyPayload, flattenZodErrors } from "@/lib/validation";

const emptyValues: CreateBountyFormValues = {
  title: "",
  description: "",
  repoUrl: "",
  acceptanceCriteria: "",
  payoutAmountGen: "",
  deadlineLocal: "",
  extraDomains: "",
};

interface CreateBountyFormProps {
  disabled?: boolean;
  initialValues?: Partial<CreateBountyFormValues>;
  pending?: boolean;
  submitLabel?: string;
  onSubmit: (values: CreateBountyFormValues) => Promise<void>;
}

export function CreateBountyForm({
  disabled,
  initialValues,
  pending,
  submitLabel = "Create bounty",
  onSubmit,
}: CreateBountyFormProps) {
  const [values, setValues] = useState<CreateBountyFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      buildCreateBountyPayload(values);
      setErrors({});
      setFormError(null);
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors(flattenZodErrors(error));
        return;
      }

      setFormError(
        error instanceof Error ? error.message : "Unable to create the bounty.",
      );
    }
  }

  function update<Field extends keyof CreateBountyFormValues>(
    field: Field,
    value: CreateBountyFormValues[Field],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  return (
    <form onSubmit={handleSubmit} className="glass glow-emerald space-y-6 rounded-[2rem] p-8 shadow-2xl">
      <div className="mb-6">
        <p className="meta-label text-brand-emerald">
          New Campaign
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
          Bounty Parameters
        </h2>
      </div>

      <Field label="Title" error={errors.title}>
        <input
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4"
          placeholder="Fix mobile nav overlap"
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4"
          placeholder="Describe the task and any context the builder needs."
        />
      </Field>

      <Field label="Repository URL" error={errors.repoUrl}>
        <input
          value={values.repoUrl}
          onChange={(event) => update("repoUrl", event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4"
          placeholder="https://github.com/acme/site"
        />
      </Field>

      <Field label="Acceptance criteria" error={errors.acceptanceCriteria}>
        <textarea
          value={values.acceptanceCriteria}
          onChange={(event) => update("acceptanceCriteria", event.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4"
          placeholder="List the checks required for approval."
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Payout (GEN)" error={errors.payoutAmountGen}>
          <input
            value={values.payoutAmountGen}
            onChange={(event) => update("payoutAmountGen", event.target.value)}
            inputMode="decimal"
            className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4"
            placeholder="1.5"
          />
        </Field>
        <Field label="Deadline (optional)" error={errors.deadlineLocal}>
          <input
            type="datetime-local"
            value={values.deadlineLocal}
            onChange={(event) => update("deadlineLocal", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4 [color-scheme:dark]"
          />
        </Field>
      </div>

      <Field label="Extra allowed domains" error={errors.extraDomains}>
        <input
          value={values.extraDomains}
          onChange={(event) => update("extraDomains", event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-surface-soft px-4 py-3 text-sm text-text-primary outline-none ring-brand-emerald/20 transition focus:border-brand-emerald/50 focus:ring-4"
          placeholder="preview.example.com, demo.acme.dev"
        />
      </Field>

      <div className="rounded-2xl border border-brand-emerald/20 bg-brand-emerald/5 p-4 text-xs leading-relaxed text-text-secondary">
        <strong className="text-brand-emerald uppercase tracking-wider">Note:</strong> Deployment URLs must use `vercel.app` or one of the authorized domains listed above.
      </div>

      {formError ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || pending}
        className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-brand-emerald px-8 py-4 text-sm font-bold text-slate-950 transition-all hover:glow-emerald disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 -translate-x-full group-hover:translate-x-full" />
        <span className="relative">
          {pending ? "Awaiting Network..." : submitLabel}
        </span>
      </button>
    </form>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      {error ? <span className="text-sm text-rose-300">{error}</span> : null}
    </label>
  );
}
