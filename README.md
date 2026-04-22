# PR-to-Payout

PR-to-Payout is an independent dApp for code-task bounty escrow, built on the GenLayer blockchain. It is not an official GenLayer product.

Sponsors define acceptance criteria in plain English, builders submit a GitHub PR and Vercel deployment, and the deployed contract reads public web evidence to decide whether work is complete and release payment automatically.

## Overview

- **Frontend**: Next.js 16 App Router with TypeScript
- **Blockchain**: GenLayer intelligent contract for escrow, review, and appeals
- **No backend**: No database, no traditional backend, no auth beyond wallet connection
- **Demo mode**: Works with seeded examples when no contract is deployed

## Stack

- Next.js 16 (App Router)
- TypeScript
- wagmi + viem (wallet integration)
- genlayer-js (contract interaction)
- Python intelligent contract on GenLayer
- Vitest (testing)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address on GenLayer |
| `NEXT_PUBLIC_GENLAYER_NETWORK` | Network: `localnet`, `studionet`, `testnetBradbury` |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | Optional custom RPC endpoint |

Without `NEXT_PUBLIC_CONTRACT_ADDRESS`, the app runs in demo mode with seeded bounties.

## Deployment

### Deploy Contract

1. Open [GenLayer Studio](https://studio.genlayer.com)
2. Load `contracts/pr_to_payout.py`
3. Deploy with no constructor arguments
4. Copy the deployed address to `.env.local`

### Deploy Frontend

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=<address>
   NEXT_PUBLIC_GENLAYER_NETWORK=testnetBradbury
   NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
   ```
4. Deploy

## Project Structure

```
pr-to-payout/
├── src/
│   ├── app/                  # Next.js pages
│   │   ├── page.tsx          # Landing
│   │   ├── bounties/         # Bounty listing & detail
│   │   └── create/           # Create bounty
│   ├── components/            # React components
│   └── lib/                  # Utilities
│       ├── contract.ts        # GenLayer contract adapter
│       └── demo.ts           # Demo data
├── contracts/
│   └── pr_to_payout.py       # Intelligent contract
└── package.json
```

## Testing

```bash
npm test
```

## License

MIT