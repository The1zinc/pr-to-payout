# PR-to-Payout

Bounty escrow for GitHub pull requests, powered by GenLayer's Intelligent Contracts.

A sponsor posts a bounty with acceptance criteria in plain English. A builder submits their GitHub PR and deployment URL. GenLayer validators fetch the PR page, check the deployment, and use AI consensus to decide if the work meets the criteria. If approved, the escrowed GEN tokens are released to the builder automatically. No middleman, no manual review.

## How It Works

```
Sponsor creates bounty → Funds it with GEN → Builder submits PR + deploy URL
                                                        ↓
                              GenLayer validators fetch evidence from GitHub & deployment
                                                        ↓
                                AI consensus: approved / rejected / needs review
                                                        ↓
                              Approved → GEN auto-released to builder's wallet
```

1. **Create** — Sponsor defines a task with title, description, repo URL, acceptance criteria, payout amount, and deadline
2. **Fund** — Sponsor sends GEN tokens to the contract as escrow
3. **Submit** — Builder links their GitHub PR and live deployment URL
4. **Evaluate** — GenLayer validators independently fetch the PR and deployment pages, then an LLM evaluates whether the acceptance criteria are met. Validators reach consensus using Optimistic Democracy
5. **Payout** — If approved, escrowed GEN is sent to the builder. If rejected, the builder can appeal for a re-evaluation

## Architecture

**On-chain (GenLayer Bradbury Testnet)**
- `contracts/pr_to_payout.py` — Intelligent Contract handling bounty state, GEN escrow, AI evaluation via `run_nondet_unsafe`, and automated payouts through ghost contracts
- Storage: JSON blobs in `TreeMap[str, str]` with string ID keys for reliable serialization on GenVM

**Frontend (Next.js 16)**
- React app with wallet connection (MetaMask, Rabby, etc.)
- Reads contract state via `genlayer-js` SDK
- Writes transactions signed by the user's wallet
- Falls back to demo mode when no contract is deployed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contract | Python on GenVM (GenLayer Bradbury testnet) |
| Frontend | Next.js 16, TypeScript, React 19 |
| Wallet | wagmi, viem, genlayer-js |
| Styling | Tailwind CSS 4 |
| Testing | Vitest |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create a `.env` file:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xc60d1C1993EE49510b3202ac02FA2Da57C341E6D
NEXT_PUBLIC_GENLAYER_NETWORK=testnetBradbury
NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
```

Without `NEXT_PUBLIC_CONTRACT_ADDRESS`, the app runs in demo mode with sample bounties.

## Deploying the Contract

**Option A — From the browser**

1. Connect your wallet to Bradbury testnet (Chain ID 4221)
2. Go to `/deploy` in the app
3. Click "Deploy to Bradbury" and approve in your wallet
4. Copy the contract address into `.env`

**Option B — From CLI**

```bash
npx tsx scripts/deploy-main.ts
```

This deploys, waits for acceptance, updates `.env`, and verifies the contract is live.

## Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `create_bounty` | write | Create a new bounty with acceptance criteria |
| `fund_bounty` | payable | Send GEN to escrow |
| `submit_proof` | write | Submit PR + deploy URL, triggers AI evaluation |
| `cancel_bounty` | write | Sponsor cancels (refunds if funded) |
| `refund_bounty` | write | Sponsor reclaims escrowed GEN |
| `appeal_submission` | write | Builder requests re-evaluation |
| `list_bounties_json` | view | List all bounties |
| `get_bounty_json` | view | Get single bounty by ID |
| `get_submission_for_bounty_json` | view | Get submission for a bounty |

## Project Structure

```
pr-to-payout/
├── contracts/
│   └── pr_to_payout.py        # GenLayer Intelligent Contract
├── scripts/
│   ├── deploy-main.ts          # CLI deployment script
│   └── health-check.ts         # Contract liveness + create bounty test
├── src/
│   ├── app/                    # Next.js pages (home, create, bounties, deploy)
│   ├── components/             # React components
│   └── lib/
│       ├── contract.ts         # Contract read/write adapter
│       ├── genlayer.ts         # GenLayer client setup + wallet shim
│       ├── validation.ts       # Zod schema validation
│       └── types.ts            # TypeScript types
└── package.json
```

## Network Details

| Setting | Value |
|---------|-------|
| Network | GenLayer Bradbury Testnet |
| Chain ID | 4221 |
| RPC | https://rpc-bradbury.genlayer.com |
| Explorer | https://explorer-bradbury.genlayer.com |
| Faucet | https://testnet-faucet.genlayer.foundation |
| Deployed Contract | `0xc60d1C1993EE49510b3202ac02FA2Da57C341E6D` |

## License

MIT
