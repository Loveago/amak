import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AdminAffiliatesPage() {
  requireAdmin("/admin/affiliates");
  let affiliates = [];
  try {
    affiliates = await serverApi("/admin/affiliates");
  } catch (error) {
    affiliates = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Affiliates</h2>
        <p className="text-sm text-ink-muted">Manage referral trees and commission rates.</p>
      </div>

      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <div className="space-y-3">
          {affiliates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-6 text-center text-sm text-ink-muted">
              No affiliate relationships have been recorded yet.
            </div>
          ) : (
            affiliates.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.parent?.name || "Agent"}</p>
                  <p className="text-xs text-ink-muted">Downline: {item.child?.name || "Agent"} · Level {item.level}</p>
                </div>
                <span className="font-semibold text-ink">Commission active</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
