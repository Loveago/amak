import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function createPlan(formData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const priceRaw = String(formData.get("priceGhs") || "").trim();
  const limitRaw = String(formData.get("productLimit") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const priceGhs = Number(priceRaw);
  const productLimit = Number(limitRaw);
  if (!name || !Number.isFinite(priceGhs) || !Number.isFinite(productLimit)) {
    return;
  }

  await serverApi("/admin/plans", {
    method: "POST",
    body: {
      name,
      priceGhs,
      productLimit,
      ...(status ? { status } : {})
    }
  });
  revalidatePath("/admin/plans");
}

async function updatePlan(formData) {
  "use server";
  const planId = String(formData.get("planId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const priceRaw = String(formData.get("priceGhs") || "").trim();
  const limitRaw = String(formData.get("productLimit") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!planId || !name) {
    return;
  }

  const priceGhs = Number(priceRaw);
  const productLimit = Number(limitRaw);
  await serverApi(`/admin/plans/${planId}`, {
    method: "PATCH",
    body: {
      name,
      ...(Number.isFinite(priceGhs) ? { priceGhs } : {}),
      ...(Number.isFinite(productLimit) ? { productLimit } : {}),
      ...(status ? { status } : {})
    }
  });
  revalidatePath("/admin/plans");
}

export default async function AdminPlansPage() {
  requireAdmin("/admin/plans");
  let plans = [];
  try {
    plans = await serverApi("/admin/plans");
  } catch (error) {
    plans = [];
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Plan management</h2>
        <p className="text-sm text-ink/60">Create, price, and update subscription tiers.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-xl text-ink">Create plan</h3>
        <form action={createPlan} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            required
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Plan name"
          />
          <input
            name="priceGhs"
            type="number"
            min="1"
            step="0.01"
            required
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Price (GHS)"
          />
          <input
            name="productLimit"
            type="number"
            min="1"
            step="1"
            required
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Product limit"
          />
          <select
            name="status"
            defaultValue="ACTIVE"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button className="rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Save plan
          </button>
        </form>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-xl text-ink">Existing plans</h3>
        <div className="mt-4 space-y-4">
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No plans found yet.
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{plan.name}</p>
                    <p className="text-xs text-ink/60">Status: {plan.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">GHS {Number(plan.priceGhs || 0).toFixed(2)}</p>
                    <p className="text-xs text-ink/60">Limit: {plan.productLimit} products</p>
                  </div>
                </div>
                <form action={updatePlan} className="mt-4 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="planId" value={plan.id} />
                  <input
                    name="name"
                    defaultValue={plan.name}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                    placeholder="Plan name"
                  />
                  <input
                    name="priceGhs"
                    type="number"
                    min="1"
                    step="0.01"
                    defaultValue={plan.priceGhs}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                    placeholder="Price (GHS)"
                  />
                  <input
                    name="productLimit"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={plan.productLimit}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                    placeholder="Product limit"
                  />
                  <select
                    name="status"
                    defaultValue={plan.status || "ACTIVE"}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Update plan
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
