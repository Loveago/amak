import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function initializeSubscription(formData) {
  "use server";
  const planId = String(formData.get("planId") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!planId || !email) {
    return;
  }

  const data = await serverApi("/payments/subscriptions/initialize", {
    method: "POST",
    body: { planId, email }
  });
  const redirectUrl = data?.authorization_url;
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export default async function AgentSubscriptionPage({ searchParams = {} }) {
  const user = requireAgent("/agent/subscription");
  const rawReference = searchParams.reference || searchParams.trxref;
  const reference = Array.isArray(rawReference) ? rawReference[0] : rawReference;
  const statusFlag = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;

  if (reference) {
    try {
      await serverApi("/payments/verify", {
        method: "POST",
        body: { reference }
      });
    } catch (error) {
      console.error("Payment verification failed", error);
    }
    redirect("/agent/subscription?status=verified");
  }
  let current = null;
  let plans = [];
  try {
    [current, plans] = await Promise.all([
      serverApi("/agent/subscription"),
      serverApi("/agent/plans")
    ]);
  } catch (error) {
    current = null;
    plans = [];
  }

  const currentPlanName = current?.plan?.name || "No active plan";
  const currentStatus = current?.status || "INACTIVE";
  const currentLimit = current?.plan?.productLimit ?? 0;
  const subscriptionMessage = current
    ? "Your subscription is lifetime and will not expire."
    : "You do not have an active subscription yet. Choose a plan below to activate your storefront.";
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Subscription</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Your current plan: {currentPlanName}</h2>
        <p className="text-sm text-ink-muted">
          Status: {currentStatus} · {currentLimit} active bundles
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="#plans"
            className="rounded-full border border-accent/10 bg-surface-elevated px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink"
          >
            Change plan
          </Link>
        </div>
        <div className="mt-3 rounded-2xl border border-accent/10 bg-surface-card px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">Subscription status</p>
          <p className="mt-2 text-sm text-ink-muted">{subscriptionMessage}</p>
        </div>
        {statusFlag === "verified" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Payment verified. Subscription activated.
          </p>
        )}
        {!current && (
          <p className="mt-2 text-xs text-ink-muted">{subscriptionMessage}</p>
        )}
      </div>

      <div id="plans" className="grid gap-4 md:grid-cols-3">
        {plans.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-accent/15 bg-surface-elevated p-8 text-center text-sm text-ink-muted">
            No plans available at the moment. Contact support to provision subscriptions.
          </div>
        ) : (
          plans.map((plan) => {
            const isCurrent = current?.plan?.id === plan.id && current?.status === "ACTIVE";
            const label = isCurrent ? "Current plan" : `Switch to ${plan.name}`;
            return (
              <div key={plan.id || plan.name} className="card-outline rounded-3xl bg-surface-card p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">{plan.name}</p>
                <h3 className="mt-3 text-3xl font-semibold text-ink">GHS {Number(plan.priceGhs).toFixed(2)}</h3>
                <p className="mt-2 text-sm text-ink-muted">{plan.productLimit} products</p>
                <form action={initializeSubscription} className="mt-6">
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="email" value={user.email || ""} />
                  <button
                    className="w-full rounded-full bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-night disabled:opacity-60"
                    disabled={isCurrent}
                  >
                    {label}
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
