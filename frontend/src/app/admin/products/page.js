import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function createCategory(formData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!name) {
    return;
  }

  await serverApi("/admin/categories", {
    method: "POST",
    body: { name, ...(slug ? { slug } : {}) }
  });
  revalidatePath("/admin/products");
}

async function updateProduct(formData) {
  "use server";
  const productId = String(formData.get("productId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const size = String(formData.get("size") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const basePriceRaw = String(formData.get("basePriceGhs") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!productId || !name || !size || !categoryId) {
    return;
  }

  const basePriceGhs = basePriceRaw ? Number(basePriceRaw) : undefined;
  await serverApi(`/admin/products/${productId}`, {
    method: "PATCH",
    body: {
      name,
      size,
      categoryId,
      ...(Number.isFinite(basePriceGhs) ? { basePriceGhs } : {}),
      ...(status ? { status } : {})
    }
  });
  revalidatePath("/admin/products");
}

async function createProduct(formData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const size = String(formData.get("size") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const basePriceRaw = String(formData.get("basePriceGhs") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!name || !size || !categoryId) {
    return;
  }

  const basePriceGhs = basePriceRaw ? Number(basePriceRaw) : undefined;
  await serverApi("/admin/products", {
    method: "POST",
    body: {
      name,
      size,
      categoryId,
      ...(Number.isFinite(basePriceGhs) ? { basePriceGhs } : {}),
      ...(status ? { status } : {})
    }
  });
  revalidatePath("/admin/products");
}

export default async function AdminProductsPage() {
  requireAdmin("/admin/products");
  let products = [];
  let categories = [];
  try {
    [products, categories] = await Promise.all([
      serverApi("/admin/products"),
      serverApi("/admin/categories")
    ]);
  } catch (error) {
    products = [];
    categories = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Products & pricing</h2>
        <p className="text-sm text-ink/60">Set base prices for each network bundle.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-outline rounded-3xl bg-white/90 p-6">
          <h3 className="font-display text-xl text-ink">Create category</h3>
          <p className="text-sm text-ink/60">Add a new network or bundle category.</p>
          <form action={createCategory} className="mt-4 space-y-3">
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              placeholder="Category name"
            />
            <input
              name="slug"
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              placeholder="Slug (optional)"
            />
            <button className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Save category
            </button>
          </form>
        </div>

        <div className="card-outline rounded-3xl bg-white/90 p-6">
          <h3 className="font-display text-xl text-ink">Add product</h3>
          <p className="text-sm text-ink/60">Create a new bundle product for agents.</p>
          <form action={createProduct} className="mt-4 space-y-3">
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              placeholder="Product name"
            />
            <input
              name="size"
              required
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              placeholder="Bundle size (e.g. 5GB)"
            />
            <select
              name="categoryId"
              required
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              name="basePriceGhs"
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              placeholder="Base price (GHS)"
            />
            <select
              name="status"
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              defaultValue="ACTIVE"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <button
              className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              disabled={categories.length === 0}
            >
              Create product
            </button>
            {categories.length === 0 && (
              <p className="text-xs text-ink/50">Create a category first to add products.</p>
            )}
          </form>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No products have been created yet.
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id || product.name} className="rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{product.name}</p>
                    <p className="text-xs text-ink/60">{product.category?.name || "Category"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">GHS {Number(product.basePriceGhs || 0).toFixed(2)}</p>
                    <p className="text-xs text-ink/60">{product.status}</p>
                  </div>
                </div>
                <form action={updateProduct} className="mt-4 grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="productId" value={product.id} />
                  <input
                    name="name"
                    defaultValue={product.name}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                    placeholder="Product name"
                  />
                  <input
                    name="size"
                    defaultValue={product.size}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                    placeholder="Bundle size"
                  />
                  <select
                    name="categoryId"
                    defaultValue={product.categoryId || product.category?.id || ""}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="basePriceGhs"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={product.basePriceGhs ?? ""}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                    placeholder="Base price (GHS)"
                  />
                  <select
                    name="status"
                    defaultValue={product.status || "ACTIVE"}
                    className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Update product
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
