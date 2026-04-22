import { formatStatusLabel } from "@/lib/format";

const classes: Record<string, string> = {
  open: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  funded: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  submitted: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  refunded: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  needs_manual_review: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${classes[status] ?? classes.open}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
