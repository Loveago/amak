import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

async function updateProductMarkup(formData) {
  "use server";
  const productId = String(formData.get("productId") || "").trim();
  const markupRaw = String(formData.get("markupGhs") || "").trim();
  const hasMarkup = markupRaw.length > 0;
  const isActiveRaw = formData.get("isActive");
  const isActive = isActiveRaw === "true" ? true : isActiveRaw === "false" ? false : undefined;
  if (!productId) {
    return;
  }
  if (!hasMarkup && isActive === undefined) {
    return;
  }

  let markupGhs;
  if (hasMarkup) {
    markupGhs = Number(markupRaw);
    if (!Number.isFinite(markupGhs) || markupGhs < 0) {
      return;
    }
  }

  try {
    await serverApi(`/agent/products/${productId}`, {
      method: "PUT",
      body: {
        ...(hasMarkup ? { markupGhs } : {}),
        ...(isActive !== undefined ? { isActive } : {})
      }
    });
    revalidatePath("/agent/products");
  } catch (error) {
    if (error?.status === 402) {
      redirect("/agent/subscription?reason=inactive");
    }
    throw error;
  }
}

export default async function AgentProductsPage() {
  requireAgent("/agent/products");
  let products = [];
  let subscription = null;
  try {
    products = await serverApi("/agent/products");
  } catch (error) {
    products = [];
  }
  try {
    subscription = await serverApi("/agent/subscription");
  } catch (error) {
    subscription = null;
  }
  const activeCount = products.filter((product) => product.isActive).length;
  const productLimit = subscription?.plan?.productLimit ?? 0;
  const subscriptionStatus = subscription?.status || "INACTIVE";
  const usageRatio = productLimit ? Math.min(activeCount / productLimit, 1) : 0;
  const usagePercent = Math.round(usageRatio * 100);
  const usageTone = usagePercent >= 100 ? "bg-rose-500" : usagePercent >= 80 ? "bg-amber-500" : "bg-emerald-500";
  const grouped = products.reduce((acc, product) => {
    const category = product.category || {};
    const key = category.id || category.slug || category.name || "uncategorized";
    if (!acc[key]) {
      acc[key] = {
        id: key,
        name: category.name || "Uncategorized",
        products: []
      };
    }
    acc[key].products.push(product);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="badge">Product catalog</p>
            <h2 className="mt-3 font-display text-2xl text-ink">Activate bundles and set markup.</h2>
          </div>
          <Link
            href="#catalog"
            className="rounded-full bg-aurora px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Browse catalog
          </Link>
        </div>
        {productLimit > 0 ? (
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/50">
              <span>Active bundles</span>
              <span>
                {activeCount} of {productLimit}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div className={`h-full ${usageTone}`} style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink/60">Subscription status: {subscriptionStatus}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-ink/20 bg-white/70 p-4 text-xs text-ink/60">
            Subscription inactive. Activate a plan to publish bundles.
          </div>
        )}
      </div>

      <div id="catalog" className="space-y-4">
        {categories.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-ink/20 bg-white/70 p-8 text-center text-sm text-ink/60">
            No products have been assigned yet. Ask the admin team to publish bundles for your storefront.
          </div>
        ) : (
          categories.map((category, index) => {
            const sortedProducts = [...category.products].sort((a, b) => {
              const bySize = sizeValue(a.size) - sizeValue(b.size);
              if (bySize !== 0) return bySize;
              return String(a.name || "").localeCompare(String(b.name || ""));
            });
            return (
            <details key={category.id} open={index === 0} className="card-outline rounded-3xl bg-white/90 p-6">
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
                  const base = product.basePriceGhs !== null && product.basePriceGhs !== undefined
                    ? `GHS ${Number(product.basePriceGhs).toFixed(2)}`
                    : "Pending";
                  const markup = `GHS ${Number(product.markupGhs || 0).toFixed(2)}`;
                  const status = product.isActive ? "Active" : "Inactive";
                  const actionLabel = product.isActive ? "Update markup" : "Activate product";
                  return (
                    <div key={product.id || product.name} className="rounded-3xl border border-ink/10 bg-white/70 p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-ink">{product.name}</h4>
                        <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{product.size}</span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-ink/70">
                        <p>Base price: {base}</p>
                        <p>Markup: {markup}</p>
                        <p>Status: {status}</p>
                      </div>
                      <form action={updateProductMarkup} className="mt-4 space-y-3">
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          name="markupGhs"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={Number(product.markupGhs || 0)}
                          className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                          placeholder="Markup (GHS)"
                        />
                        <button className="w-full rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          {actionLabel}
                        </button>
                      </form>
                      {product.isActive && (
                        <form action={updateProductMarkup} className="mt-3">
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="isActive" value="false" />
                          <button className="w-full rounded-full border border-ink/20 bg-white/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                            Deactivate product
                          </button>
                        </form>
                      )}
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
