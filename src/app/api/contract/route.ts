import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "contracts", "pr_to_payout.py");
    const rawCode = readFileSync(filePath, "utf-8");
    // VERY IMPORTANT: GenVM requires this special comment header to install dependencies
    // Without it, the contract crashes during validation and gets stuck at UNINITIALIZED
    const code = rawCode;
    return NextResponse.json({ code });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read contract file" }, { status: 500 });
  }
}
