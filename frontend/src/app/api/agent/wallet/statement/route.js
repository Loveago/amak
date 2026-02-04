import { NextResponse } from "next/server";
import { serverApi } from "../../../../../lib/server-api";

function toCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const wallet = await serverApi("/agent/wallet");
    const transactions = wallet?.transactions || [];
    const rows = [
      ["Date", "Type", "Amount (GHS)", "Reference"],
      ...transactions.map((tx) => [
        tx.createdAt ? new Date(tx.createdAt).toISOString() : "",
        tx.type,
        Number(tx.amountGhs || 0).toFixed(2),
        tx.reference || ""
      ])
    ];

    const csv = rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=wallet-statement.csv"
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Unable to export" }, { status: 500 });
  }
}
