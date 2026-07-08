import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AdminWalletDepositsPage() {
  requireAdmin("/admin/wallet-deposits");

  let deposits = [];
  try {
    deposits = await serverApi("/admin/wallet-deposits");
  } catch (error) {
    deposits = [];
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Wallet Deposits</h2>
        <p className="text-sm text-ink-muted">Review all successful wallet top-ups across agents.</p>
      </div>

      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <div className="space-y-3">
          {deposits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-6 text-center text-sm text-ink-muted">
              No wallet deposits have been recorded yet.
            </div>
          ) : (
            deposits.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">{item.wallet?.agent?.name || "Agent"}</p>
                  <p className="text-xs text-ink-muted">{item.wallet?.agent?.email || "No email"}</p>
                  <p className="text-xs text-ink-muted">Ref: {item.reference || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">GHS {Number(item.amountGhs || 0).toFixed(2)}</p>
                  <p className="text-xs text-ink-muted">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
