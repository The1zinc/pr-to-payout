import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse Address and Key
    const contractAddress = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(0x[a-fA-F0-9]+)/)?.[1];
    const privateKey = envContent.match(/TEST_PRIVATE_KEY=(0x[a-fA-F0-9]+)/)?.[1];
    const rpcUrl = 'https://rpc-bradbury.genlayer.com';

    if (!contractAddress || !privateKey) {
        throw new Error('Missing contractAddress or privateKey in .env');
    }

    const account = createAccount(privateKey as `0x${string}`);
    const client = createClient({
        chain: testnetBradbury,
        account: account,
        endpoint: rpcUrl,
    });

    console.log(`🧪 Verified Test: Creating live bounty at ${contractAddress}...`);
    
    const hash = await client.writeContract({
        address: contractAddress as any,
        functionName: 'create_bounty',
        args: [
            "Test Live Bounty",
            "This is a verification bounty created via script.",
            "https://github.com/genlayer/genlayer-js",
            "Proof of code execution on-chain.",
            1000000n, // 1 GEN
            BigInt(Math.floor(Date.now() / 1000) + 86400), // 24h deadline
            "vercel.app",
            BigInt(Math.floor(Date.now() / 1000))
        ],
        value: 0n,
    });

    console.log(`⏳ Tx Hash: ${hash}`);
    console.log('⏳ Waiting for FINALITY...');

    const receipt = await client.waitForTransactionReceipt({
        hash: hash,
        status: TransactionStatus.ACCEPTED,
        interval: 3000,
        retries: 30,
    });

    if (receipt.status === 'ACCEPTED') {
        console.log('\n✅ BOUNTY CREATION SUCCESSFUL!');
        
        // Final State Proof
        const listJson = await client.readContract({
            address: contractAddress as any,
            functionName: 'list_bounties_json',
            args: []
        });
        
        const bounties = JSON.parse(listJson as string);
        console.log(`📊 Current On-chain Bounties: ${bounties.length}`);
        console.log(`💡 Latest Bounty Title: "${bounties[bounties.length - 1]?.title}"`);
    } else {
        console.error('❌ Transaction Failed.');
        console.log(JSON.stringify(receipt, null, 2));
    }
}

main().catch(console.error);
