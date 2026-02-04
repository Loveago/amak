import { revalidatePath } from "next/cache";
import AdminAgentsClient from "./AdminAgentsClient";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateAgentStatus(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!agentId || !status) {
    return;
  }
  await serverApi(`/admin/agents/${agentId}/status`, {
    method: "PATCH",
    body: { status }
  });
  revalidatePath("/admin/agents");
}

async function updateAgentProfile(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  if (!agentId) return;

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  await serverApi(`/admin/agents/${agentId}`, {
    method: "PATCH",
    body: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(slug ? { slug } : {})
    }
  });
  revalidatePath("/admin/agents");
}

async function updateAgentPassword(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirm = String(formData.get("confirmPassword") || "").trim();
  if (!agentId || !password || password !== confirm) {
    return;
  }
  await serverApi(`/admin/agents/${agentId}/password`, {
    method: "PATCH",
    body: { password }
  });
  revalidatePath("/admin/agents");
}

async function updateAgentWallet(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const balanceRaw = String(formData.get("balanceGhs") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const balanceGhs = Number(balanceRaw);
  if (!agentId || !Number.isFinite(balanceGhs)) {
    return;
  }
  await serverApi(`/admin/agents/${agentId}/wallet`, {
    method: "PATCH",
    body: { balanceGhs, ...(reason ? { reason } : {}) }
  });
  revalidatePath("/admin/agents");
}

async function updateAgentSubscription(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const planId = String(formData.get("planId") || "").trim();
  if (!agentId || !planId) {
    return;
  }
  await serverApi(`/admin/agents/${agentId}/subscription`, {
    method: "PATCH",
    body: { planId }
  });
  revalidatePath("/admin/agents");
}

export default async function AdminAgentsPage() {
  requireAdmin("/admin/agents");
  let agents = [];
  let plans = [];
  try {
    agents = await serverApi("/admin/agents");
  } catch (error) {
    agents = [];
  }
  try {
    plans = await serverApi("/admin/plans");
  } catch (error) {
    plans = [];
  }
  return (
    <AdminAgentsClient
      agents={agents}
      plans={plans}
      onUpdateStatus={updateAgentStatus}
      onUpdateProfile={updateAgentProfile}
      onUpdatePassword={updateAgentPassword}
      onUpdateWallet={updateAgentWallet}
      onUpdateSubscription={updateAgentSubscription}
    />
  );
}
