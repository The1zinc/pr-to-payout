"use client";

import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { useState } from "react";

import { applyWalletShim } from "@/lib/genlayer";

type DeployStep = "idle" | "loading" | "wallet" | "deploying" | "waiting" | "done" | "error";

type ContractResponse = {
  code?: string;
  error?: string;
};

type EthereumProvider = {
  request<T>(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T>;
};

const BRADBURY_RPC =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://rpc-bradbury.genlayer.com";
const BRADBURY_EXPLORER = "https://explorer-bradbury.genlayer.com";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getReceiptContractAddress(receipt: unknown) {
  if (!isRecord(receipt)) return "";

  const decoded = receipt.txDataDecoded;
  if (isRecord(decoded) && typeof decoded.contractAddress === "string") {
    return decoded.contractAddress;
  }

  return typeof receipt.recipient === "string" ? receipt.recipient : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Deployment failed";
}

export default function DeployPage() {
  const [step, setStep] = useState<DeployStep>("idle");
  const [status, setStatus] = useState("Ready to deploy the lint-clean contract.");
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [codeSize, setCodeSize] = useState(0);

  const isDeploying = step === "loading" || step === "wallet" || step === "deploying" || step === "waiting";

  async function deploy() {
    try {
      setStep("loading");
      setStatus("Loading contracts/pr_to_payout.py from the local app...");
      setTxHash("");
      setContractAddress("");

      const contractResponse = await fetch("/api/contract", { cache: "no-store" });
      const payload = (await contractResponse.json()) as ContractResponse;

      if (!contractResponse.ok || !payload.code) {
        throw new Error(payload.error || "Could not load contract code.");
      }

      setCodeSize(payload.code.length);

      const provider = window.ethereum as EthereumProvider | undefined;
      if (!provider) {
        throw new Error("No injected wallet detected. Open this page with MetaMask or Rabby installed.");
      }

      setStep("wallet");
      setStatus("Requesting wallet account...");
      applyWalletShim();

      const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
      const selectedAccount = accounts[0];
      if (!selectedAccount) {
        throw new Error("No wallet account was returned.");
      }
      setAccount(selectedAccount);

      setStep("deploying");
      setStatus("Submitting deployment transaction to Bradbury. Approve it in your wallet...");

      const client = createClient({
        chain: testnetBradbury,
        endpoint: BRADBURY_RPC,
        provider: window.ethereum as never,
        account: selectedAccount as `0x${string}`,
      });

      await client.connect("testnetBradbury");

      const hash = await client.deployContract({ code: payload.code });
      setTxHash(hash);

      setStep("waiting");
      setStatus("Transaction submitted. Waiting for ACCEPTED finality...");

      const receipt = await client.waitForTransactionReceipt({
        hash: hash as never,
        status: TransactionStatus.ACCEPTED,
        interval: 5_000,
        retries: 120,
      });

      const newAddress = getReceiptContractAddress(receipt);
      if (!newAddress) {
        throw new Error("Deployment accepted, but the contract address was not found in the receipt.");
      }

      setContractAddress(newAddress);
      setStep("done");
      setStatus("Deployment accepted. Use this new address for resubmission.");
    } catch (error) {
      setStep("error");
      setStatus(getErrorMessage(error));
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-4xl flex-col justify-center px-5 py-16">
      <section className="glass glow-emerald rounded-[2rem] p-6 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="meta-label mb-3">Temporary Deploy Page</p>
            <h1 className="text-gradient text-4xl sm:text-5xl">Deploy PR-to-Payout</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
              This page deploys the current local `contracts/pr_to_payout.py` to GenLayer Bradbury.
              Use it after the GenVM lint fix, then update `NEXT_PUBLIC_CONTRACT_ADDRESS` with the new address.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text-secondary">
            <div className="font-mono text-text-primary">testnetBradbury</div>
            <div className="mt-1 break-all">{BRADBURY_RPC}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={deploy}
          disabled={isDeploying}
          className="w-full rounded-2xl bg-brand-emerald px-6 py-4 text-base font-black text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isDeploying ? "Deploying..." : "Deploy Lint-Clean Contract"}
        </button>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <InfoCard label="Status" value={status} highlight={step === "done" || step === "error"} />
          <InfoCard label="Wallet" value={account || "Not connected yet"} mono />
          <InfoCard label="Contract Code" value={codeSize ? `${codeSize.toLocaleString()} characters loaded` : "Not loaded yet"} />
          <InfoCard label="Transaction" value={txHash || "No transaction yet"} mono href={txHash ? `${BRADBURY_EXPLORER}/tx/${txHash}` : undefined} />
        </div>

        {contractAddress ? (
          <div className="mt-8 rounded-3xl border border-brand-emerald/30 bg-brand-emerald/10 p-5">
            <p className="meta-label mb-3">New Contract Address</p>
            <div className="break-all rounded-2xl bg-slate-950/70 p-4 font-mono text-sm text-white">
              {contractAddress}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`${BRADBURY_EXPLORER}/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-white/10"
              >
                Open in Explorer
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(contractAddress)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-white/10"
              >
                Copy Address
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  href,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  const content = (
    <div className={`break-words text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-brand-emerald" : "text-text-primary"}`}>
      {value}
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-text-secondary/70">
        {label}
      </p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
