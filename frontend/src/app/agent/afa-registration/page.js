import { redirect } from "next/navigation";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function initializeAfaRegistration(formData) {
  "use server";
  const fullName = String(formData.get("fullName") || "").trim();
  const ghanaCardNumber = String(formData.get("ghanaCardNumber") || "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") || "").trim();
  const occupation = String(formData.get("occupation") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!fullName || !ghanaCardNumber || !dateOfBirth || !occupation || !email) {
    return;
  }

  const data = await serverApi("/payments/afa-registrations/initialize", {
    method: "POST",
    body: {
      fullName,
      ghanaCardNumber,
      dateOfBirth,
      occupation,
      notes: notes || undefined,
      email
    }
  });
  const redirectUrl = data?.authorization_url;
  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export default async function AgentAfaRegistrationPage({ searchParams = {} }) {
  const user = requireAgent("/agent/afa-registration");
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
    redirect("/agent/afa-registration?status=verified");
  }

  let config = null;
  let registrations = [];
  try {
    [config, registrations] = await Promise.all([
      serverApi("/agent/afa/config"),
      serverApi("/agent/afa-registrations")
    ]);
  } catch (error) {
    config = null;
    registrations = [];
  }

  const feeGhs = Number(config?.registrationFeeGhs ?? 20).toFixed(2);
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">AFA registration</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Register for AFA certification</h2>
        <p className="text-sm text-ink/60">
          Submit your details and complete the one-time registration payment.
        </p>
        <p className="mt-3 text-sm font-semibold text-ink">Current fee: GHS {feeGhs}</p>
        {statusFlag === "verified" && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Payment verified. Your registration has been submitted.
          </p>
        )}
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-2xl text-ink">Registration details</h3>
        <form action={initializeAfaRegistration} className="mt-6 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="email" value={user.email || ""} />
          <input
            name="fullName"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Full name"
            required
          />
          <input
            name="ghanaCardNumber"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Ghana card number"
            required
          />
          <input
            name="dateOfBirth"
            type="date"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            required
          />
          <input
            name="occupation"
            className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            placeholder="Occupation"
            required
          />
          <textarea
            name="notes"
            className="min-h-[120px] rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm md:col-span-2"
            placeholder="Other notes"
          />
          <button className="rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white md:col-span-2">
            Pay GHS {feeGhs} and submit
          </button>
        </form>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-2xl text-ink">Your submissions</h3>
        <div className="mt-6 space-y-3">
          {registrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No AFA registrations yet. Submit your details above to get started.
            </div>
          ) : (
            registrations.map((item) => {
              const createdAt = item.createdAt ? new Date(item.createdAt) : null;
              const dob = item.dateOfBirth ? new Date(item.dateOfBirth) : null;
              const payment = (item.payments || [])[0];
              return (
                <div key={item.id} className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Registration</p>
                      <p className="mt-1 font-semibold text-ink">{item.fullName}</p>
                      <p className="text-xs text-ink/60">{item.ghanaCardNumber}</p>
                      <p className="text-xs text-ink/60">
                        {dob ? dob.toLocaleDateString() : ""} · {item.occupation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Status</p>
                      <p className="mt-1 font-semibold text-ink">{item.status}</p>
                      <p className="text-xs text-ink/60">
                        {createdAt ? createdAt.toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                  {item.notes ? <p className="mt-3 text-xs text-ink/70">Notes: {item.notes}</p> : null}
                  {payment ? (
                    <p className="mt-2 text-xs text-ink/60">
                      Payment {payment.status} · GHS {Number(payment.amountGhs || 0).toFixed(2)}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
