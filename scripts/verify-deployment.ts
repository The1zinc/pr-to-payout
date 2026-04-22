import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import * as fs from "fs";
import * as path from "path";

async function main() {
    // Load .env manually for transparency
    const envPath = path.resolve(__dirname, "../.env");
    const envContent = fs.readFileSync(envPath, "utf8");
    const contractAddress = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(0x[a-fA-F0-9]+)/)?.[1];
    const rpcUrl = envContent.match(/NEXT_PUBLIC_GENLAYER_RPC_URL=([^\s]+)/)?.[1] || "https://rpc-bradbury.genlayer.com";

    if (!contractAddress) {
        console.error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS not found in .env");
        process.exit(1);
    }

    console.log(`🔍 Verifying contract: ${contractAddress}`);
    console.log(`🌐 RPC: ${rpcUrl}`);

    const client = createClient({
        chain: testnetBradbury,
        endpoint: rpcUrl,
    });

    try {
        const nextId = await client.readContract({
            address: contractAddress as `0x${string}`,
            functionName: "get_next_bounty_id",
            args: [],
        });
        console.log(`✅ Success! Contract is LIVE and responding.`);
        console.log(`📊 Next Bounty ID: ${nextId}`);
    } catch (error: any) {
        console.error("❌ Deployment Check Failed!");
        console.error(`Error: ${error.message || error}`);
        if (error.message?.includes("not found") || error.message?.includes("0x")) {
            console.log("\n💡 Possible reasons:");
            console.log("1. The contract address in .env is incorrect.");
            console.log("2. The Bradbury testnet is currently unstable or the contract is not finalized.");
            console.log("3. The contract code has changed, making previous addresses invalid.");
        }
    }
}

main().catch(console.error);
