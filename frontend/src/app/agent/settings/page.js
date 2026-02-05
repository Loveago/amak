import { revalidatePath } from "next/cache";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function updateAgentSettings(formData) {
  "use server";
  const whatsappLink = String(formData.get("whatsappLink") || "").trim();
  await serverApi("/agent/profile", {
    method: "PATCH",
    body: { whatsappLink }
  });
  revalidatePath("/agent/settings");
}

export default async function AgentSettingsPage() {
  requireAgent("/agent/settings");
  let profile = null;
  try {
    profile = await serverApi("/agent/profile");
  } catch (error) {
    profile = null;
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Settings</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Storefront contact</h2>
        <p className="mt-3 text-sm text-ink/70">
          Add your WhatsApp contact so shoppers can reach you quickly from your storefront.
        </p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <form action={updateAgentSettings} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
              WhatsApp link or phone
            </label>
            <input
              name="whatsappLink"
              defaultValue={profile?.whatsappLink || ""}
              placeholder="e.g. +233240000000 or https://wa.me/233240000000"
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            />
            <p className="mt-2 text-xs text-ink/50">
              We will format it automatically. Leave empty to hide the WhatsApp bubble.
            </p>
          </div>
          <button className="w-full rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Save settings
          </button>
        </form>
      </div>
    </div>
  );
}
