import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { TransactionStatus, ExecutionResult } from 'genlayer-js/types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    // 1. Setup Environment
    if (!process.env.TEST_PRIVATE_KEY) {
        try {
            const envPath = path.resolve(__dirname, '../.env');
            const lines = fs.readFileSync(envPath, 'utf8').split('\n');
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        } catch (e) {}
    }

    const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
    const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://rpc-bradbury.genlayer.com';
    const contractPath = path.resolve(__dirname, '../contracts/pr_to_payout.py');
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    const stateFile = path.resolve(__dirname, '../.test-state.json');

    if (!privateKey) {
        console.error('❌ TEST_PRIVATE_KEY not found in environment variables.');
        process.exit(1);
    }

    let state = { contractAddress: '', bountyId: 0, lastTxHash: '' };
    if (fs.existsSync(stateFile)) {
        state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }

    const account = createAccount(privateKey);
    const client = createClient({
        chain: testnetBradbury,
        account: account,
        endpoint: rpcUrl,
    });

    console.log(`🚀 GenLayer Recovery Loop [Account: ${account.address}]`);

    // Helper: Wait for receipt with timeout handling
    const waitForReceiptSafe = async (hash: string) => {
        console.log(`⏳ Waiting for Tx: ${hash}`);
        try {
            const receipt = await client.waitForTransactionReceipt({
                hash: hash as any,
                status: TransactionStatus.ACCEPTED,
                interval: 20000,
                retries: 60, // 20 minutes
            });
            return receipt;
        } catch (e: any) {
            console.log(`⚠️  Wait timed out for ${hash}. Checking manual status...`);
            try {
                const manual = await client.getTransactionReceipt({ hash: hash as any });
                console.log(`ℹ️  Current Tx Status: ${manual.status} (Code: ${(manual as any).statusCode})`);
                if ((manual as any).statusCode === 11) { // READY_TO_FINALIZE
                     console.log('⚡ Transaction is READY_TO_FINALIZE. Poking network...');
                     // Try to finalize if method exists
                     if ((client as any).finalizeTransaction) {
                         await (client as any).finalizeTransaction({ hash });
                     }
                }
                return manual;
            } catch (err) {
                console.log('❌ Transaction still NOT_FOUND on RPC.');
                return null;
            }
        }
    };

    // 2. Deployment
    if (!state.contractAddress) {
        console.log('📦 Deploying Contract...');
        const deployHash = await client.deployContract({ code: contractCode });
        state.lastTxHash = deployHash;
        fs.writeFileSync(stateFile, JSON.stringify(state));
        
        const receipt = await waitForReceiptSafe(deployHash);
        if (receipt && receipt.status === 'ACCEPTED') {
            state.contractAddress = (receipt.txDataDecoded as any)?.contractAddress || receipt.recipient;
            fs.writeFileSync(stateFile, JSON.stringify(state));
            console.log(`🎉 Contract Deployed at: ${state.contractAddress}`);
        } else {
            console.error('❌ Deployment failed or timed out. Please check explorer.');
            return;
        }
    } else {
        console.log(`♻️  Reusing Contract: ${state.contractAddress}`);
    }

    // 3. Verification of Address
    try {
        console.log('🔍 Checking contract visibility...');
        const nextId = await client.readContract({
            address: state.contractAddress as any,
            functionName: 'get_next_bounty_id',
            args: []
        });
        console.log(`✅ Contract is LIVE. Next Bounty ID: ${nextId}`);
    } catch (e: any) {
        console.error('⚠️  Contract not yet visible on RPC. Re-deploying might be necessary if this persists.');
        // If it persists, we might want to clear the state and retry
        // fs.unlinkSync(stateFile); 
        return;
    }

    // 4. Create Bounty
    if (state.bountyId === 0) {
        console.log('💎 Creating Bounty...');
        const createHash = await client.writeContract({
            address: state.contractAddress as any,
            functionName: 'create_bounty',
            args: ["Test Bounty", "Desc", "https://github.com/test", "Criteria", 10000000000000000n, BigInt(Math.floor(Date.now()/1000)+3600), "vercel.app", BigInt(Math.floor(Date.now()/1000))],
            value: 0n,
        });
        state.lastTxHash = createHash;
        fs.writeFileSync(stateFile, JSON.stringify(state));
        
        const receipt = await waitForReceiptSafe(createHash);
        if (receipt) {
             const nextIdStr = await client.readContract({
                address: state.contractAddress as any,
                functionName: 'get_next_bounty_id',
                args: []
            });
            state.bountyId = Number(nextIdStr) - 1;
            fs.writeFileSync(stateFile, JSON.stringify(state));
            console.log(`✅ Bounty Created with ID: ${state.bountyId}`);
        }
    }

    console.log('✨ Recovery pass complete.');
}

main().catch(console.error);
