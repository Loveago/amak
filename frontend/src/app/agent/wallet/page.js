import Link from "next/link";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AgentWalletPage() {
  requireAgent("/agent/wallet");
  let wallet = null;
  try {
    wallet = await serverApi("/agent/wallet");
  } catch (error) {
    wallet = null;
  }

  const balance = Number(wallet?.balanceGhs ?? 0).toFixed(2);
  const transactions = wallet?.transactions ?? [];
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Wallet overview</p>
        <h2 className="mt-4 font-display text-3xl text-ink">GHS {balance}</h2>
        <p className="text-sm text-ink/60">Available balance</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/agent/withdrawals"
            className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Request withdrawal
          </Link>
          <a
            href="/api/agent/wallet/statement"
            className="rounded-full border border-ink/20 bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Download statement
          </a>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-2xl text-ink">Latest transactions</h3>
        <div className="mt-6 space-y-3">
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No ledger movements yet. Fulfilled orders and affiliate payouts will appear here instantly.
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{tx.type}</p>
                  <p className="text-xs text-ink/60">{tx.reference || "--"}</p>
                </div>
                <span className="font-semibold text-ink">
                  {tx.amountGhs >= 0 ? "+" : ""}GHS {Number(tx.amountGhs).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
