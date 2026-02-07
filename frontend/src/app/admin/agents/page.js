import { revalidatePath } from "next/cache";
import AdminAgentsClient from "./AdminAgentsClient";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateAgentStatus(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!agentId || !status) return { error: "Missing fields" };
  try {
    await serverApi(`/admin/agents/${agentId}/status`, {
      method: "PATCH",
      body: { status }
    });
    revalidatePath("/admin/agents");
    return { success: true };
  } catch (error) {
    return { error: error.message || "Failed to update status" };
  }
}

async function updateAgentProfile(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  if (!agentId) return { error: "Missing agent ID" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  try {
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
    return { success: true };
  } catch (error) {
    return { error: error.message || "Failed to update profile" };
  }
}

async function updateAgentPassword(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirm = String(formData.get("confirmPassword") || "").trim();
  if (!agentId || !password) return { error: "Password is required" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };
  if (password !== confirm) return { error: "Passwords do not match" };
  try {
    await serverApi(`/admin/agents/${agentId}/password`, {
      method: "PATCH",
      body: { password }
    });
    revalidatePath("/admin/agents");
    return { success: true };
  } catch (error) {
    return { error: error.message || "Failed to update password" };
  }
}

async function updateAgentWallet(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const balanceRaw = String(formData.get("balanceGhs") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const balanceGhs = Number(balanceRaw);
  if (!agentId || !Number.isFinite(balanceGhs)) return { error: "Invalid balance" };
  try {
    await serverApi(`/admin/agents/${agentId}/wallet`, {
      method: "PATCH",
      body: { balanceGhs, ...(reason ? { reason } : {}) }
    });
    revalidatePath("/admin/agents");
    return { success: true };
  } catch (error) {
    return { error: error.message || "Failed to update wallet" };
  }
}

async function updateAgentSubscription(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  const planId = String(formData.get("planId") || "").trim();
  if (!agentId || !planId) return { error: "Missing fields" };
  try {
    await serverApi(`/admin/agents/${agentId}/subscription`, {
      method: "PATCH",
      body: { planId }
    });
    revalidatePath("/admin/agents");
    return { success: true };
  } catch (error) {
    return { error: error.message || "Failed to update subscription" };
  }
}

async function deleteAgentAction(formData) {
  "use server";
  const agentId = String(formData.get("agentId") || "").trim();
  if (!agentId) return { error: "Missing agent ID" };
  try {
    await serverApi(`/admin/agents/${agentId}`, { method: "DELETE" });
    revalidatePath("/admin/agents");
    return { success: true };
  } catch (error) {
    return { error: error.message || "Failed to delete agent" };
  }
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
      onDeleteAgent={deleteAgentAction}
    />
  );
}
