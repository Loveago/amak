import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AdminWalletsPage() {
  requireAdmin("/admin/wallets");
  let wallets = [];
  try {
    wallets = await serverApi("/admin/wallets");
  } catch (error) {
    wallets = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Wallets</h2>
        <p className="text-sm text-ink/60">Track agent balances and ledger adjustments.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {wallets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No wallet balances to display yet.
            </div>
          ) : (
            wallets.map((wallet) => (
              <div key={wallet.id || wallet.agent?.name} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{wallet.agent?.name || "Agent"}</p>
                  <p className="text-xs text-ink/60">Ledger balance</p>
                </div>
                <span className="font-semibold text-ink">GHS {Number(wallet.balanceGhs || 0).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
