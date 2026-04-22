import Link from "next/link";
import { ShieldCheck, Gem, Database, ArrowRight } from "lucide-react";
import { demoTemplates } from "@/lib/demo";

export default function Home() {
  return (
    <div className="space-y-10 py-4 md:py-6">
      {/* --- HERO SECTION --- */}
      <section className="glass relative isolate overflow-hidden rounded-[2.5rem] p-8 md:p-12">
        {/* Dynamic Theme-Aware Backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/10 via-transparent to-brand-blue/10 opacity-50" />
          <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-brand-emerald/10 blur-[120px] animate-pulse-slow" />
          <div className="absolute right-[-5%] bottom-[-5%] h-[30%] w-[30%] rounded-full bg-brand-blue/10 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="heartbeat h-1.5 w-1.5 rounded-full bg-brand-emerald" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-emerald/80">Built on GenLayer Protocol</span>
            </div>
            
            <h1 className="text-gradient max-w-[15ch] text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              Escrow for GitHub <br className="hidden md:block" /> PR Bounties.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-text-secondary md:text-xl">
              Launch self-settling bounties. Review against public PRs and deployment URLs. 
              Our Intelligent Contract handles the settlement with on-chain finality.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                label: "Evidence",
                value: "GitHub PR + Deployment",
                icon: ShieldCheck,
                color: "text-brand-emerald",
                bg: "bg-brand-emerald/5"
              },
              {
                label: "Settlement",
                value: "GEN Escrow Payout",
                icon: Gem,
                color: "text-brand-blue",
                bg: "bg-brand-blue/5"
              },
              {
                label: "State",
                value: "On-chain Immutable",
                icon: Database,
                color: "text-indigo-400",
                bg: "bg-indigo-400/5"
              },
            ].map((item) => (
              <div
                key={item.label}
                className="glass group flex flex-col justify-between rounded-3xl border-white/5 bg-surface-soft p-6 transition-all hover:-translate-y-2 hover:glow-emerald"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="meta-label">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-text-primary">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-8 pt-6 border-t border-white/5 md:flex-row">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/create"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-emerald px-8 py-4 text-sm font-bold text-slate-950 transition-all hover:glow-emerald hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 -translate-x-full group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">
                  Launch Bounty <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                href="/bounties"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-surface-soft px-8 py-4 text-sm font-bold text-text-primary transition-all hover:bg-white/10"
              >
                Explore Bounties
              </Link>
            </div>

            <div className="flex gap-4">
               {[1, 2, 3, 4].map((step) => (
                 <div key={step} className="flex flex-col items-center gap-1 opacity-40">
                   <div className="h-1 w-8 rounded-full bg-text-secondary" />
                   <span className="text-[10px] font-bold">0{step}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- SAMPLES SECTION --- */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <p className="meta-label text-brand-emerald">
              Curated Starter briefs
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">
              Reference Bounties
            </h2>
          </div>
          <Link href="/bounties" className="group flex items-center gap-2 text-sm font-bold text-brand-emerald">
            View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {demoTemplates.map((template) => (
            <div
              key={template.id}
              className="glass group relative overflow-hidden rounded-[2rem] p-8 transition-all hover:bg-white/[0.03]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p className="meta-label">
                Sample Campaign
              </p>
              <h3 className="mt-4 text-2xl font-bold text-text-primary group-hover:text-brand-emerald transition-colors">
                {template.title}
              </h3>
              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                {template.description}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-60">Payout</p>
                  <p className="mt-1 font-bold text-text-primary">{template.payoutAmountGen} GEN</p>
                </div>
                <div className="rounded-full bg-brand-emerald/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-emerald">
                  PR + Deploy
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
