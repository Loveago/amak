import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function loadWallet(formData) {
  "use server";
  const amountGhs = Number(formData.get("amountGhs") || 0);
  const email = String(formData.get("email") || "").trim();
  if (!amountGhs || amountGhs <= 0 || !email) {
    return;
  }
  const data = await serverApi("/payments/wallet-topup/initialize", {
    method: "POST",
    body: { amountGhs, email }
  });
  const redirectUrl = data?.authorization_url;
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export default async function AgentWalletPage({ searchParams = {} }) {
  const user = requireAgent("/agent/wallet");
  const rawReference = searchParams.reference || searchParams.trxref;
  const reference = Array.isArray(rawReference) ? rawReference[0] : rawReference;
  const statusFlag = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;

  if (reference) {
    try {
      await serverApi("/payments/verify", { method: "POST", body: { reference } });
    } catch (error) {
      console.error("Wallet top-up verification failed", error);
    }
    redirect("/agent/wallet?status=verified");
  }

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
        {statusFlag === "verified" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Payment verified. Wallet credited.
          </p>
        )}
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
        <details className="mt-6">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
            Load wallet via Paystack
          </summary>
          <form action={loadWallet} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="email" value={user.email || ""} />
            <input
              name="amountGhs"
              type="number"
              min="1"
              step="0.01"
              required
              className="w-40 rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
              placeholder="Amount (GHS)"
            />
            <button className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Pay now
            </button>
          </form>
        </details>
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
