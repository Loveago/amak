import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AdminSubscriptionsPage() {
  requireAdmin("/admin/subscriptions");
  let subscriptions = [];
  try {
    subscriptions = await serverApi("/admin/subscriptions");
  } catch (error) {
    subscriptions = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Subscriptions</h2>
        <p className="text-sm text-ink/60">Monitor plan limits, expiries, and grace periods.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {subscriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No subscriptions have been recorded yet.
            </div>
          ) : (
            subscriptions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.agent?.name || "Agent"}</p>
                  <p className="text-xs text-ink/60">{item.plan?.name || "Plan"}</p>
                </div>
                <span className="font-semibold text-ink">{item.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
