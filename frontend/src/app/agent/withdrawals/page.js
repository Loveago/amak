import { revalidatePath } from "next/cache";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function createWithdrawal(formData) {
  "use server";
  const amountRaw = String(formData.get("amountGhs") || "").trim();
  const momoNumber = String(formData.get("momoNumber") || "").trim();
  const momoNetwork = String(formData.get("momoNetwork") || "").trim();
  const amountGhs = Number(amountRaw);
  if (!Number.isFinite(amountGhs) || amountGhs <= 0 || !momoNumber || !momoNetwork) {
    return;
  }

  await serverApi("/agent/withdrawals", {
    method: "POST",
    body: { amountGhs, momoNetwork, momoNumber }
  });
  revalidatePath("/agent/withdrawals");
}

export default async function AgentWithdrawalsPage() {
  requireAgent("/agent/withdrawals");
  let withdrawals = [];
  try {
    withdrawals = await serverApi("/agent/withdrawals");
  } catch (error) {
    withdrawals = [];
  }
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">Request a withdrawal</h2>
        <form action={createWithdrawal} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="amountGhs"
            type="number"
            min="1"
            step="0.01"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Amount (GHS)"
            required
          />
          <input
            name="momoNumber"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Mobile money number"
            required
          />
          <select
            name="momoNetwork"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select network
            </option>
            <option value="MTN MoMo">MTN MoMo</option>
            <option value="Telecel Cash">Telecel Cash</option>
            <option value="AirtelTigo Money">AirtelTigo Money</option>
          </select>
          <button className="rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Submit request
          </button>
        </form>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-2xl text-ink">Recent withdrawals</h3>
        <div className="mt-6 space-y-3">
          {withdrawals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No withdrawal requests yet. Submit a request above to move funds to mobile money.
            </div>
          ) : (
            withdrawals.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{item.id}</p>
                  <p className="text-xs text-ink/60">{item.status}</p>
                </div>
                <span className="font-semibold text-ink">GHS {Number(item.amountGhs || 0).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
