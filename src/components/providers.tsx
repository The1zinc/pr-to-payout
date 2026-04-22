"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

import { appConfig } from "@/lib/env";
import { applyWalletShim, getConfiguredChain } from "@/lib/genlayer";

const chain = getConfiguredChain();

const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [injected()],
  ssr: true,
  transports: {
    [chain.id]: http(appConfig.rpcUrl || chain.rpcUrls.default.http[0]),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyWalletShim();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
