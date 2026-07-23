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
        <p className="text-sm text-ink-muted">
          Orders automatically settled by the reconciler after confirming payment on Paystack. Each backend restart sets a
          fresh cutover at process start — only unpaid orders placed after that restart are inspected. Brand-new checkouts
          are skipped briefly so the normal callback/webhook path can finish first.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-muted">Total reconciled: {total}</p>
      </div>

      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-6 text-center text-sm text-ink-muted">
              No orders have been automatically reconciled yet.
            </div>
          ) : (
            items.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-ink-muted">{order.customerPhone}</p>
                  <p className="mt-1 truncate text-xs text-ink-muted">Order {order.id}</p>
                  <p className="text-xs text-ink-muted">Agent: {order.agent?.name || order.agentId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">GHS {Number(order.totalAmountGhs || 0).toFixed(2)}</p>
                  <p className="text-xs text-ink-muted">
                    {order.status}
                    {order.providerStatus ? ` · ${order.providerStatus}` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">Reconciled: {formatDateTime(order.autoReconciledAt)}</p>
                  <p className="text-xs text-ink-muted">Placed: {formatDateTime(order.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
