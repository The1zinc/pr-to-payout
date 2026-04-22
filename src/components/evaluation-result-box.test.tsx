import { render, screen } from "@testing-library/react";

import { EvaluationResultBox } from "@/components/evaluation-result-box";
import type { Submission } from "@/lib/types";

describe("EvaluationResultBox", () => {
  it("renders the verdict, reasoning, and checked URLs", () => {
    const submission: Submission = {
      id: "1",
      bountyId: "1",
      builder: "0x1234",
      prUrl: "https://github.com/acme/site/pull/42",
      deployUrl: "https://feature-site.vercel.app",
      note: "",
      status: "approved",
      verdict: "approved",
      reasoning: "The PR appears merged and the deployment includes the requested FAQ section.",
      evidenceSummary: "PR merged; deployment reachable; criteria satisfied.",
      checkedUrls: [
        "https://github.com/acme/site/pull/42",
        "https://feature-site.vercel.app",
      ],
      createdAt: "1710000000",
      evaluatedAt: "1710000300",
      appealUsed: false,
      source: "live",
    };

    render(<EvaluationResultBox submission={submission} />);

    expect(screen.getByText(/Audit Report/i)).toBeInTheDocument();
    expect(screen.getByText(/criteria satisfied/i)).toBeInTheDocument();
    expect(screen.getByText(/requested FAQ section/i)).toBeInTheDocument();
    expect(screen.getByText(/github.com/i)).toBeInTheDocument();
  });
});
