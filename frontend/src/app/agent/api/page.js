import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";
import CopyButton from "../../../components/CopyButton";

async function requestAccess() {
  "use server";
  await serverApi("/agent/api-access", { method: "POST" });
  revalidatePath("/agent/api");
}

async function generateKey() {
  "use server";
  const data = await serverApi("/agent/api-keys", { method: "POST" });
  const rawKey = data?.apiKey || "";
  revalidatePath("/agent/api");
  redirect(`/agent/api?newKey=${encodeURIComponent(rawKey)}`);
}

async function revokeKey() {
  "use server";
  await serverApi("/agent/api-keys", { method: "DELETE" });
  revalidatePath("/agent/api");
}

export default async function AgentApiPage({ searchParams = {} }) {
  requireAgent("/agent/api");
  const newKey = searchParams.newKey || null;

  let accessStatus = null;
  let apiKey = null;
  try {
    [accessStatus, apiKey] = await Promise.all([
      serverApi("/agent/api-access"),
      serverApi("/agent/api-keys")
    ]);
  } catch (error) {
    accessStatus = null;
    apiKey = null;
  }

  const status = accessStatus?.status || null;
  const isApproved = status === "APPROVED";
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";
  const hasNoRequest = !status;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">API Access</p>
        <h2 className="mt-3 font-display text-2xl text-ink">External API</h2>
        <p className="text-sm text-ink/60">
          Integrate AmaBaKinaata into your own website. Place orders and check balances programmatically.
        </p>
      </div>

      {/* Access Request Section */}
      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-xl text-ink">Access Status</h3>

        {hasNoRequest && (
          <div className="mt-4">
            <p className="text-sm text-ink/60">
              You have not requested API access yet. Submit a request and an admin will review it.
            </p>
            <form action={requestAccess} className="mt-4">
              <button className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Request API access
              </button>
            </form>
          </div>
        )}

        {isPending && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-700">Pending</p>
            <p className="text-xs text-amber-600">Your request is awaiting admin approval.</p>
          </div>
        )}

        {isRejected && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">Rejected</p>
            <p className="text-xs text-red-600">Your API access request was rejected. Contact support for more information.</p>
          </div>
        )}

        {isApproved && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-700">Approved</p>
            <p className="text-xs text-emerald-600">Your API access is active. You can generate an API key below.</p>
          </div>
        )}
      </div>

      {/* Newly Generated Key Banner */}
      {newKey && (
        <div className="card-outline rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6">
          <h3 className="font-display text-xl text-emerald-800">Your New API Key</h3>
          <p className="mt-1 text-xs text-emerald-700">Copy this key now. It will not be shown again.</p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 break-all rounded-xl bg-white px-4 py-3 text-xs font-mono text-ink">{newKey}</code>
            <CopyButton value={newKey} ariaLabel="Copy API key" />
          </div>
        </div>
      )}

      {/* API Key Management */}
      {isApproved && (
        <div className="card-outline rounded-3xl bg-white/90 p-6">
          <h3 className="font-display text-xl text-ink">API Key</h3>

          {apiKey ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Active key ending in ****{apiKey.lastFour}</p>
                  <p className="text-xs text-ink/60">Created {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                </div>
                <form action={revokeKey}>
                  <button className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                    Revoke key
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs text-ink/50">
                You can only have one active API key. Revoke the current key to generate a new one.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-ink/60">No active API key. Generate one to start using the API.</p>
              <form action={generateKey} className="mt-4">
                <button className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  Generate API key
                </button>
              </form>
              <p className="mt-3 text-xs text-amber-600">
                Your API key will only be shown once after generation. Copy it immediately.
              </p>
            </div>
          )}
        </div>
      )}

      {/* API Documentation */}
      {isApproved && (
        <div className="card-outline rounded-3xl bg-white/90 p-6">
          <h3 className="font-display text-xl text-ink">API Documentation</h3>
          <div className="mt-4 space-y-6 text-sm text-ink/80">
            <div>
              <p className="font-semibold text-ink">Base URL</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">
                {"{YOUR_SITE_URL}"}/api/v1/external
              </code>
            </div>

            <div>
              <p className="font-semibold text-ink">Authentication</p>
              <p className="mt-1 text-xs text-ink/60">Include your API key in the Authorization header:</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">
                Authorization: Api-Key YOUR_API_KEY
              </code>
            </div>

            <div>
              <p className="font-semibold text-ink">1. List Packages</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">GET /packages</code>
              <p className="mt-1 text-xs text-ink/60">Returns all available data packages with API pricing.</p>
            </div>

            <div>
              <p className="font-semibold text-ink">2. Check Balance</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">GET /balance</code>
              <p className="mt-1 text-xs text-ink/60">Returns your current wallet balance.</p>
            </div>

            <div>
              <p className="font-semibold text-ink">3. Place Order</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">POST /orders</code>
              <p className="mt-1 text-xs text-ink/60">Submit a data order. Required fields:</p>
              <ul className="mt-1 list-inside list-disc text-xs text-ink/60">
                <li><strong>productId</strong> (string) — from /packages</li>
                <li><strong>recipientPhone</strong> (string) — recipient number</li>
                <li><strong>quantity</strong> (number, optional, default 1)</li>
                <li><strong>reference</strong> (string, optional) — your reference</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-ink">4. Check Order Status</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">GET /orders/:orderId</code>
              <p className="mt-1 text-xs text-ink/60">Returns the current status of an order.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
