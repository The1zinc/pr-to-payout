import { createAccount } from "genlayer-js";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const envPath = path.resolve(__dirname, "../.env");
    const envContent = fs.readFileSync(envPath, "utf8");
    const privateKey = envContent.match(/TEST_PRIVATE_KEY=(0x[a-fA-F0-9]+)/)?.[1];

    if (!privateKey) {
        console.error("❌ TEST_PRIVATE_KEY not found in .env");
        process.exit(1);
    }

    const account = createAccount(privateKey as `0x${string}`);
    console.log(`Current deployment account (from .env): ${account.address}`);
}

main().catch(console.error);
