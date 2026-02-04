import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateWithdrawalStatus(formData) {
  "use server";
  const withdrawalId = String(formData.get("withdrawalId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!withdrawalId || !status) {
    return;
  }
  await serverApi(`/admin/withdrawals/${withdrawalId}`, {
    method: "PATCH",
    body: { status }
  });
  revalidatePath("/admin/withdrawals");
}

export default async function AdminWithdrawalsPage() {
  requireAdmin("/admin/withdrawals");
  let withdrawals = [];
  try {
    withdrawals = await serverApi("/admin/withdrawals");
  } catch (error) {
    withdrawals = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Withdrawals</h2>
        <p className="text-sm text-ink/60">Approve or reject agent payout requests.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No withdrawal requests to review right now.
            </div>
          ) : (
            withdrawals.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.id}</p>
                  <p className="text-xs text-ink/60">{item.agent?.name || "Agent"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">GHS {Number(item.amountGhs || 0).toFixed(2)}</p>
                  <p className="text-xs text-ink/60">{item.status}</p>
                </div>
                <form action={updateWithdrawalStatus} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="withdrawalId" value={item.id} />
                  <select
                    name="status"
                    defaultValue={item.status || "PENDING"}
                    className="rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="PAID">PAID</option>
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
