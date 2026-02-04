import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AdminPaymentsPage() {
  requireAdmin("/admin/payments");
  let payments = [];
  try {
    payments = await serverApi("/admin/payments");
  } catch (error) {
    payments = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Payments</h2>
        <p className="text-sm text-ink/60">Track Paystack references and webhook status.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No payments have been recorded yet.
            </div>
          ) : (
            payments.map((item) => (
              <div key={item.id || item.reference} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.reference}</p>
                  <p className="text-xs text-ink/60">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">GHS {Number(item.amountGhs || 0).toFixed(2)}</p>
                  <p className="text-xs text-ink/60">{item.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
