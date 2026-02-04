import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateAfaStatus(formData) {
  "use server";
  const registrationId = String(formData.get("registrationId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!registrationId || !status) {
    return;
  }
  await serverApi(`/admin/afa-registrations/${registrationId}`, {
    method: "PATCH",
    body: { status }
  });
  revalidatePath("/admin/afa-registrations");
}

export default async function AdminAfaRegistrationsPage() {
  requireAdmin("/admin/afa-registrations");
  let registrations = [];
  try {
    registrations = await serverApi("/admin/afa-registrations");
  } catch (error) {
    registrations = [];
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl text-ink">AFA registrations</h2>
        <p className="text-sm text-ink/60">Review submitted registrations and update processing status.</p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-4">
          {registrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No AFA registrations have been submitted yet.
            </div>
          ) : (
            registrations.map((item) => {
              const createdAt = item.createdAt ? new Date(item.createdAt) : null;
              const dob = item.dateOfBirth ? new Date(item.dateOfBirth) : null;
              const payment = (item.payments || [])[0];
              return (
                <div key={item.id} className="rounded-2xl border border-ink/10 bg-white/80 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Agent</p>
                      <p className="mt-1 font-semibold text-ink">{item.agent?.name || "Agent"}</p>
                      <p className="text-xs text-ink/60">{item.agent?.email || "No email"}</p>
                      <p className="mt-2 text-xs text-ink/60">Submitted: {createdAt ? createdAt.toLocaleString() : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Status</p>
                      <p className="mt-1 font-semibold text-ink">{item.status}</p>
                      <p className="text-xs text-ink/60">
                        Payment {payment?.status || "Pending"} · GHS {Number(payment?.amountGhs || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Registrant</p>
                      <p className="mt-1 font-semibold text-ink">{item.fullName}</p>
                      <p className="text-xs text-ink/60">{item.ghanaCardNumber}</p>
                      <p className="text-xs text-ink/60">
                        {dob ? dob.toLocaleDateString() : ""} · {item.occupation}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Notes</p>
                      <p className="mt-1 text-xs text-ink/70">{item.notes || "No notes provided."}</p>
                    </div>
                  </div>
                  <form action={updateAfaStatus} className="mt-4 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="registrationId" value={item.id} />
                    <select
                      name="status"
                      defaultValue={item.status || "SUBMITTED"}
                      className="rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                      Update
                    </button>
                  </form>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
