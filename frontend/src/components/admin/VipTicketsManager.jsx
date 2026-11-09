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

export default function VipTicketsManager() {
  const [filter, setFilter] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, "in-progress": 0, completed: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.vipTickets.list({
        status: filter === "all" ? undefined : filter,
        limit: 50,
      });
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
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId, nextStatus) => {
    setUpdatingId(ticketId);
    setError("");
    try {
      await adminApi.vipTickets.updateServiceStatus(ticketId, nextStatus);
      await fetchTickets();
    } catch (err) {
      setError(err.message || `Failed to update ticket status to ${nextStatus}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="admin-section" aria-labelledby="vip-tickets-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">VIP service queue</p>
          <h2 id="vip-tickets-heading" className="text-2xl font-bold text-stone-900">
            VIP tickets <span className="ml-1 text-base font-medium text-stone-500">{totalCount}</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchTickets}
          disabled={loading}
          className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "↻ Refresh Queue"}
        </button>
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

      <div className="overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th scope="col" className="px-4 py-3">Ticket Ref</th>
              <th scope="col" className="px-4 py-3">Citizen Contact</th>
              <th scope="col" className="px-4 py-3">Requested Services</th>
              <th scope="col" className="px-4 py-3">Issued</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && tickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-stone-500">Loading VIP queue...</td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-stone-500">No VIP tickets found in this view.</td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id || ticket.reference} className="border-t border-stone-200 hover:bg-stone-50/50">
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="font-bold text-stone-900">{ticket.reference}</span>
                    {ticket.ticketStatus && (
                      <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">
                        {ticket.ticketStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-stone-900">{ticket.person}</p>
                    <p className="text-xs text-stone-500">{ticket.phone || "No phone"} {ticket.email ? `• ${ticket.email}` : ""}</p>
                  </td>
                  <td className="px-4 py-4 text-stone-700 max-w-xs truncate" title={ticket.service}>
                    {ticket.service}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-stone-600 text-xs">
                    {formatDate(ticket.issuedAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[ticket.status] || STATUS_STYLES.pending}`}>
                      {TICKET_STATUSES.find(({ id }) => id === ticket.status)?.label || ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    {ticket.status === "pending" && (
                      <button
                        type="button"
                        disabled={updatingId === ticket.id}
                        onClick={() => handleUpdateStatus(ticket.id, "in-progress")}
                        className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        {updatingId === ticket.id ? "Updating..." : "Start Processing →"}
                      </button>
                    )}
                    {ticket.status === "in-progress" && (
                      <button
                        type="button"
                        disabled={updatingId === ticket.id}
                        onClick={() => handleUpdateStatus(ticket.id, "completed")}
                        className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {updatingId === ticket.id ? "Updating..." : "Mark Completed ✓"}
                      </button>
                    )}
                    {ticket.status === "completed" && (
                      <span className="text-xs font-medium text-emerald-800">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
