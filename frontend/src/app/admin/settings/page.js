import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateAfaFee(formData) {
  "use server";
  const feeRaw = String(formData.get("registrationFeeGhs") || "").trim();
  const registrationFeeGhs = Number(feeRaw);
  if (!Number.isFinite(registrationFeeGhs) || registrationFeeGhs <= 0) {
    return;
  }
  await serverApi("/admin/settings/afa", {
    method: "PATCH",
    body: { registrationFeeGhs }
  });
  revalidatePath("/admin/settings");
}

export default async function AdminSettingsPage() {
  requireAdmin("/admin/settings");
  let settings = null;
  try {
    settings = await serverApi("/admin/settings");
  } catch (error) {
    settings = null;
  }

  const commissions = settings?.commissionRates || {};
  const feeGhs = Number(settings?.afaRegistrationFeeGhs ?? 20).toFixed(2);
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">System settings</h2>
        <p className="text-sm text-ink/60">Live configuration snapshot for production operations.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Commission rates</p>
            <p className="mt-2 font-semibold text-ink">Level 1: {((commissions[1] || 0) * 100).toFixed(1)}%</p>
            <p className="mt-1 text-xs text-ink/60">Level 2: {((commissions[2] || 0) * 100).toFixed(1)}%</p>
            <p className="mt-1 text-xs text-ink/60">Level 3: {((commissions[3] || 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Payments</p>
            <p className="mt-2 font-semibold text-ink">
              Paystack status: {settings?.paystackConfigured ? "Configured" : "Missing keys"}
            </p>
            <p className="mt-1 text-xs text-ink/60">Base URL: {settings?.baseUrl || "Not set"}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">AFA registration fee</p>
            <p className="mt-2 font-semibold text-ink">GHS {feeGhs}</p>
            <form action={updateAfaFee} className="mt-3 flex flex-wrap items-center gap-2">
              <input
                name="registrationFeeGhs"
                type="number"
                min="1"
                step="0.01"
                className="w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-xs md:w-auto"
                placeholder="Update fee"
                defaultValue={feeGhs}
                required
              />
              <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Save fee
              </button>
            </form>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink/60">
          Update production settings via environment variables on the backend host.
        </p>
      </div>
    </div>
  );
}
