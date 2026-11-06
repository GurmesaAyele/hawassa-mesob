import { useMemo, useState } from "react";

const TICKET_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

const DEMO_TICKETS = [
  {
    reference: "VIP-2026-001",
    person: "Demo Applicant A",
    service: "Business license support",
    issuedAt: "2026-11-04T09:30:00",
    status: "pending",
  },
  {
    reference: "VIP-2026-002",
    person: "Demo Applicant B",
    service: "Land administration",
    issuedAt: "2026-11-04T10:15:00",
    status: "in-progress",
  },
  {
    reference: "VIP-2026-003",
    person: "Demo Applicant C",
    service: "Investment information",
    issuedAt: "2026-11-03T14:00:00",
    status: "completed",
  },
];

const STATUS_STYLES = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  "in-progress": "border-sky-200 bg-sky-50 text-sky-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VipTicketsManager() {
  const [filter, setFilter] = useState("all");
  const counts = useMemo(
    () => Object.fromEntries(
      TICKET_STATUSES.map(({ id }) => [id, DEMO_TICKETS.filter((ticket) => ticket.status === id).length]),
    ),
    [],
  );
  const visibleTickets = useMemo(
    () => DEMO_TICKETS.filter((ticket) => filter === "all" || ticket.status === filter),
    [filter],
  );

  return (
    <section className="admin-section" aria-labelledby="vip-tickets-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">VIP service queue</p>
          <h2 id="vip-tickets-heading" className="text-2xl font-bold text-stone-900">
            VIP tickets <span className="ml-1 text-base font-medium text-stone-500">{DEMO_TICKETS.length}</span>
          </h2>
        </div>
        <span className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Demo data — awaiting backend API
        </span>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="VIP ticket totals by status">
        {TICKET_STATUSES.map(({ id, label }) => (
          <article key={id} className="border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-600">{label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{counts[id]}</p>
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
          All tickets ({DEMO_TICKETS.length})
        </button>
        {TICKET_STATUSES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`border px-3 py-2 text-sm font-semibold ${filter === id ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}
          >
            {label} ({counts[id]})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th scope="col" className="px-4 py-3">Ticket</th>
              <th scope="col" className="px-4 py-3">VIP person</th>
              <th scope="col" className="px-4 py-3">Requested service</th>
              <th scope="col" className="px-4 py-3">Issued</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map((ticket) => (
              <tr key={ticket.reference} className="border-t border-stone-200">
                <td className="whitespace-nowrap px-4 py-4 font-semibold text-stone-900">{ticket.reference}</td>
                <td className="px-4 py-4 font-medium text-stone-800">{ticket.person}</td>
                <td className="px-4 py-4 text-stone-700">{ticket.service}</td>
                <td className="whitespace-nowrap px-4 py-4 text-stone-600">{formatDate(ticket.issuedAt)}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[ticket.status]}`}>
                    {TICKET_STATUSES.find(({ id }) => id === ticket.status)?.label}
                  </span>
                </td>
              </tr>
            ))}
            {visibleTickets.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-stone-500">No VIP tickets in this status.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
