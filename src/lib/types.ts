export type BountyStatus =
  | "open"
  | "funded"
  | "submitted"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type EvaluationVerdict =
  | "approved"
  | "rejected"
  | "needs_manual_review";

export type DataSource = "live" | "demo";

export interface Bounty {
  id: string;
  sponsor: string;
  title: string;
  description: string;
  repoUrl: string;
  acceptanceCriteria: string;
  payoutAmount: string;
  deadlineTimestamp: string | null;
  allowedDomains: string[];
  status: BountyStatus;
  chosenSubmissionId: string | null;
  latestSubmissionId: string | null;
  createdAt: string;
  source: DataSource;
}

export interface Submission {
  id: string;
  bountyId: string;
  builder: string;
  prUrl: string;
  deployUrl: string;
  note: string;
  status: SubmissionStatus;
  verdict: EvaluationVerdict;
  reasoning: string;
  evidenceSummary: string;
  checkedUrls: string[];
  createdAt: string;
  evaluatedAt: string | null;
  appealUsed: boolean;
  source: DataSource;
}

export interface DemoTemplate {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  acceptanceCriteria: string;
  payoutAmountGen: string;
  extraDomains: string;
}

export interface CreateBountyFormValues {
  title: string;
  description: string;
  repoUrl: string;
  acceptanceCriteria: string;
  payoutAmountGen: string;
  deadlineLocal: string;
  extraDomains: string;
}

export interface CreateBountyPayload {
  title: string;
  description: string;
  repoUrl: string;
  acceptanceCriteria: string;
  payoutAmountWei: bigint;
  deadlineTimestamp: bigint;
  allowedDomains: string[];
}

export interface SubmissionFormValues {
  prUrl: string;
  deployUrl: string;
  note: string;
}

export interface SubmissionPayload {
  prUrl: string;
  deployUrl: string;
  note: string;
}

export interface WriteResult {
  hash: `0x${string}`;
}
