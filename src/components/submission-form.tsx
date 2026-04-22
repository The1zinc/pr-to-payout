"use client";

import { useState } from "react";
import { ZodError } from "zod";

import type { SubmissionFormValues } from "@/lib/types";
import {
  buildSubmissionPayload,
  flattenZodErrors,
  getDeployAllowedDomains,
} from "@/lib/validation";

const emptyValues: SubmissionFormValues = {
  prUrl: "",
  deployUrl: "",
  note: "",
};

interface SubmissionFormProps {
  allowedDomains: string[];
  repoUrl?: string;
  disabled?: boolean;
  pending?: boolean;
  onSubmit: (values: SubmissionFormValues) => Promise<void>;
}

export function SubmissionForm({
  allowedDomains,
  repoUrl,
  disabled,
  pending,
  onSubmit,
}: SubmissionFormProps) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const deployAllowedDomains = getDeployAllowedDomains(allowedDomains);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      buildSubmissionPayload(values, allowedDomains, repoUrl);
      setErrors({});
      setFormError(null);
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors(flattenZodErrors(error));
        return;
      }

      setFormError(
        error instanceof Error ? error.message : "Unable to submit proof.",
      );
    }
  }

  function update<Field extends keyof SubmissionFormValues>(
    field: Field,
    value: SubmissionFormValues[Field],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/55 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          New submission
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">
          PR and deployment
        </h3>
      </div>

      <Field label="GitHub PR URL" error={errors.prUrl}>
        <input
          value={values.prUrl}
          onChange={(event) => update("prUrl", event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40"
          placeholder="https://github.com/acme/site/pull/42"
        />
      </Field>

      <Field label="Deployment URL" error={errors.deployUrl}>
        <input
          value={values.deployUrl}
          onChange={(event) => update("deployUrl", event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40"
          placeholder="https://feature-branch.vercel.app"
        />
      </Field>

      <Field label="Optional note" error={errors.note}>
        <textarea
          value={values.note}
          onChange={(event) => update("note", event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40"
          placeholder="Optional implementation notes."
        />
      </Field>

      <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
        Accepted deployment domains: {deployAllowedDomains.join(", ")}.
      </div>

      {formError ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Evaluating..." : "Submit proof"}
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
