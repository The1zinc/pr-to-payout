const supportedNetworks = [
  "localnet",
  "studionet",
  "testnetAsimov",
  "testnetBradbury",
] as const;

export type SupportedNetwork = (typeof supportedNetworks)[number];

function pickNetwork(value: string | undefined): SupportedNetwork {
  if (!value) {
    return "studionet";
  }

  if (supportedNetworks.includes(value as SupportedNetwork)) {
    return value as SupportedNetwork;
  }

  return "studionet";
}

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const network = pickNetwork(process.env.NEXT_PUBLIC_GENLAYER_NETWORK);

export const appConfig = {
  network,
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || undefined,
  contractAddress:
    contractAddress && contractAddress.startsWith("0x")
      ? (contractAddress as `0x${string}`)
      : undefined,
  isLive: Boolean(contractAddress && contractAddress.startsWith("0x")),
};
 
