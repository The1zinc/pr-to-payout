import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "contracts", "pr_to_payout.py");
    const code = readFileSync(filePath, "utf-8");

    return NextResponse.json({ code }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Failed to read contract file" }, { status: 500 });
  }
}
