import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateApiAccess(formData) {
  "use server";
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!id || !status) {
    return;
  }
  await serverApi(`/admin/api-access-requests/${id}`, {
    method: "PATCH",
    body: { status }
  });
  revalidatePath("/admin/api-access");
}

export default async function AdminApiAccessPage() {
  requireAdmin("/admin/api-access");
  let requests = [];
  try {
    requests = await serverApi("/admin/api-access-requests");
  } catch (error) {
    requests = [];
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">API Access Requests</h2>
        <p className="text-sm text-ink/60">Approve or reject agent API access requests.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No API access requests to review.
            </div>
          ) : (
            requests.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.agent?.name || "Agent"}</p>
                  <p className="text-xs text-ink/60">{item.agent?.email || ""}</p>
                  <p className="text-xs text-ink/60">Requested: {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      item.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.status === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <form action={updateApiAccess} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <select
                    name="status"
                    defaultValue={item.status || "PENDING"}
                    className="rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                  <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Update
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
