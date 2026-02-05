import { revalidatePath } from "next/cache";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

const PREFERRED_CATEGORY_ORDER = ["MTN", "Telecel", "AT Ishare", "AT Bigtime"];
const categoryPriority = new Map(
  PREFERRED_CATEGORY_ORDER.map((label, index) => [label.toLowerCase(), index])
);

const sizeValue = (value) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const match = String(value).match(/[\d.]+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const numeric = Number.parseFloat(match[0]);
  if (!Number.isFinite(numeric)) return Number.POSITIVE_INFINITY;
  return String(value).toLowerCase().includes("mb") ? numeric / 1000 : numeric;
};

const categorySortValue = (name = "") => {
  const normalized = name.trim().toLowerCase();
  if (categoryPriority.has(normalized)) {
    return { priority: categoryPriority.get(normalized), name: normalized };
  }
  return { priority: PREFERRED_CATEGORY_ORDER.length, name: normalized };
};

async function updateAffiliatePricing(formData) {
  "use server";
  const productId = String(formData.get("productId") || "").trim();
  const markupRaw = String(formData.get("affiliateMarkupGhs") || "").trim();
  if (!productId) {
    return;
  }

  const affiliateMarkupGhs = markupRaw.length ? Number(markupRaw) : 0;
  if (!Number.isFinite(affiliateMarkupGhs) || affiliateMarkupGhs < 0) {
    return;
  }

  await serverApi(`/agent/affiliate-pricing/${productId}`, {
    method: "PUT",
    body: { affiliateMarkupGhs }
  });
  revalidatePath("/agent/affiliate-pricing");
}

export default async function AgentAffiliatePricingPage() {
  requireAgent("/agent/affiliate-pricing");
  let products = [];
  try {
    products = await serverApi("/agent/affiliate-pricing");
  } catch (error) {
    products = [];
  }

  const grouped = products.reduce((acc, product) => {
    const category = product.category?.name || "Other";
    if (!acc[category]) {
      acc[category] = { name: category, products: [] };
    }
    acc[category].products.push(product);
    return acc;
  }, {});

  const categories = Object.values(grouped).sort((a, b) => {
    const sortA = categorySortValue(a.name);
    const sortB = categorySortValue(b.name);
    if (sortA.priority !== sortB.priority) {
      return sortA.priority - sortB.priority;
    }
    return sortA.name.localeCompare(sortB.name);
  });

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Affiliate pricing</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Set level-one affiliate prices</h2>
        <p className="mt-3 text-sm text-ink/70">
          Set the base price your level-one affiliates receive. They can add their own profit for their
          storefronts and also set prices for their own level-one affiliates.
        </p>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/20 bg-white/70 p-8 text-center text-sm text-ink/60">
            No products available yet.
          </div>
        ) : (
          categories.map((category, index) => {
            const sortedProducts = [...category.products].sort((a, b) => {
              const bySize = sizeValue(a.size) - sizeValue(b.size);
              if (bySize !== 0) return bySize;
              return String(a.name || "").localeCompare(String(b.name || ""));
            });
            return (
              <details
                key={category.name}
                open={index === 0}
                className="card-outline rounded-3xl bg-white/90 p-6"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="badge">Network</p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{category.name}</h3>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-ink/60">
                    {category.products.length} bundles
                  </span>
                </summary>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {sortedProducts.map((product) => {
                    const parentBase = product.parentBasePriceGhs !== null && product.parentBasePriceGhs !== undefined
                      ? `GHS ${Number(product.parentBasePriceGhs).toFixed(2)}`
                      : "Pending";
                    const affiliateBase = product.affiliateBasePriceGhs !== null && product.affiliateBasePriceGhs !== undefined
                      ? `GHS ${Number(product.affiliateBasePriceGhs).toFixed(2)}`
                      : "Pending";
                    return (
                      <div key={product.id} className="rounded-3xl border border-ink/10 bg-white/70 p-5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-ink">{product.name}</h4>
                          <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{product.size}</span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-ink/70">
                          <p>Parent base price: {parentBase}</p>
                          <p>Affiliate base price: {affiliateBase}</p>
                        </div>
                        <form action={updateAffiliatePricing} className="mt-4 space-y-3">
                          <input type="hidden" name="productId" value={product.id} />
                          <input
                            name="affiliateMarkupGhs"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={Number(product.affiliateMarkupGhs || 0)}
                            className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                            placeholder="Affiliate price add-on (GHS)"
                          />
                          <button className="w-full rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                            Save affiliate price
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
