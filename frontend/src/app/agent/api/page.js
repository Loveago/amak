import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";
import CopyButton from "../../../components/CopyButton";

const BASE_API = "https://amabakent.uk/api/v1/external";

async function requestAccess() {
  "use server";
  try {
    await serverApi("/agent/api-access", { method: "POST" });
  } catch (e) {}
  revalidatePath("/agent/api");
}

async function generateKey() {
  "use server";
  let rawKey = "";
  try {
    const data = await serverApi("/agent/api-keys", { method: "POST" });
    rawKey = data?.apiKey || "";
  } catch (e) {}
  revalidatePath("/agent/api");
  if (rawKey) {
    redirect(`/agent/api?newKey=${encodeURIComponent(rawKey)}`);
  }
  redirect("/agent/api");
}

async function revokeKey() {
  "use server";
  try {
    await serverApi("/agent/api-keys/revoke", { method: "POST" });
  } catch (e) {}
  revalidatePath("/agent/api");
  redirect("/agent/api?revoked=1");
}

export default async function AgentApiPage({ searchParams = {} }) {
  requireAgent("/agent/api");
  const newKey = searchParams.newKey || null;
  const revoked = searchParams.revoked || null;

  let accessStatus = null;
  let apiKey = null;
  try {
    accessStatus = await serverApi("/agent/api-access");
  } catch (e) {
    accessStatus = null;
  }
  try {
    apiKey = await serverApi("/agent/api-keys");
  } catch (e) {
    apiKey = null;
  }

  const status = accessStatus?.status || null;
  const isApproved = status === "APPROVED";
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";
  const hasNoRequest = !status;

  const keyLastFour = apiKey?.lastFour || "";
  const keyCreated = apiKey?.createdAt ? new Date(apiKey.createdAt).toLocaleDateString() : "";

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

      {/* Revoked Banner */}
      {revoked && (
        <div className="card-outline rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-700">API key revoked successfully.</p>
          <p className="text-xs text-amber-600">You can now generate a new key below.</p>
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
                  <p className="text-sm font-semibold text-ink">
                    Active key{keyLastFour ? ` ending in ****${keyLastFour}` : ""}
                  </p>
                  {keyCreated && (
                    <p className="text-xs text-ink/60">Created {keyCreated}</p>
                  )}
                </div>
                <form action={revokeKey}>
                  <button className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                    Delete &amp; Revoke key
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs text-ink/50">
                You can only have one active API key. Delete the current key to generate a new one.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-ink/60">No active API key. Click below to generate one.</p>
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
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs break-all">
                {BASE_API}
              </code>
            </div>

            <div>
              <p className="font-semibold text-ink">Authentication</p>
              <p className="mt-1 text-xs text-ink/60">Include your API key in the Authorization header on every request:</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">
                Authorization: Api-Key YOUR_API_KEY
              </code>
            </div>

            <hr className="border-ink/10" />

            {/* 1. List Packages */}
            <div>
              <p className="font-semibold text-ink">1. List Packages</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">GET /packages</code>
              <p className="mt-2 text-xs text-ink/60">Returns all available data packages with API pricing.</p>
              <p className="mt-2 text-xs font-semibold text-ink">Example cURL</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap break-all">
{`curl -X GET "${BASE_API}/packages" \\
  -H "Authorization: Api-Key YOUR_API_KEY"`}
              </pre>
              <p className="mt-2 text-xs font-semibold text-ink">Response</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap">
{`{
  "success": true,
  "data": [
    {
      "id": "clxyz123...",
      "network": "MTN",
      "networkSlug": "mtn",
      "name": "MTN 1GB Daily",
      "size": "1GB",
      "price": 5.00
    }
  ]
}`}
              </pre>
              <p className="mt-2 text-xs text-ink/60">
                <strong>id</strong> — product ID (use when placing orders) &middot;
                <strong> network</strong> — provider name &middot;
                <strong> name</strong> — package name &middot;
                <strong> size</strong> — data size &middot;
                <strong> price</strong> — price in GHS
              </p>
            </div>

            <hr className="border-ink/10" />

            {/* 2. Check Balance */}
            <div>
              <p className="font-semibold text-ink">2. Check Balance</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">GET /balance</code>
              <p className="mt-2 text-xs text-ink/60">Returns your current wallet balance in GHS.</p>
              <p className="mt-2 text-xs font-semibold text-ink">Example cURL</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap break-all">
{`curl -X GET "${BASE_API}/balance" \\
  -H "Authorization: Api-Key YOUR_API_KEY"`}
              </pre>
              <p className="mt-2 text-xs font-semibold text-ink">Response</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap">
{`{
  "success": true,
  "balance": 150.00
}`}
              </pre>
            </div>

            <hr className="border-ink/10" />

            {/* 3. Place Order */}
            <div>
              <p className="font-semibold text-ink">3. Place Order</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">POST /orders</code>
              <p className="mt-2 text-xs text-ink/60">Submit a data order. Your wallet is debited immediately.</p>
              <p className="mt-2 text-xs font-semibold text-ink">Request Body</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap">
{`{
  "productId": "clxyz123...",
  "recipientPhone": "0240000000",
  "quantity": 1,
  "reference": "my-order-ref-001"
}`}
              </pre>
              <ul className="mt-2 list-inside list-disc text-xs text-ink/60">
                <li><strong>productId</strong> (string, required) — product ID from /packages</li>
                <li><strong>recipientPhone</strong> (string, required) — recipient phone number</li>
                <li><strong>quantity</strong> (number, optional) — defaults to 1</li>
                <li><strong>reference</strong> (string, optional) — your own tracking reference</li>
              </ul>
              <p className="mt-2 text-xs font-semibold text-ink">Example cURL</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap break-all">
{`curl -X POST "${BASE_API}/orders" \\
  -H "Authorization: Api-Key YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"productId":"PRODUCT_ID","recipientPhone":"0240000000","quantity":1}'`}
              </pre>
              <p className="mt-2 text-xs font-semibold text-ink">Response</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap">
{`{
  "success": true,
  "data": {
    "orderId": "clxyz456...",
    "productId": "clxyz123...",
    "network": "MTN",
    "size": "1GB",
    "recipientPhone": "0240000000",
    "quantity": 1,
    "totalAmountGhs": 5.00,
    "status": "PAID",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}`}
              </pre>
            </div>

            <hr className="border-ink/10" />

            {/* 4. Check Order Status */}
            <div>
              <p className="font-semibold text-ink">4. Check Order Status</p>
              <code className="mt-1 block rounded-xl bg-ink/5 px-4 py-2 text-xs">GET /orders/:orderId</code>
              <p className="mt-2 text-xs text-ink/60">Returns the current status of an order.</p>
              <p className="mt-2 text-xs font-semibold text-ink">Example cURL</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap break-all">
{`curl -X GET "${BASE_API}/orders/ORDER_ID" \\
  -H "Authorization: Api-Key YOUR_API_KEY"`}
              </pre>
              <p className="mt-2 text-xs font-semibold text-ink">Response</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap">
{`{
  "success": true,
  "data": {
    "orderId": "clxyz456...",
    "productId": "clxyz123...",
    "network": "MTN",
    "size": "1GB",
    "recipientPhone": "0240000000",
    "quantity": 1,
    "totalAmountGhs": 5.00,
    "status": "FULFILLED",
    "providerStatus": "DELIVERED",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}`}
              </pre>
            </div>

            <hr className="border-ink/10" />

            {/* Status Flow */}
            <div>
              <p className="font-semibold text-ink">Order Status Flow</p>
              <ul className="mt-2 list-inside list-disc text-xs text-ink/60">
                <li><strong>PAID</strong> — Order received, wallet debited, being sent to provider</li>
                <li><strong>FULFILLED</strong> — Order delivered successfully</li>
                <li><strong>FAILED</strong> — Order could not be processed (rare)</li>
              </ul>
            </div>

            <hr className="border-ink/10" />

            {/* Error Responses */}
            <div>
              <p className="font-semibold text-ink">Error Responses</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-2 text-xs whitespace-pre-wrap">
{`{
  "success": false,
  "error": "Error message here"
}`}
              </pre>
              <ul className="mt-2 list-inside list-disc text-xs text-ink/60">
                <li><strong>400</strong> — Missing/invalid parameters or insufficient balance</li>
                <li><strong>401</strong> — Missing or invalid API key</li>
                <li><strong>403</strong> — API access not approved</li>
                <li><strong>404</strong> — Resource not found</li>
              </ul>
            </div>

            <hr className="border-ink/10" />

            {/* JavaScript Example */}
            <div>
              <p className="font-semibold text-ink">JavaScript Integration Example</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-ink/5 px-4 py-3 text-xs whitespace-pre-wrap">
{`const API_KEY = "amba_your_api_key_here";
const BASE = "${BASE_API}";
const headers = { "Authorization": \`Api-Key \${API_KEY}\` };

// List packages
const pkgs = await fetch(\`\${BASE}/packages\`, { headers })
  .then(r => r.json());

// Check balance
const bal = await fetch(\`\${BASE}/balance\`, { headers })
  .then(r => r.json());

// Place order
const order = await fetch(\`\${BASE}/orders\`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    productId: "PRODUCT_ID",
    recipientPhone: "0240000000",
    quantity: 1
  })
}).then(r => r.json());

// Check order status
const status = await fetch(
  \`\${BASE}/orders/\${order.data.orderId}\`, { headers }
).then(r => r.json());`}
              </pre>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
