import { StatusBadge } from "@/components/status-badge";
import type { Submission } from "@/lib/types";

export function EvaluationResultBox({ submission }: { submission: Submission }) {
  const isApproved = submission.verdict === "approved";
  const isPending = submission.status === "pending";

  return (
    <section className={`glass relative overflow-hidden rounded-[2rem] p-8 transition-all ${isApproved ? 'glow-emerald' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="meta-label">
            Intelligent Consensus Outcome
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            Audit Report
          </h3>
        </div>
        <StatusBadge status={submission.verdict} />
      </div>
      
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl border-white/5 bg-surface-soft p-6">
          <p className="meta-label text-brand-emerald">
            Technical Rationale
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-primary/90">
            {submission.reasoning}
          </p>
        </div>
        <div className="glass rounded-2xl border-white/5 bg-surface-soft p-6">
          <p className="meta-label text-brand-blue">
            Evidence Summary
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-primary/90">
            {submission.evidenceSummary || "Automated consensus report generated via GenLayer VM."}
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="meta-label">
          Source Verification Log
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {submission.checkedUrls.map((url, index) => (
            <a
              key={`${index}-${url}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 rounded-full border border-white/5 bg-surface-soft px-4 py-1.5 text-[11px] font-medium text-text-secondary transition-all hover:border-brand-emerald/30 hover:bg-brand-emerald/5 hover:text-brand-emerald"
            >
              <span className="h-1 w-1 rounded-full bg-slate-600 transition-all group-hover:bg-brand-emerald" />
              {new URL(url).hostname}
            </a>
          ))}
          {submission.checkedUrls.length === 0 && (
             <span className="text-xs italic text-text-secondary opacity-50">No external URLs required.</span>
          )}
        </div>
      </div>
    </section>
  );
}
