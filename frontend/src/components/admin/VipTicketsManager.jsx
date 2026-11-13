import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { EmptyState } from "./AdminFields";
import { Skeleton, SkeletonVipTable, SkeletonText } from "./AdminSkeleton";

const TICKET_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

const STATUS_STYLES = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  "in-progress": "border-sky-200 bg-sky-50 text-sky-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

function getInstName(inst) {
  if (!inst) return "";
  if (typeof inst.name === "string") return inst.name;
  if (inst.name && typeof inst.name === "object") {
    return inst.name.en || inst.name.am || inst.name.sid || inst.code || "";
  }
  return inst.code || "";
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VipTicketsManager({ currentUser, institutions = [] }) {
  const [filter, setFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, "in-progress": 0, completed: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRef, setCopiedRef] = useState(null);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [selectedTicketHistory, setSelectedTicketHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isStaff = currentUser?.role === "STAFF";
  const staffInstitution = currentUser?.institution;

  const copyRef = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase().trim();
    return tickets.filter((t) => {
      const ref = (t.reference || t.id || "").toLowerCase();
      const name = (t.person || t.fullName || "").toLowerCase();
      const phone = (t.phone || "").toLowerCase();
      const email = (t.email || "").toLowerCase();
      return ref.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [tickets, searchQuery]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        status: filter === "all" ? undefined : filter,
        limit: 50,
      };
      if (isSuperAdmin && institutionFilter !== "all") {
        params.institutionId = institutionFilter;
      }

      const response = await adminApi.vipTickets.list(params);
      setTickets(response?.data || []);
      if (response?.meta?.statusCounts) {
        setCounts(response.meta.statusCounts);
        const total = Object.values(response.meta.statusCounts).reduce((a, b) => a + b, 0);
        setTotalCount(total);
      } else {
        setTotalCount(response?.meta?.total || (response?.data || []).length);
      }
    } catch (err) {
      setError(err.message || "Failed to load VIP tickets.");
    } finally {
      setLoading(false);
    }
  }, [filter, institutionFilter, isSuperAdmin]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId, nextStatus, serviceId, uniqueKey) => {
    const key = uniqueKey || `${ticketId}:${serviceId}`;
    setUpdatingKey(key);
    setError("");
    try {
      await adminApi.vipTickets.updateServiceStatus(ticketId, nextStatus, "", serviceId);
      await fetchTickets();
    } catch (err) {
      setError(err.message || `Failed to update status to ${nextStatus}.`);
    } finally {
      setUpdatingKey(null);
    }
  };

  const viewHistory = async (ticket) => {
    setHistoryLoading(true);
    setSelectedTicketHistory({ ticket, records: [] });
    try {
      const response = await adminApi.vipTickets.getById(ticket.id);
      setSelectedTicketHistory({
        ticket: response?.data || ticket,
        records: response?.data?.history || [],
      });
    } catch (err) {
      setError(err.message || "Failed to load audit history.");
      setSelectedTicketHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="vip-tickets-heading">
      {/* ─── Compact Pro Toolbar (Unified Desk Info, Live Counts & Filters) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <h2 id="vip-tickets-heading" className="text-base font-bold text-stone-900 tracking-tight">
              VIP Queue
            </h2>
            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-900">
              {totalCount}
            </span>
          </div>

          {isStaff && staffInstitution && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-stone-100 border border-stone-200 px-2.5 py-1 text-xs text-stone-700">
              <span className="font-bold text-emerald-800">{staffInstitution.code || "Desk"}:</span>
              <span className="font-medium">{getInstName(staffInstitution)}</span>
              {staffInstitution.floorRoomNumber && (
                <span className="text-stone-400">({staffInstitution.floorRoomNumber})</span>
              )}
            </span>
          )}
        </div>

        {/* ─── Filter Tabs & Actions ─── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, citizen..."
              className="w-48 sm:w-56 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Institution Selector for Super Admin */}
          {isSuperAdmin && institutions.length > 0 && (
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 focus:border-emerald-700 focus:outline-hidden"
              aria-label="Filter by institution"
            >
              <option value="all">All Institutions ({institutions.length})</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.code} — {getInstName(inst)}
                </option>
              ))}
            </select>
          )}

          {/* Segmented Status Filter Tabs with integrated live badges */}
          <div className="inline-flex rounded-md border border-stone-200 bg-stone-100 p-0.5 text-xs" role="group" aria-label="Filter VIP tickets by status">
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition-all ${
                filter === "all"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>All</span>
              <span className="rounded-full bg-stone-200 px-1.5 py-0.2 text-[10px] font-bold">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={filter === "pending"}
              onClick={() => setFilter("pending")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition-all ${
                filter === "pending"
                  ? "bg-white text-amber-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              <span>Pending</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${filter === "pending" ? "bg-amber-100 text-amber-900" : "bg-stone-200 text-stone-700"}`}>
                {counts.pending || 0}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={filter === "in-progress"}
              onClick={() => setFilter("in-progress")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition-all ${
                filter === "in-progress"
                  ? "bg-white text-sky-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
              <span>In Progress</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${filter === "in-progress" ? "bg-sky-100 text-sky-900" : "bg-stone-200 text-stone-700"}`}>
                {counts["in-progress"] || 0}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={filter === "completed"}
              onClick={() => setFilter("completed")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition-all ${
                filter === "completed"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Completed</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${filter === "completed" ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>
                {counts.completed || 0}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 shadow-xs transition-all"
          >
            <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
            <span>{loading ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-3 border-l-4 border-red-600 bg-red-50 p-3 text-xs text-red-900">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3">Ticket Ref</th>
              <th scope="col" className="px-4 py-3">Citizen Contact</th>
              <th scope="col" className="px-4 py-3">Requested Institution Services</th>
              <th scope="col" className="px-4 py-3">Issued Date</th>
              <th scope="col" className="px-4 py-3">Overall Status</th>
              <th scope="col" className="px-4 py-3 text-right">Desk Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && tickets.length === 0 ? (
              <SkeletonVipTable rows={5} />
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-0">
                  <EmptyState
                    icon="queue"
                    title={tickets.length === 0 ? (filter === "all" ? "VIP Queue is clear" : `No ${filter} tickets in queue`) : "No matching tickets"}
                    description={
                      tickets.length === 0
                        ? "All citizen appointments for this desk are up-to-date. New incoming orders will appear here automatically."
                        : `No tickets match "${searchQuery}". Try searching for another name, phone, or ticket reference.`
                    }
                    action={
                      searchQuery ? (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-xs"
                        >
                          Clear search
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={fetchTickets}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all"
                        >
                          <span className={loading ? "inline-block animate-spin" : ""}>↻</span>
                          <span>Refresh Queue</span>
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const serviceList = ticket.services && ticket.services.length > 0
                  ? ticket.services
                  : [{ id: null, title: ticket.service, status: ticket.status }];

                return (
                  <tr key={ticket.id || ticket.reference} className="border-t border-stone-200 hover:bg-stone-50/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-stone-100 text-stone-900 px-2 py-0.5 rounded border border-stone-200">
                          {ticket.reference}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyRef(ticket.reference)}
                          title="Click to copy reference"
                          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                        >
                          {copiedRef === ticket.reference ? (
                            <span className="text-[10px] font-bold text-emerald-600">✓</span>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        {ticket.ticketStatus && (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-600">
                            {ticket.ticketStatus}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => viewHistory(ticket)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        <span>🕒</span>
                        <span>Audit Log</span>
                      </button>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-stone-900">{ticket.person}</p>
                      <p className="text-xs text-stone-500">
                        {ticket.phone || "No phone"} {ticket.email ? `• ${ticket.email}` : ""}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        {serviceList.map((svc, idx) => {
                          const svcTitle = svc.title?.en || svc.title || svc.name || "VIP Service";
                          const svcInst = svc.institution?.code || svc.institution?.name?.en || "";
                          const svcStatus = svc.status || "pending";
                          const serviceIdentifier = svc.ticketServiceId || svc.id || `svc-${idx}`;
                          const serviceKey = `${ticket.id}:${serviceIdentifier}`;
                          const isBusy = updatingKey === serviceKey;

                          return (
                            <div
                              key={serviceKey}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-200 bg-stone-50/60 p-2.5 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {svcInst && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-900">
                                      {svcInst}
                                    </span>
                                  )}
                                  <span className="font-semibold text-stone-800 truncate" title={svcTitle}>
                                    {svcTitle}
                                  </span>
                                </div>
                                {svc.completedAt && (
                                  <p className="mt-1 text-[11px] text-stone-500">
                                    Done at: {formatDate(svc.completedAt)}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`inline-flex border px-2 py-0.5 font-bold ${STATUS_STYLES[svcStatus] || STATUS_STYLES.pending}`}>
                                  {TICKET_STATUSES.find(({ id }) => id === svcStatus)?.label || svcStatus}
                                </span>

                                {/* Advance buttons per service */}
                                {svcStatus === "pending" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleUpdateStatus(ticket.id, "in-progress", svc.ticketServiceId || svc.id, serviceKey)}
                                    className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-xs"
                                  >
                                    {isBusy ? <span className="inline-block animate-spin text-[10px]">↻</span> : null}
                                    <span>{isBusy ? "Updating..." : "Start →"}</span>
                                  </button>
                                )}
                                {svcStatus === "in-progress" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleUpdateStatus(ticket.id, "completed", svc.ticketServiceId || svc.id, serviceKey)}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
                                  >
                                    {isBusy ? <span className="inline-block animate-spin text-[10px]">↻</span> : null}
                                    <span>{isBusy ? "Updating..." : "Done ✓"}</span>
                                  </button>
                                )}
                                {svcStatus === "completed" && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Served
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-xs text-stone-600 align-top">
                      {formatDate(ticket.issuedAt)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap align-top">
                      <span className={`inline-flex border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[ticket.status] || STATUS_STYLES.pending}`}>
                        {TICKET_STATUSES.find(({ id }) => id === ticket.status)?.label || ticket.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-right align-top">
                      {ticket.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                          <span>✓</span> All Done
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500">
                          {ticket.status === "in-progress" ? "Processing..." : "Queued"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Audit History Modal ─── */}
      {selectedTicketHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">
                    Audit Trail:
                  </h3>
                  <span className="font-mono font-bold text-xs bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200">
                    {selectedTicketHistory.ticket?.reference}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  Citizen: <strong>{selectedTicketHistory.ticket?.person}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketHistory(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {historyLoading ? (
                <div className="space-y-2.5 py-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-stone-100 bg-stone-50/80 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2.5 w-3/4 opacity-60" />
                    </div>
                  ))}
                </div>
              ) : selectedTicketHistory.records.length === 0 ? (
                <EmptyState
                  icon="queue"
                  title="No status changes recorded"
                  description="This ticket is in its initial queued state and has not been updated yet."
                />
              ) : (
                <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {selectedTicketHistory.records.map((rec) => (
                    <div key={rec.id} className="relative rounded-xl border border-stone-200/90 bg-white p-3.5 text-xs shadow-xs">
                      <div className="absolute -left-4.5 top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-600 ring-2 ring-emerald-100"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-500">{rec.previousStatus || "QUEUED"}</span>
                          <span className="text-stone-400">→</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase text-[11px]">
                            {rec.newStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-400">{formatDate(rec.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-stone-600">
                        Updated by: <strong className="text-stone-800">{rec.changedByName || "System"}</strong>
                      </p>
                      {rec.notes && (
                        <p className="mt-1.5 rounded-md bg-stone-50 p-2 italic text-stone-700 border border-stone-100">
                          &ldquo;{rec.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-stone-100 pt-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedTicketHistory(null)}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
