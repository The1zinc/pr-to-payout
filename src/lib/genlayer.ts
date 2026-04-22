import { createClient } from "genlayer-js";
import {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

import { appConfig, type SupportedNetwork } from "@/lib/env";

const chainByNetwork = {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} satisfies Record<SupportedNetwork, typeof studionet>;

declare global {
interface Window {
    ethereum?: any;
  }
}

/**
 * Robust shim to handle MetaMask-only RPC methods on non-MetaMask wallets (like Rabby).
 * It intercepts 'wallet_getSnaps' which genlayer-js relies on to check for Snap presence.
 */
export function applyWalletShim() {
  if (typeof window === "undefined" || !window.ethereum) return;

  const provider = window.ethereum;

  // Intercept .request() - the modern standard
  if (provider.request && !provider.request._isShimmed) {
    const originalRequest = provider.request.bind(provider);
    provider.request = async (args: { method: string; params?: any }) => {
      if (args.method === "wallet_getSnaps" || args.method === "wallet_requestSnaps" || args.method.includes("Snap")) {
        return {};
      }
      return originalRequest(args);
    };
    provider.request._isShimmed = true;
  }

  // Intercept .send() / .sendAsync() - for legacy SDK compatibility
  const patchSend = (methodName: string) => {
    if (provider[methodName] && !provider[methodName]._isShimmed) {
      const originalSend = provider[methodName].bind(provider);
      provider[methodName] = (args: any, cb: any) => {
        if (typeof args === "object" && (args?.method === "wallet_getSnaps" || args?.method === "wallet_requestSnaps" || args?.method?.includes("Snap"))) {
          const response = { id: args.id, jsonrpc: "2.0", result: {} };
          if (cb) cb(null, response);
          return response;
        }
        return originalSend(args, cb);
      };
      provider[methodName]._isShimmed = true;
    }
  };

  patchSend("send");
  patchSend("sendAsync");
}

export function getConfiguredChain() {
  return chainByNetwork[appConfig.network];
}

function getRpcEndpoint() {
  return appConfig.rpcUrl || getConfiguredChain().rpcUrls.default.http[0];
}

let readClient: ReturnType<typeof createClient> | null = null;

export function getReadClient() {
  if (!readClient) {
    readClient = createClient({
      chain: getConfiguredChain(),
      endpoint: getRpcEndpoint(),
    });
  }

  return readClient;
}

export async function getWriteClient(account: `0x${string}`) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("An injected wallet is required to sign transactions on GenLayer.");
  }

  // Ensure shim is applied before client initialization
  applyWalletShim();

  const client = createClient({
    chain: getConfiguredChain(),
    endpoint: getRpcEndpoint(),
    account,
    provider: window.ethereum as never,
  });

  await client.connect(appConfig.network);

  return client;
}

export async function waitForFinalizedTransaction(
  client: Awaited<ReturnType<typeof getWriteClient>>,
  hash: `0x${string}`,
) {
  const receipt = await client.waitForTransactionReceipt({
    hash: hash as never,
    status: TransactionStatus.ACCEPTED,
    interval: 2_000,
    retries: 120,
  });

  if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error("The transaction finalized with a contract error.");
  }

  return receipt;
}
