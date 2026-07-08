"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

const STATUS_OPTIONS = ["", "PAID", "CREATED", "FULFILLED", "FAILED"];
const BULK_TARGET_STATUSES = ["PAID", "FULFILLED", "FAILED"];

export default function BulkOrdersClient({ orders, pagination, onBulkUpdate }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [targetStatus, setTargetStatus] = useState("FULFILLED");
  const [bulkResult, setBulkResult] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Reset selection when orders change
  const displayedOrderIds = useMemo(() => orders.map((o) => o.id), [orders]);

  function toggleSelect(orderId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
    setSelectAll(false);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(displayedOrderIds));
      setSelectAll(true);
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectAll(false);
  }

  function handleBulkUpdate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // If specific orders are selected, use those
    if (selectedIds.size > 0) {
      selectedIds.forEach((id) => formData.append("orderIds", id));
    } else {
      // Otherwise apply to all matching the current filters
      formData.set("updateAll", "true");
      if (statusFilter) formData.set("statusFilter", statusFilter);
      if (dateFrom) formData.set("dateFrom", dateFrom);
      if (dateTo) formData.set("dateTo", dateTo);
    }

    formData.set("targetStatus", targetStatus);

    startTransition(async () => {
      setBulkResult(null);
      const result = await onBulkUpdate(formData);
      setBulkResult(result);
      if (result?.success) {
        setSelectedIds(new Set());
        setSelectAll(false);
      }
      setTimeout(() => setBulkResult(null), 5000);
    });
  }

  // Build filter links for pagination
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (search) params.set("search", search);
    return params.toString();
  }, [statusFilter, dateFrom, dateTo, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Bulk Order Status</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Select specific orders or use filters to update all matching orders at once.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-full border border-accent/10 bg-surface-card px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-accent/10"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Filter Orders</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="CREATED">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="FULFILLED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order ID, phone, name..."
              className="mt-1 w-full rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
            />
          </div>
        </div>
        {filterParams && pagination ? (
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/admin/bulk-orders?${filterParams}`}
              className="rounded-full bg-accent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-night"
            >
              Apply filters
            </Link>
            {(statusFilter || dateFrom || dateTo || search) ? (
              <Link
                href="/admin/bulk-orders"
                className="rounded-full border border-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Bulk Action Bar */}
      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Set status to</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="mt-1 block rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm font-semibold"
            >
              {BULK_TARGET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "PAID" ? "✅ PAID" : s === "FULFILLED" ? "✅ FULFILLED (Delivered)" : "❌ FAILED"}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleBulkUpdate} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="targetStatus" value={targetStatus} />
            {selectedIds.size > 0 ? (
              <>
                <p className="text-xs text-ink-muted">
                  <span className="font-semibold text-ink">{selectedIds.size}</span> order{selectedIds.size !== 1 ? "s" : ""} selected
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-night transition hover:bg-accent/90 disabled:opacity-50"
                >
                  {isPending ? "Updating..." : `Update ${selectedIds.size} selected`}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-full border border-accent/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted"
                >
                  Clear selection
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full border border-yellow-500/30 bg-yellow-500/5 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-400 transition hover:bg-yellow-500/10 disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Update all matching"}
              </button>
            )}
          </form>
        </div>

        {/* Bulk result feedback */}
        {bulkResult ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            bulkResult.success
              ? "border-accent/20 bg-accent/5 text-accent"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }`}>
            {bulkResult.success
              ? `✅ Successfully updated ${bulkResult.updatedCount} order${bulkResult.updatedCount !== 1 ? "s" : ""} to ${bulkResult.targetStatus}`
              : `❌ ${bulkResult.error}`}
          </div>
        ) : null}
      </div>

      {/* Summary cards */}
      {orders.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total shown", count: orders.length, color: "text-ink" },
            { label: "Selected", count: selectedIds.size, color: "text-accent" },
            { label: "Unpaid", count: orders.filter((o) => o.status === "CREATED").length, color: "text-yellow-400" },
            { label: "Failed", count: orders.filter((o) => o.status === "FAILED").length, color: "text-red-400" }
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-ink">{stat.count}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Orders List */}
      <div className="card-outline rounded-3xl bg-surface-card p-6">
        {orders.length > 0 ? (
          <div className="mb-4 flex items-center gap-3 border-b border-accent/10 pb-3">
            <label className="inline-flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-accent/30"
              />
              Select all on this page ({orders.length})
            </label>
            {selectedIds.size > 0 ? (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                {selectedIds.size} selected
              </span>
            ) : null}
          </div>
        ) : null}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-10 text-center text-sm text-ink-muted">
            No orders match your filters. Adjust the criteria above and click "Apply filters".
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const createdAt = order.createdAt ? new Date(order.createdAt) : null;
              const statusColor = {
                PAID: "bg-accent/10 text-accent",
                FULFILLED: "bg-green-500/10 text-green-400",
                FAILED: "bg-red-500/10 text-red-400",
                CREATED: "bg-yellow-500/10 text-yellow-400"
              }[order.status] || "bg-ink/10 text-ink-muted";

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    selectedIds.has(order.id)
                      ? "border-accent/40 bg-accent/5"
                      : "border-accent/5 bg-surface-card hover:border-accent/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="h-4 w-4 rounded border-accent/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs font-semibold text-ink truncate">{order.id}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${statusColor}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-muted">
                        <span>{order.customerPhone || "No phone"}</span>
                        <span>{order.customerName || "Guest"}</span>
                        <span>{order.agent?.name || "No agent"}</span>
                        <span>GHS {Number(order.totalAmountGhs || 0).toFixed(2)}</span>
                        <span>{createdAt ? createdAt.toLocaleString() : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-accent/10 pt-5 text-xs">
            <p className="text-ink-muted">
              Page <span className="font-semibold text-ink">{pagination.page}</span> of{" "}
              <span className="font-semibold text-ink">{pagination.totalPages}</span> ·{" "}
              <span className="font-semibold text-ink">{pagination.total}</span> total
            </p>
            <div className="flex items-center gap-2">
              {pagination.hasPrev ? (
                <Link
                  href={`/admin/bulk-orders?page=${pagination.page - 1}&${filterParams}`}
                  className="rounded-full border border-accent/10 bg-surface-card px-4 py-2 font-semibold uppercase tracking-[0.2em] text-ink"
                >
                  Prev
                </Link>
              ) : (
                <span className="rounded-full border border-accent/10 bg-surface-elevated px-4 py-2 font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  Prev
                </span>
              )}
              {pagination.hasNext ? (
                <Link
                  href={`/admin/bulk-orders?page=${pagination.page + 1}&${filterParams}`}
                  className="rounded-full bg-accent px-4 py-2 font-semibold uppercase tracking-[0.2em] text-night"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full bg-ink/20 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-night/70">
                  Next
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
