"use client";

import { useMemo, useState } from "react";

export default function AdminAgentsClient({
  agents,
  plans,
  onUpdateStatus,
  onUpdateProfile,
  onUpdatePassword,
  onUpdateWallet,
  onUpdateSubscription
}) {
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredAgents = useMemo(() => {
    if (!normalizedQuery) return agents;
    return agents.filter((agent) => {
      const currentPlan = agent.subscriptions?.[0]?.plan?.name;
      const haystack = [
        agent.name,
        agent.email,
        agent.phone,
        agent.slug,
        agent.status,
        currentPlan
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [agents, normalizedQuery]);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Agents</h2>
            <p className="text-sm text-ink/60">Edit agent profiles, wallets, and subscriptions.</p>
          </div>
          <div className="w-full max-w-sm">
            <label className="text-xs uppercase tracking-[0.2em] text-ink/60">Search users</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or slug"
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-6">
          {filteredAgents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No users found. Try another search.
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const walletBalance = Number(agent.wallet?.balanceGhs || 0);
              const currentPlan = agent.subscriptions?.[0]?.plan;
              const isExpanded = expandedIds.includes(agent.id);
              return (
                <div key={agent.id} className="rounded-3xl border border-ink/10 bg-white/80 p-5 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Agent</p>
                      <p className="mt-1 text-lg font-semibold text-ink">{agent.name}</p>
                      <p className="text-xs text-ink/60">{agent.email}</p>
                      <p className="text-xs text-ink/60">{agent.phone || "No phone"}</p>
                      <p className="text-xs text-ink/60">Storefront: {agent.slug ? `/store/${agent.slug}` : "Pending"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Status</p>
                      <p className="mt-1 font-semibold text-ink">{agent.status}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/50">Wallet</p>
                      <p className="mt-1 font-semibold text-ink">GHS {walletBalance.toFixed(2)}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/50">Plan</p>
                      <p className="mt-1 text-xs text-ink/60">{currentPlan?.name || "None"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIds((prev) =>
                          prev.includes(agent.id)
                            ? prev.filter((id) => id !== agent.id)
                            : [...prev, agent.id]
                        )
                      }
                      className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
                    >
                      {isExpanded ? "Hide details" : "Edit details"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Profile</p>
                          <form action={onUpdateProfile} className="mt-3 grid gap-2">
                            <input type="hidden" name="agentId" value={agent.id} />
                            <input
                              name="name"
                              defaultValue={agent.name}
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                              placeholder="Full name"
                            />
                            <input
                              name="email"
                              defaultValue={agent.email}
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                              placeholder="Email"
                            />
                            <input
                              name="phone"
                              defaultValue={agent.phone || ""}
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                              placeholder="Phone"
                            />
                            <input
                              name="slug"
                              defaultValue={agent.slug || ""}
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                              placeholder="Storefront username"
                            />
                            <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                              Save profile
                            </button>
                          </form>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Status</p>
                            <form action={onUpdateStatus} className="mt-3 flex flex-wrap items-center gap-2">
                              <input type="hidden" name="agentId" value={agent.id} />
                              <select
                                name="status"
                                defaultValue={agent.status || "ACTIVE"}
                                className="rounded-full border border-ink/10 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                              </select>
                              <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                                Update status
                              </button>
                            </form>
                          </div>

                          <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Wallet balance</p>
                            <form action={onUpdateWallet} className="mt-3 grid gap-2">
                              <input type="hidden" name="agentId" value={agent.id} />
                              <input
                                name="balanceGhs"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={walletBalance}
                                className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                                placeholder="Balance (GHS)"
                              />
                              <input
                                name="reason"
                                className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                                placeholder="Reason (optional)"
                              />
                              <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                                Set balance
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Subscription</p>
                          <form action={onUpdateSubscription} className="mt-3 grid gap-2">
                            <input type="hidden" name="agentId" value={agent.id} />
                            <select
                              name="planId"
                              defaultValue={currentPlan?.id || ""}
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                            >
                              <option value="" disabled>
                                Select plan
                              </option>
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name} · GHS {Number(plan.priceGhs || 0).toFixed(2)}
                                </option>
                              ))}
                            </select>
                            <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                              Update subscription
                            </button>
                          </form>
                        </div>

                        <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Reset password</p>
                          <form action={onUpdatePassword} className="mt-3 grid gap-2">
                            <input type="hidden" name="agentId" value={agent.id} />
                            <input
                              name="password"
                              type="password"
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                              placeholder="New password"
                            />
                            <input
                              name="confirmPassword"
                              type="password"
                              className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm"
                              placeholder="Confirm password"
                            />
                            <button className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                              Update password
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
