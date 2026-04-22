import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log('🧪 Starting Local Simulation Test...');
    
    // 1. Setup
    // For simulation, we use a fixed mock key
    const mockKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as `0x${string}`;
    const account = createAccount(mockKey);
    
    // We try to talk to a local simulator if it exists, otherwise studionet
    const client = createClient({
        chain: studionet,
        account: account,
        endpoint: 'http://localhost:8080', // Default local simulator port
    });

    const contractPath = path.resolve(__dirname, '../contracts/pr_to_payout.py');
    const code = fs.readFileSync(contractPath, 'utf8');

    console.log(`👤 Mock Account: ${account.address}`);
    console.log(`📡 Connecting to simulator at ${(client as any).endpoint}...`);

    try {
        // 2. Deploy
        console.log('📦 Deploying to Simulator...');
        const deployHash = await client.deployContract({ code });
        console.log(`⏳ Deploy Tx: ${deployHash}`);
        
        const receipt = await client.waitForTransactionReceipt({ 
            hash: deployHash as any, 
            status: TransactionStatus.ACCEPTED,
            interval: 1000,
            retries: 10
        });
        
        const address = (receipt.txDataDecoded as any)?.contractAddress || receipt.recipient;
        console.log(`🎉 Deployed at: ${address}`);

        // 3. Create Bounty
        console.log('💎 Creating Bounty...');
        const createHash = await client.writeContract({
            address: address as any,
            functionName: 'create_bounty',
            args: ["Test Bounty", "Desc", "https://github.com/repo", "Criteria", 1000000n, 9999999999n, "vercel.app", BigInt(Math.floor(Date.now() / 1000))],
            value: 0n,
        });
        await client.waitForTransactionReceipt({ hash: createHash as any });
        console.log('✅ Bounty Created');

        // 4. View State
        const nextId = await client.readContract({
            address: address as any,
            functionName: 'get_next_bounty_id',
            args: []
        });
        console.log(`📊 Current State (Next ID): ${nextId}`);

        console.log('✨ SIMULATION SUCCESS');
    } catch (e: any) {
        if (e.message.includes('ECONNREFUSED')) {
            console.error('❌ Local Simulator not found on port 8080.');
            console.error('💡 Please start the simulator first, or we can use the Studio UI.');
        } else {
            console.error('🔥 Simulation Error:', e.message);
        }
        process.exit(1);
    }
}

main().catch(console.error);
