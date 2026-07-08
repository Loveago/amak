import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return "-";
  }
}

export default async function AdminReconciledOrdersPage() {
  requireAdmin("/admin/reconciled");

  let items = [];
  let total = 0;
  try {
    const data = await serverApi("/admin/orders/reconciled");
    items = Array.isArray(data?.items) ? data.items : [];
    total = Number(data?.total || items.length);
  } catch (error) {
    items = [];
    total = 0;
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Reconciled Orders</h2>
        <p className="text-sm text-ink/60">
          Orders automatically settled by the reconciler after confirming payment on Paystack. The reconciler runs every 2
          minutes and only inspects unpaid orders placed after it became active.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/50">Total reconciled: {total}</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No orders have been automatically reconciled yet.
            </div>
          ) : (
            items.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-ink/60">{order.customerPhone}</p>
                  <p className="mt-1 truncate text-xs text-ink/50">Order {order.id}</p>
                  <p className="text-xs text-ink/50">Agent: {order.agent?.name || order.agentId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">GHS {Number(order.totalAmountGhs || 0).toFixed(2)}</p>
                  <p className="text-xs text-ink/60">
                    {order.status}
                    {order.providerStatus ? ` · ${order.providerStatus}` : ""}
                  </p>
                  <p className="text-xs text-ink/50">Reconciled: {formatDateTime(order.autoReconciledAt)}</p>
                  <p className="text-xs text-ink/40">Placed: {formatDateTime(order.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
