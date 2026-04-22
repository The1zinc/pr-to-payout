import { parseUnits } from "viem";

import type { Bounty, DemoTemplate, Submission } from "@/lib/types";

function now() {
  return Math.floor(Date.now() / 1000);
}

export const demoTemplates: DemoTemplate[] = [
  {
    id: "hero-cta",
    title: "Homepage hero and primary CTA",
    description:
      "Update the homepage hero copy and CTA layout, then ship the change to the public site.",
    repoUrl: "https://github.com/example/marketing-site",
    acceptanceCriteria:
      "The merged PR must add a hero headline, supporting copy, and a primary CTA above the fold on desktop and mobile. The deployment must show the updated section.",
    payoutAmountGen: "2.5",
    extraDomains: "",
  },
  {
    id: "mobile-navbar",
    title: "Fix mobile nav overlap",
    description:
      "Resolve the mobile nav overlap on narrow screens and deploy the patch.",
    repoUrl: "https://github.com/example/app-website",
    acceptanceCriteria:
      "The merged PR must resolve the mobile nav overlap. The deployment must show a usable nav on small screens with the primary action still accessible.",
    payoutAmountGen: "1.8",
    extraDomains: "preview.example.com",
  },
  {
    id: "faq-section",
    title: "Add FAQ section to docs site",
    description:
      "Add an FAQ block covering pricing, setup, and support, then deploy the update.",
    repoUrl: "https://github.com/example/docs-site",
    acceptanceCriteria:
      "The merged PR must add at least three FAQ items covering pricing, setup, and support. The deployment must show the FAQ on the target page and remain readable on mobile.",
    payoutAmountGen: "1.2",
    extraDomains: "",
  },
];

function buildDemoBounties(): Bounty[] {
  const ts = now();
  return [
    {
      id: "demo-hero",
      sponsor: "0xB0A1D1AA08eE8b760A773b1aA1A0c0FFEE000001",
      title: demoTemplates[0].title,
      description: demoTemplates[0].description,
      repoUrl: demoTemplates[0].repoUrl,
      acceptanceCriteria: demoTemplates[0].acceptanceCriteria,
      payoutAmount: parseUnits("2.5", 18).toString(),
      deadlineTimestamp: `${ts + 7 * 24 * 60 * 60}`,
      allowedDomains: ["vercel.app"],
      status: "funded",
      chosenSubmissionId: null,
      latestSubmissionId: null,
      createdAt: `${ts - 2 * 24 * 60 * 60}`,
      source: "demo",
    },
    {
      id: "demo-navbar",
      sponsor: "0xB0A1D1AA08eE8b760A773b1aA1A0c0FFEE000002",
      title: demoTemplates[1].title,
      description: demoTemplates[1].description,
      repoUrl: demoTemplates[1].repoUrl,
      acceptanceCriteria: demoTemplates[1].acceptanceCriteria,
      payoutAmount: parseUnits("1.8", 18).toString(),
      deadlineTimestamp: `${ts + 3 * 24 * 60 * 60}`,
      allowedDomains: ["vercel.app", "preview.example.com"],
      status: "rejected",
      chosenSubmissionId: null,
      latestSubmissionId: "demo-submission-navbar",
      createdAt: `${ts - 5 * 24 * 60 * 60}`,
      source: "demo",
    },
    {
      id: "demo-faq",
      sponsor: "0xB0A1D1AA08eE8b760A773b1aA1A0c0FFEE000003",
      title: demoTemplates[2].title,
      description: demoTemplates[2].description,
      repoUrl: demoTemplates[2].repoUrl,
      acceptanceCriteria: demoTemplates[2].acceptanceCriteria,
      payoutAmount: parseUnits("1.2", 18).toString(),
      deadlineTimestamp: `${ts - 24 * 60 * 60}`,
      allowedDomains: ["vercel.app"],
      status: "approved",
      chosenSubmissionId: "demo-submission-faq",
      latestSubmissionId: "demo-submission-faq",
      createdAt: `${ts - 8 * 24 * 60 * 60}`,
      source: "demo",
    },
  ];
}

function buildDemoSubmissions(): Submission[] {
  const ts = now();
  return [
    {
      id: "demo-submission-navbar",
      bountyId: "demo-navbar",
      builder: "0xBu1LD3rAA08eE8b760A773b1aA1A0c0FFEE000002",
      prUrl: "https://github.com/example/app-website/pull/18",
      deployUrl: "https://mobile-nav-fix.vercel.app",
      note: "Fixed the collapsing drawer and adjusted the CTA spacing.",
      status: "rejected",
      verdict: "rejected",
      reasoning:
        "The deployment is live, but the evidence does not confirm the overlap is resolved across the required mobile states.",
      evidenceSummary:
        "Deployment reachable; PR closed; review inconclusive.",
      checkedUrls: [
        "https://github.com/example/app-website/pull/18",
        "https://mobile-nav-fix.vercel.app",
      ],
      createdAt: `${ts - 2 * 24 * 60 * 60}`,
      evaluatedAt: `${ts - 2 * 24 * 60 * 60 + 1800}`,
      appealUsed: false,
      source: "demo",
    },
    {
      id: "demo-submission-faq",
      bountyId: "demo-faq",
      builder: "0xBu1LD3rAA08eE8b760A773b1aA1A0c0FFEE000003",
      prUrl: "https://github.com/example/docs-site/pull/42",
      deployUrl: "https://docs-site-faq.vercel.app",
      note: "Added a three-item FAQ and adjusted mobile spacing.",
      status: "approved",
      verdict: "approved",
      reasoning:
        "The PR appears merged, the deployment is live, and the FAQ content matches the requested scope.",
      evidenceSummary:
        "PR merged; deployment reachable; FAQ present.",
      checkedUrls: [
        "https://github.com/example/docs-site/pull/42",
        "https://docs-site-faq.vercel.app",
      ],
      createdAt: `${ts - 6 * 24 * 60 * 60}`,
      evaluatedAt: `${ts - 6 * 24 * 60 * 60 + 1200}`,
      appealUsed: false,
      source: "demo",
    },
  ];
}

let _cachedBounties: Bounty[] | null = null;
let _cachedSubmissions: Submission[] | null = null;
let _cacheTimestamp = 0;

const CACHE_TTL_MS = 60_000; // refresh demo data every 60s

function refreshCacheIfNeeded() {
  if (_cachedBounties && Date.now() - _cacheTimestamp < CACHE_TTL_MS) {
    return;
  }
  _cachedBounties = buildDemoBounties();
  _cachedSubmissions = buildDemoSubmissions();
  _cacheTimestamp = Date.now();
}

export function getDemoBounties(): Bounty[] {
  refreshCacheIfNeeded();
  return _cachedBounties!;
}

export function getDemoSubmissions(): Submission[] {
  refreshCacheIfNeeded();
  return _cachedSubmissions!;
}

export function getDemoBountyById(id: string) {
  return getDemoBounties().find((bounty) => bounty.id === id) ?? null;
}

export function getDemoSubmissionByBountyId(bountyId: string) {
  return getDemoSubmissions().find((submission) => submission.bountyId === bountyId) ?? null;
}

// Add a new demo bounty at runtime (for demo-mode flows)
// Reverted: demo store mutations removed to revert to original demo behavior
