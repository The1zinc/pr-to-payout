import { describe, expect, it } from "vitest";

import {
  buildCreateBountyPayload,
  buildSubmissionPayload,
  getGithubRepoSlug,
  normalizeDomain,
  parseAllowedDomains,
} from "@/lib/validation";

describe("validation helpers", () => {
  it("normalizes domains and keeps the default whitelist", () => {
    expect(normalizeDomain("https://www.github.com/acme/repo")).toBe("github.com");
    expect(parseAllowedDomains("github.com, preview.example.com, https://demo.acme.dev")).toEqual([
      "vercel.app",
      "preview.example.com",
      "demo.acme.dev",
    ]);
  });

  it("builds a create bounty payload in wei", () => {
    const payload = buildCreateBountyPayload({
      title: "Add hero",
      description: "Add a new homepage hero and make the CTA clearer.",
      repoUrl: "https://github.com/acme/site",
      acceptanceCriteria:
        "The homepage must include a hero headline, body copy, and a clear CTA on desktop and mobile.",
      payoutAmountGen: "1.25",
      deadlineLocal: "",
      extraDomains: "preview.example.com",
    });

    expect(payload.payoutAmountWei).toBe(1250000000000000000n);
    expect(payload.allowedDomains).toContain("preview.example.com");
  });

  it("extracts the same GitHub repo slug from repo and PR URLs", () => {
    expect(getGithubRepoSlug("https://github.com/Acme/site")).toBe("acme/site");
    expect(getGithubRepoSlug("https://github.com/acme/site/pull/42")).toBe(
      "acme/site",
    );
  });

  it("rejects repository URLs that are not repository roots", () => {
    expect(() =>
      buildCreateBountyPayload({
        title: "Add hero",
        description: "Add a new homepage hero and make the CTA clearer.",
        repoUrl: "https://github.com/acme/site/pull/42",
        acceptanceCriteria:
          "The homepage must include a hero headline, body copy, and a clear CTA on desktop and mobile.",
        payoutAmountGen: "1.25",
        deadlineLocal: "",
        extraDomains: "preview.example.com",
      }),
    ).toThrow(/repository/i);
  });

  it("rejects PRs that do not belong to the bounty repository", () => {
    expect(() =>
      buildSubmissionPayload(
        {
          prUrl: "https://github.com/other/repo/pull/10",
          deployUrl: "https://feature-site.vercel.app",
          note: "",
        },
        ["vercel.app"],
        "https://github.com/acme/site",
      ),
    ).toThrow(/bounty repository/i);
  });

  it("rejects GitHub URLs as deployment evidence even if they appear in the allowlist", () => {
    expect(() =>
      buildSubmissionPayload(
        {
          prUrl: "https://github.com/acme/site/pull/10",
          deployUrl: "https://github.com/acme/site/pull/10",
          note: "",
        },
        ["github.com", "vercel.app"],
        "https://github.com/acme/site",
      ),
    ).toThrow(/must match one of/i);
  });

  it("rejects submission URLs outside the allowed domains", () => {
    expect(() =>
      buildSubmissionPayload(
        {
          prUrl: "https://github.com/acme/site/pull/10",
          deployUrl: "https://not-allowed.example.org",
          note: "",
        },
        ["vercel.app"],
        "https://github.com/acme/site",
      ),
    ).toThrow(/must match one of/i);
  });
});
