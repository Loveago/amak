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
    const orders = await serverApi("/admin/orders");
    const rows = [
      ["Order ID", "Agent", "Total (GHS)", "Status", "Created At"],
      ...orders.map((order) => [
        order.id,
        order.agent?.name || "",
        Number(order.totalAmountGhs || 0).toFixed(2),
        order.status,
        order.createdAt ? new Date(order.createdAt).toISOString() : ""
      ])
    ];

    const csv = rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=orders-report.csv"
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Unable to export" }, { status: 500 });
  }
}
