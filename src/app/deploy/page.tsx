"use client";

import { useState } from "react";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { applyWalletShim } from "@/lib/genlayer";

export default function DeployPage() {
  const [status, setStatus] = useState<string>("Ready to deploy");
  const [contractAddress, setContractAddress] = useState<string>("");

  const deploy = async () => {
    try {
      setStatus("Fetching contract code...");
      const res = await fetch("/api/contract");
      const { code } = await res.json();

      if (!code) throw new Error("Could not load contract code");

      setStatus("Connecting to wallet...");
      if (!window.ethereum) throw new Error("No wallet detected (MetaMask, Rabby, etc.)");

      // Apply wallet shim for non-MetaMask wallets (Rabby, etc.)
      applyWalletShim();

      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });

      setStatus("Deploying to Bradbury (Please approve in wallet)...");
      const client = createClient({
        chain: testnetBradbury,
        endpoint: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://rpc-bradbury.genlayer.com",
        provider: window.ethereum as never,
        account: account,
      });

      // Required for wallet-based transactions on GenLayer
      await client.connect("testnetBradbury");

      const hash = await client.deployContract({
        code: code,
      });

      setStatus(`Transaction sent! Waiting for acceptance... Hash: ${hash}`);
      
      const receipt = await client.waitForTransactionReceipt({
        hash: hash as never,
        status: TransactionStatus.ACCEPTED,
        interval: 5_000,
        retries: 60,
      });
      
      setStatus("Deployed successfully!");
      const decoded = receipt.txDataDecoded as any;
      if (decoded?.contractAddress) {
        setContractAddress(decoded.contractAddress);
      } else if (receipt.recipient) {
        setContractAddress(receipt.recipient);
      }
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message || "Deployment failed"}`);
    }
  };


  return (
    <div className="container mx-auto max-w-2xl p-8 pt-24 text-center">
      <h1 className="mb-6 text-3xl font-bold">One-Click GenLayer Deployer</h1>
      <p className="mb-8 text-slate-400">
        Deploy directly from your browser to bypass CLI errors. Make sure your MetaMask is set to the Bradbury Testnet.
      </p>

      <button
        onClick={deploy}
        className="mb-8 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500"
      >
        Deploy to Bradbury
      </button>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-left shadow-lg">
        <h2 className="mb-2 text-sm font-semibold text-slate-400">Status</h2>
        <p className="mb-4 text-emerald-400">{status}</p>

        <h2 className="mb-2 text-sm font-semibold text-slate-400">Check Explorer</h2>
        <p className="mb-4 text-sm text-slate-300">
          Open MetaMask, click the "Contract Deployment" transaction you just approved, and click "View on block explorer". Your contract address will be there!
        </p>

        {contractAddress && (
          <>
            <h2 className="mb-2 text-sm font-semibold text-slate-400">Contract Address found in Receipt</h2>
            <div className="rounded bg-slate-900 p-3 font-mono text-white break-all">
              {contractAddress}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              ✅ Copy this address and put it in your <code className="text-pink-400">.env</code> file under <code className="text-pink-400">NEXT_PUBLIC_CONTRACT_ADDRESS</code>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
