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
      {/* ─── Dedicated Desk Header Banner (for Staff) ─── */}
      {isStaff && staffInstitution && (
        <div className="mb-6 rounded-lg border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-stone-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-800 text-lg font-bold text-white shadow-sm">
                {staffInstitution.code || "🏛️"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-emerald-950">
                    {staffInstitution.name?.en || staffInstitution.name || staffInstitution.code} Desk
                  </h3>
                  <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Desk Officer
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-600">
                  {staffInstitution.floorRoomNumber ? `Counter / Location: ${staffInstitution.floorRoomNumber} • ` : ""}
                  Logged in as <strong>{currentUser?.name || currentUser?.email}</strong>
                </p>
              </div>
            </div>
            <div className="rounded border border-emerald-200 bg-white/90 px-3.5 py-2 text-right shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Assigned Queue</p>
              <p className="text-xl font-bold text-stone-900">{totalCount} orders</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Super Admin Controls Header ─── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">
            {isStaff ? "Institution VIP Queue" : "VIP service queue oversight"}
          </p>
          <h2 id="vip-tickets-heading" className="text-2xl font-bold text-stone-900">
            VIP tickets <span className="ml-1 text-base font-medium text-stone-500">{totalCount}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Institution Selector for Super Admin */}
          {isSuperAdmin && institutions.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="vip-institution-filter" className="text-xs font-semibold text-stone-600">
                Institution:
              </label>
              <select
                id="vip-institution-filter"
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-xs focus:border-emerald-700 focus:outline-hidden"
              >
                <option value="all">All Institutions ({institutions.length})</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.code} — {inst.name?.en || inst.name || inst.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh Queue"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="VIP ticket totals by status">
        {TICKET_STATUSES.map(({ id, label }) => (
          <article key={id} className="border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-600">{label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{counts[id] || 0}</p>
          </article>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter VIP tickets">
        <button
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
          className={`border px-3 py-2 text-sm font-semibold ${filter === "all" ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}
        >
          All tickets ({totalCount})
        </button>
        {TICKET_STATUSES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`border px-3 py-2 text-sm font-semibold ${filter === id ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}
          >
            {label} ({counts[id] || 0})
          </button>
        ))}
      </div>

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
