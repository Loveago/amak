import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AgentAffiliatePage() {
  const user = requireAgent("/agent/affiliate");
  let downlines = [];
  try {
    downlines = await serverApi("/agent/affiliate");
  } catch (error) {
    downlines = [];
  }

  const referralLink = user.slug ? `/signup?ref=${user.slug}` : "Referral link pending";
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Affiliate network</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Your referral link</h2>
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
          <span className="font-semibold text-ink break-all">{referralLink}</span>
          <p className="mt-2 text-xs text-ink/60">Share this referral URL to grow your network.</p>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-2xl text-ink">Downlines</h3>
        <div className="mt-6 space-y-3">
          {downlines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No downlines yet. Share your referral link to start earning commissions.
            </div>
          ) : (
            downlines.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.child?.name || "Agent"}</p>
                  <p className="text-xs text-ink/60">Level {item.level}</p>
                </div>
                <span className="font-semibold text-ink">Commission auto-credited</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
