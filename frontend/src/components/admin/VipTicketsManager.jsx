import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";

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
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [selectedTicketHistory, setSelectedTicketHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isStaff = currentUser?.role === "STAFF";
  const staffInstitution = currentUser?.institution;

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

  const handleUpdateStatus = async (ticketId, nextStatus, serviceId) => {
    setUpdatingServiceId(serviceId || ticketId);
    setError("");
    try {
      await adminApi.vipTickets.updateServiceStatus(ticketId, nextStatus, "", serviceId);
      await fetchTickets();
    } catch (err) {
      setError(err.message || `Failed to update status to ${nextStatus}.`);
    } finally {
      setUpdatingServiceId(null);
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
    <section className="admin-section" aria-labelledby="vip-tickets-heading">
      {/* ─── Compact Pro Toolbar (Unified Desk Info, Live Counts & Filters) ─── */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 shadow-xs">
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
              <span className="font-medium">{staffInstitution.name?.en || staffInstitution.name || staffInstitution.code}</span>
              {staffInstitution.floorRoomNumber && (
                <span className="text-stone-400">({staffInstitution.floorRoomNumber})</span>
              )}
            </span>
          )}
        </div>

        {/* ─── Filter Tabs & Actions ─── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Institution Selector for Super Admin */}
          {isSuperAdmin && institutions.length > 0 && (
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 focus:border-emerald-700 focus:outline-hidden"
              aria-label="Filter by institution"
            >
              <option value="all">All Institutions ({institutions.length})</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.code} — {inst.name?.en || inst.name || inst.code}
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
            className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 shadow-xs"
          >
            {loading ? "..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-3 border-l-4 border-red-600 bg-red-50 p-3 text-xs text-red-900">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto border border-stone-200 bg-white shadow-xs">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
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
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-stone-500">
                  Loading verified VIP orders...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-stone-500">
                  No VIP tickets found for this view.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const serviceList = ticket.services && ticket.services.length > 0
                  ? ticket.services
                  : [{ id: null, title: ticket.service, status: ticket.status }];

                return (
                  <tr key={ticket.id || ticket.reference} className="border-t border-stone-200 hover:bg-stone-50/50">
                    <td className="whitespace-nowrap px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{ticket.reference}</span>
                        {ticket.ticketStatus && (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-600">
                            {ticket.ticketStatus}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => viewHistory(ticket)}
                        className="mt-1.5 inline-block text-xs font-medium text-emerald-700 hover:underline"
                      >
                        🕒 View Audit Log
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
                          const svcStatus = svc.status || ticket.status || "pending";
                          const isBusy = updatingServiceId === (svc.id || ticket.id);

                          return (
                            <div
                              key={svc.id || idx}
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
                                    onClick={() => handleUpdateStatus(ticket.id, "in-progress", svc.id)}
                                    className="rounded bg-sky-600 px-2.5 py-1 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                                  >
                                    {isBusy ? "..." : "Start →"}
                                  </button>
                                )}
                                {svcStatus === "in-progress" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleUpdateStatus(ticket.id, "completed", svc.id)}
                                    className="rounded bg-emerald-700 px-2.5 py-1 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                                  >
                                    {isBusy ? "..." : "Done ✓"}
                                  </button>
                                )}
                                {svcStatus === "completed" && (
                                  <span className="text-[11px] font-bold text-emerald-800">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Ticket Audit Trail: {selectedTicketHistory.ticket?.reference}
                </h3>
                <p className="text-xs text-stone-500">
                  Citizen: {selectedTicketHistory.ticket?.person}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketHistory(null)}
                className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {historyLoading ? (
                <p className="py-6 text-center text-sm text-stone-500">Loading audit history...</p>
              ) : selectedTicketHistory.records.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-500">No status changes recorded yet.</p>
              ) : (
                selectedTicketHistory.records.map((rec) => (
                  <div key={rec.id} className="rounded border border-stone-200 bg-stone-50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">
                        {rec.previousStatus || "START"} → <span className="text-emerald-700">{rec.newStatus}</span>
                      </span>
                      <span className="text-stone-500">{formatDate(rec.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-stone-600">
                      Officer: <strong>{rec.changedByName || "System"}</strong>
                    </p>
                    {rec.notes && (
                      <p className="mt-1 italic text-stone-700">Note: &ldquo;{rec.notes}&rdquo;</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-stone-200 pt-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedTicketHistory(null)}
                className="rounded border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
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
