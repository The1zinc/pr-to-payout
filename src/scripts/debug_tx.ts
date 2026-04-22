import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

async function main() {
  const txHash = process.argv[2] as `0x${string}`;
  if (!txHash) {
    console.error("Please provide a GenLayer transaction hash.");
    process.exit(1);
  }

  const client = createClient({
    chain: testnetBradbury,
    endpoint: "https://rpc-bradbury.genlayer.com",
  });

  console.log(`Checking transaction: ${txHash}...`);

  try {
    const tx = await client.getTransaction({ hash: txHash as any });
    console.log("\n--- TRANSACTION DETAILS ---");
    console.log(`Status: ${tx.statusName} (${tx.status})`);
    console.log(`From: ${tx.from_address}`);
    console.log(`To: ${tx.to_address}`);
    
    if (tx.data) {
        console.log("\n--- CALL DATA ---");
        console.log(JSON.stringify(tx.data, null, 2));
    }

    try {
        const receipt = await client.getTransactionReceipt({ hash: txHash as never });
        console.log("\n--- FULL TRANSACTION RECEIPT ---");
        console.log(JSON.stringify(receipt, null, 2));
    } catch (e) {
        console.log("\n--- RECEIPT NOT FOUND YET ---");
        console.log(e);
    }

  } catch (error) {
    console.error("Error fetching transaction details:", error);
  }
}

main();
