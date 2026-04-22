import type { Address } from "viem";

import { appConfig } from "@/lib/env";
import { getReadClient, getWriteClient, waitForFinalizedTransaction } from "@/lib/genlayer";
import type { Bounty, CreateBountyPayload, Submission, SubmissionPayload, WriteResult } from "@/lib/types";

type ContractArg =
  | null
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | ContractArg[]
  | { [key: string]: ContractArg };

function requireContractAddress() {
  if (!appConfig.contractAddress) {
    throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS to enable live on-chain actions.");
  }

  return appConfig.contractAddress;
}

function parseJson<T>(value: unknown, caller: string): T {
  console.log(`[Contract:${caller}] raw:`, value);
  if (typeof value !== "string") {
    throw new Error(`Unexpected contract response from ${caller}.`);
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Malformed JSON from ${caller}.`);
  }
}

function mapBounty(input: {
  id: string;
  sponsor: string;
  title: string;
  description: string;
  repo_url: string;
  acceptance_criteria: string;
  payout_amount: string;
  deadline_timestamp: string;
  allowed_domains: string[];
  status: Bounty["status"];
  chosen_submission_id: string;
  latest_submission_id: string;
  created_at: string;
}): Bounty {
  return {
    id: input.id,
    sponsor: input.sponsor,
    title: input.title,
    description: input.description,
    repoUrl: input.repo_url,
    acceptanceCriteria: input.acceptance_criteria,
    payoutAmount: input.payout_amount,
    deadlineTimestamp: input.deadline_timestamp === "0" ? null : input.deadline_timestamp,
    allowedDomains: input.allowed_domains,
    status: input.status,
    chosenSubmissionId:
      input.chosen_submission_id === "0" ? null : input.chosen_submission_id,
    latestSubmissionId:
      input.latest_submission_id === "0" ? null : input.latest_submission_id,
    createdAt: input.created_at,
    source: "live",
  };
}

function mapSubmission(input: {
  id: string;
  bounty_id: string;
  builder: string;
  pr_url: string;
  deploy_url: string;
  note: string;
  status: Submission["status"];
  verdict: Submission["verdict"];
  reasoning: string;
  evidence_summary: string;
  checked_urls: string[];
  created_at: string;
  evaluated_at: string;
  appeal_used: boolean;
}): Submission {
  return {
    id: input.id,
    bountyId: input.bounty_id,
    builder: input.builder,
    prUrl: input.pr_url,
    deployUrl: input.deploy_url,
    note: input.note,
    status: input.status,
    verdict: input.verdict,
    reasoning: input.reasoning,
    evidenceSummary: input.evidence_summary,
    checkedUrls: input.checked_urls,
    createdAt: input.created_at,
    evaluatedAt: input.evaluated_at === "0" ? null : input.evaluated_at,
    appealUsed: input.appeal_used,
    source: "live",
  };
}

async function readJson(functionName: string, args: ContractArg[] = []) {
  const client = getReadClient();

  return client.readContract({
    address: requireContractAddress(),
    functionName,
    args,
  });
}

async function write(
  account: Address,
  functionName: string,
  args: ContractArg[] = [],
  value = 0n,
): Promise<WriteResult> {
  const client = await getWriteClient(account);
  const hash = await client.writeContract({
    address: requireContractAddress(),
    functionName,
    args,
    value,
  });

  await waitForFinalizedTransaction(client, hash);

  return { hash };
}

export async function getLiveBounties() {
  const raw = await readJson("list_bounties_json");
  const items = parseJson<
    Array<{
      id: string;
      sponsor: string;
      title: string;
      description: string;
      repo_url: string;
      acceptance_criteria: string;
      payout_amount: string;
      deadline_timestamp: string;
      allowed_domains: string[];
      status: Bounty["status"];
      chosen_submission_id: string;
      latest_submission_id: string;
      created_at: string;
    }>
  >(raw, "list_bounties_json");

  return items
    .map(mapBounty)
    .sort((left, right) => Number(right.createdAt) - Number(left.createdAt));
}

export async function getLiveBountyById(id: string) {
  const raw = await readJson("get_bounty_json", [BigInt(id)]);
  const parsed = parseJson<
    | {
        id: string;
        sponsor: string;
        title: string;
        description: string;
        repo_url: string;
        acceptance_criteria: string;
        payout_amount: string;
        deadline_timestamp: string;
        allowed_domains: string[];
        status: Bounty["status"];
        chosen_submission_id: string;
        latest_submission_id: string;
        created_at: string;
      }
    | null
  >(raw, "get_bounty_json");

  return parsed ? mapBounty(parsed) : null;
}

export async function getLiveSubmissionByBountyId(id: string) {
  const raw = await readJson("get_submission_for_bounty_json", [BigInt(id)]);
  const parsed = parseJson<
    | {
        id: string;
        bounty_id: string;
        builder: string;
        pr_url: string;
        deploy_url: string;
        note: string;
        status: Submission["status"];
        verdict: Submission["verdict"];
        reasoning: string;
        evidence_summary: string;
        checked_urls: string[];
        created_at: string;
        evaluated_at: string;
        appeal_used: boolean;
      }
    | null
  >(raw, "get_submission_for_bounty_json");

  return parsed ? mapSubmission(parsed) : null;
}

export function createBounty(account: Address, payload: CreateBountyPayload) {
  return write(account, "create_bounty", [
    payload.title,
    payload.description,
    payload.repoUrl,
    payload.acceptanceCriteria,
    payload.payoutAmountWei,
    payload.deadlineTimestamp,
    payload.allowedDomains.join(","),
    BigInt(Math.floor(Date.now() / 1000)),
  ]);
}

export function fundBounty(account: Address, bountyId: string, payoutAmount: string) {
  return write(account, "fund_bounty", [BigInt(bountyId)], BigInt(payoutAmount));
}

export function submitProof(
  account: Address,
  bountyId: string,
  payload: SubmissionPayload,
) {
  return write(account, "submit_proof", [
    BigInt(bountyId),
    payload.prUrl,
    payload.deployUrl,
    payload.note,
    BigInt(Math.floor(Date.now() / 1000)),
  ]);
}

export function cancelBounty(account: Address, bountyId: string) {
  return write(account, "cancel_bounty", [BigInt(bountyId)]);
}

export function refundBounty(account: Address, bountyId: string) {
  return write(account, "refund_bounty", [BigInt(bountyId)]);
}

export function appealSubmission(account: Address, bountyId: string) {
  return write(account, "appeal_submission", [BigInt(bountyId)]);
}
