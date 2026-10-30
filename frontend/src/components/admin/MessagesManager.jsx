import { useMemo, useState } from "react";
import { Button } from "./AdminFields";

const FILTERS = [
  ["all", "All messages"],
  ["unread", "Unread"],
  ["read", "Read"],
];

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessagesManager({ items, loading, unreadCount, onToggleRead }) {
  const [filter, setFilter] = useState("all");
  const visibleItems = useMemo(
    () => items.filter((item) => filter === "all" || item.isReviewed === (filter === "read")),
    [items, filter],
  );

  return (
    <section className="admin-section" aria-labelledby="messages-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Citizen contact inbox</p>
          <h2 id="messages-heading" className="text-2xl font-bold text-stone-900">
            Messages <span className="ml-1 text-base font-medium text-stone-500">{items.length}</span>
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900" role="status" aria-label={`${unreadCount} unread messages`}>
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {unreadCount} unread
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter messages">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`border px-3 py-2 text-sm font-semibold ${filter === value ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}
          >
            {label}{value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="border border-stone-200 bg-white px-4 py-8 text-center text-stone-500">Loading messages...</p>
      ) : visibleItems.length === 0 ? (
        <p className="border border-stone-200 bg-white px-4 py-8 text-center text-stone-500">
          {filter === "unread" ? "You’re all caught up." : "No messages found."}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <article key={item.id} className={`border bg-white p-4 md:p-5 ${item.isReviewed ? "border-stone-200" : "border-amber-300 border-l-4"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base text-stone-900 ${item.isReviewed ? "font-semibold" : "font-bold"}`}>{item.name}</h3>
                    {!item.isReviewed && <span className="bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase text-amber-900">Unread</span>}
                  </div>
                  <p className="mt-1 break-all text-sm text-emerald-800">
                    <a href={`mailto:${item.email}`}>{item.email}</a>
                    {item.phone && <span className="ml-3 text-stone-600">{item.phone}</span>}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">{formatDate(item.createdAt)}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{item.message}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onToggleRead(item, !item.isReviewed)}
                >
                  Mark as {item.isReviewed ? "unread" : "read"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {items.length >= 100 && (
        <p className="mt-3 text-xs text-stone-500">Showing the latest 100 messages.</p>
      )}
    </section>
  );
}
