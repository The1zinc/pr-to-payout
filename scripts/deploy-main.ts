import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const envPath = path.resolve(__dirname, '../.env');
    const statePath = path.resolve(__dirname, '../.test-state.json');
    const contractPath = path.resolve(__dirname, '../contracts/pr_to_payout.py');

    if (!fs.existsSync(envPath)) {
        throw new Error('.env file NOT FOUND');
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const privateKey = envContent.match(/TEST_PRIVATE_KEY=(0x[a-fA-F0-9]+)/)?.[1];
    const rpcUrl = envContent.match(/NEXT_PUBLIC_GENLAYER_RPC_URL=([^\s]+)/)?.[1] || 'https://rpc-bradbury.genlayer.com';

    if (!privateKey) {
        throw new Error('TEST_PRIVATE_KEY not found in .env');
    }

    const account = createAccount(privateKey as `0x${string}`);
    const client = createClient({
        chain: testnetBradbury,
        account: account,
        endpoint: rpcUrl,
    });

    console.log(`🚀 Deploying from Account: ${account.address}`);
    console.log(`📄 Reading Contract: ${contractPath}`);
    const code = fs.readFileSync(contractPath, 'utf8');

    console.log('📦 Sending Deployment Transaction...');
    const hash = await client.deployContract({ code });
    console.log(`⏳ Tx Hash: ${hash}`);
    console.log('⏳ Waiting for finality (this may take up to 60s)...');

    const receipt = await client.waitForTransactionReceipt({
        hash: hash as any,
        status: TransactionStatus.ACCEPTED,
        interval: 20000,
        retries: 60,
    });

    if (receipt.status === 'ACCEPTED') {
        const newAddress = (receipt.txDataDecoded as any)?.contractAddress || receipt.recipient;
        console.log(`\n🎉 DEPLOYMENT SUCCESSFUL!`);
        console.log(`🔗 New Contract Address: ${newAddress}`);

        // Update .env
        let newEnv = envContent.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=0x[a-fA-F0-9]*/, `NEXT_PUBLIC_CONTRACT_ADDRESS=${newAddress}`);
        if (!newEnv.includes('NEXT_PUBLIC_CONTRACT_ADDRESS')) {
            newEnv += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${newAddress}`;
        }
        fs.writeFileSync(envPath, newEnv);
        console.log(`✅ Updated .env with new address.`);

        // Update .test-state.json
        if (fs.existsSync(statePath)) {
            const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
            state.contractAddress = newAddress;
            state.lastTxHash = hash;
            fs.writeFileSync(statePath, JSON.stringify(state));
            console.log(`✅ Updated .test-state.json`);
        }

        console.log('\n🔍 Verifying Visibility...');
        const nextId = await client.readContract({
            address: newAddress,
            functionName: 'get_next_bounty_id',
            args: []
        });
        console.log(`✅ Contract is LIVE. Next Bounty ID: ${nextId}`);
    } else {
        console.error('❌ Deployment Failed or Finalized with Error.');
        console.error(JSON.stringify(receipt, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        , 2));
    }
}

main().catch((err) => {
    console.error('❌ Critical Error during deployment:');
    console.error(err.message || err);
    process.exit(1);
});
