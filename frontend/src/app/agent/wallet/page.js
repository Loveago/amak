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
  const verifyRefRaw = searchParams.verifyRef;
  const verifyRef = Array.isArray(verifyRefRaw) ? verifyRefRaw[0] : verifyRefRaw;
  const errorFlag = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (reference) {
    try {
      await serverApi("/payments/verify", { method: "POST", body: { reference } });
    } catch (error) {
      console.error("Wallet top-up verification failed", error);
    }
    redirect("/agent/wallet?status=verified");
  }

  if (verifyRef) {
    let verifyError = null;
    try {
      await serverApi("/payments/wallet-topup/verify", {
        method: "POST",
        body: { reference: verifyRef }
      });
    } catch (error) {
      verifyError = error;
    }

    if (verifyError) {
      const message = verifyError?.message || "Unable to verify top-up";
      return redirect(`/agent/wallet?error=${encodeURIComponent(message)}`);
    }
    return redirect("/agent/wallet?status=verified");
  }

  let wallet = null;
  try {
    wallet = await serverApi("/agent/wallet");
  } catch (error) {
    wallet = null;
  }

  const balance = Number(wallet?.balanceGhs ?? 0).toFixed(2);
  const transactions = wallet?.transactions ?? [];
  const topups = wallet?.topups ?? [];
  const pendingTopups = topups.filter((t) => t.status !== "VERIFIED");
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Wallet overview</p>
        <h2 className="mt-4 font-display text-3xl text-ink">GHS {balance}</h2>
        <p className="text-sm text-ink-muted">Available balance</p>
        {statusFlag === "verified" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Payment verified. Wallet credited.
          </p>
        )}
        {errorFlag && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
            {errorFlag}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/agent/withdrawals"
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night"
          >
            Request withdrawal
          </Link>
          <a
            href="/api/agent/wallet/statement"
            className="rounded-full border border-accent/15 bg-surface-elevated px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Download statement
          </a>
        </div>
        <details className="mt-6">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
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
              className="w-40 rounded-2xl border border-accent/10 bg-surface-card px-4 py-2 text-sm"
              placeholder="Amount (GHS)"
            />
            <button className="rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night">
              Pay now
            </button>
          </form>
        </details>
      </div>

      {pendingTopups.length > 0 && (
        <div className="card-outline rounded-3xl bg-surface-card p-6">
          <h3 className="font-display text-2xl text-ink">Top-up tracker</h3>
          <p className="mt-2 text-sm text-ink-muted">
            If you paid on Paystack but your wallet wasn&apos;t credited, click Verify to re-check Paystack and credit your wallet.
          </p>
          <div className="mt-6 space-y-3">
            {pendingTopups.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">WALLET_TOPUP</p>
                  <p className="text-xs text-ink-muted break-all">{p.reference}</p>
                  <p className="text-xs text-ink-muted">Status: {p.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">GHS {Number(p.metadata?.subtotalGhs || p.amountGhs || 0).toFixed(2)}</span>
                  <a
                    href={`/agent/wallet?verifyRef=${encodeURIComponent(p.reference || "")}`}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night"
                  >
                    Verify
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <h3 className="font-display text-2xl text-ink">Latest transactions</h3>
        <div className="mt-6 space-y-3">
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-6 text-center text-sm text-ink-muted">
              No ledger movements yet. Fulfilled orders and affiliate payouts will appear here instantly.
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{tx.type}</p>
                  <p className="text-xs text-ink-muted">{tx.reference || "--"}</p>
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
