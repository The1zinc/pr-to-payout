import { parseUnits } from "viem";
import { z } from "zod";

import type {
  CreateBountyFormValues,
  CreateBountyPayload,
  SubmissionFormValues,
  SubmissionPayload,
} from "@/lib/types";

export const DEFAULT_ALLOWED_DEPLOY_DOMAINS = ["vercel.app"];

const RESERVED_DEPLOY_DOMAINS = ["github.com"];

function isHttpUrl(url: URL) {
  return url.protocol === "http:" || url.protocol === "https:";
}

function isReservedDeployDomain(domain: string) {
  return RESERVED_DEPLOY_DOMAINS.includes(domain);
}

function safeUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

export function normalizeDomain(input: string) {
  const candidate = input.includes("://") ? input : `https://${input}`;
  const parsed = safeUrl(candidate);

  if (!parsed) {
    return null;
  }

  return parsed.hostname.toLowerCase().replace(/^www\./, "");
}

export function parseAllowedDomains(raw: string) {
  const normalized = raw
    .split(",")
    .map((entry) => normalizeDomain(entry.trim()))
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry) => !isReservedDeployDomain(entry));

  return Array.from(new Set([...DEFAULT_ALLOWED_DEPLOY_DOMAINS, ...normalized]));
}

export function getDeployAllowedDomains(allowedDomains: string[]) {
  return allowedDomains.filter((domain) => !isReservedDeployDomain(domain));
}

export function isDomainAllowed(url: string, allowedDomains: string[]) {
  const parsed = safeUrl(url);

  if (!parsed || !isHttpUrl(parsed)) {
    return false;
  }

  const hostname = normalizeDomain(url);

  if (!hostname || isReservedDeployDomain(hostname)) {
    return false;
  }

  return allowedDomains.some(
    (allowedDomain) =>
      hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`),
  );
}

export function isGithubRepoUrl(value: string) {
  const parsed = safeUrl(value);

  if (!parsed || !isHttpUrl(parsed)) {
    return false;
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const repoName = parts[1]?.replace(/\.git$/i, "");

  return (
    normalizeDomain(value) === "github.com" &&
    parts.length === 2 &&
    Boolean(repoName)
  );
}

export function isGithubPrUrl(value: string) {
  const parsed = safeUrl(value);

  if (!parsed || !isHttpUrl(parsed)) {
    return false;
  }

  return (
    normalizeDomain(value) === "github.com" &&
    /^\/[^/]+\/[^/]+\/pull\/\d+/.test(parsed.pathname)
  );
}

export function getGithubRepoSlug(value: string) {
  const parsed = safeUrl(value);

  if (!parsed || normalizeDomain(value) !== "github.com") {
    return null;
  }

  const parts = parsed.pathname.split("/").filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return `${parts[0].toLowerCase()}/${parts[1].replace(/\.git$/i, "").toLowerCase()}`;
}

const payoutPattern = /^\d+(\.\d{1,18})?$/;

export const createBountySchema = z
  .object({
    title: z.string().trim().min(4, "Title must be at least 4 characters."),
    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters."),
    repoUrl: z.string().url("Enter a valid repository URL."),
    acceptanceCriteria: z
      .string()
      .trim()
      .min(20, "Acceptance criteria must be at least 20 characters."),
    payoutAmountGen: z
      .string()
      .trim()
      .regex(payoutPattern, "Enter a valid GEN amount."),
    deadlineLocal: z.string().trim(),
    extraDomains: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (!isGithubRepoUrl(values.repoUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repoUrl"],
        message: "Repo URL must point to a public GitHub repository.",
      });
    }

    if (Number.parseFloat(values.payoutAmountGen) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payoutAmountGen"],
        message: "Payout must be greater than zero.",
      });
    }

    if (values.deadlineLocal) {
      const deadline = new Date(values.deadlineLocal);

      if (Number.isNaN(deadline.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deadlineLocal"],
          message: "Deadline must be a valid date.",
        });
      } else if (deadline.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deadlineLocal"],
          message: "Deadline must be in the future.",
        });
      }
    }
  });

export function buildCreateBountyPayload(
  values: CreateBountyFormValues,
): CreateBountyPayload {
  const parsed = createBountySchema.parse(values);

  return {
    title: parsed.title,
    description: parsed.description,
    repoUrl: parsed.repoUrl,
    acceptanceCriteria: parsed.acceptanceCriteria,
    payoutAmountWei: parseUnits(parsed.payoutAmountGen, 18),
    deadlineTimestamp: parsed.deadlineLocal
      ? BigInt(Math.floor(new Date(parsed.deadlineLocal).getTime() / 1000))
      : 0n,
    allowedDomains: parseAllowedDomains(parsed.extraDomains),
  };
}

export function createSubmissionSchema(
  allowedDomains: string[],
  repoUrl?: string,
) {
  const deployAllowedDomains = getDeployAllowedDomains(allowedDomains);

  return z
    .object({
      prUrl: z.string().url("Enter a valid PR URL."),
      deployUrl: z.string().url("Enter a valid deployment URL."),
      note: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      if (!isGithubPrUrl(values.prUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prUrl"],
          message: "PR URL must be a public GitHub pull request.",
        });
      }

      const expectedRepoSlug = repoUrl ? getGithubRepoSlug(repoUrl) : null;
      const prRepoSlug = getGithubRepoSlug(values.prUrl);

      if (expectedRepoSlug && prRepoSlug && expectedRepoSlug !== prRepoSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prUrl"],
          message: "PR must belong to the bounty repository.",
        });
      }

      if (!isDomainAllowed(values.deployUrl, deployAllowedDomains)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deployUrl"],
          message: deployAllowedDomains.length
            ? `Deploy URL must match one of: ${deployAllowedDomains.join(", ")}.`
            : "Deploy URL must match an allowed deployment domain.",
        });
      }
    });
}

export function buildSubmissionPayload(
  values: SubmissionFormValues,
  allowedDomains: string[],
  repoUrl?: string,
): SubmissionPayload {
  const parsed = createSubmissionSchema(allowedDomains, repoUrl).parse(values);

  return {
    prUrl: parsed.prUrl,
    deployUrl: parsed.deployUrl,
    note: parsed.note,
  };
}

export function flattenZodErrors(error: z.ZodError) {
  const output: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");

    if (!output[key]) {
      output[key] = issue.message;
    }
  }

  return output;
}
