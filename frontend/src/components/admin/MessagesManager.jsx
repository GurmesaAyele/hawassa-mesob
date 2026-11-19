import { useMemo, useState } from "react";
import { Button, EmptyState } from "./AdminFields";
import { SkeletonMessageCard } from "./AdminSkeleton";

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

export default function MessagesManager({ items, loading, unreadCount, error = "", onToggleRead }) {
  const [filter, setFilter] = useState("all");
  const visibleItems = useMemo(
    () => items.filter((item) => filter === "all" || item.isReviewed === (filter === "read")),
    [items, filter],
  );

  return (
    <section className="space-y-4" aria-labelledby="messages-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="messages-heading" className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Citizen Inquiries
            </h2>
            <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">Contact form submissions and citizen feedback</p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-xs" role="status">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {unreadCount} unread
            </span>
          )}

          <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-xs shadow-2xs" role="group" aria-label="Filter messages">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`min-h-[38px] rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
                  filter === value
                    ? "bg-[#294491] text-white shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {label}{value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg border-l-4 border-red-600 bg-red-50 px-4 py-3 text-xs text-red-900">{error}</p>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMessageCard key={i} />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white">
          <EmptyState
            icon="inbox"
            title={filter === "unread" ? "Your inbox is caught up" : "No messages found"}
            description={
              filter === "unread"
                ? "There are no unread inquiries waiting for review."
                : "No citizen inquiries match this filter."
            }
            action={
              filter !== "all" ? (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
                >
                  View all messages
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border bg-white p-4 sm:p-5 transition-all shadow-xs hover:shadow-sm ${
                item.isReviewed ? "border-stone-200/90" : "border-amber-300/80 bg-amber-50/20 ring-1 ring-amber-300/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs ${
                    item.isReviewed ? "bg-stone-100 text-stone-700 border border-stone-200" : "bg-[#294491] text-white shadow-xs"
                  }`}>
                    {(item.name || "C").slice(0, 1).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm text-stone-900 ${item.isReviewed ? "font-semibold" : "font-bold"}`}>{item.name}</h3>
                      {!item.isReviewed && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 border border-amber-300">
                          New
                        </span>
                      )}
                      <span className="text-xs text-stone-400">• {formatDate(item.createdAt)}</span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                      <a href={`mailto:${item.email}`} className="text-[#294491] hover:underline font-semibold">
                        {item.email}
                      </a>
                      {item.phone && (
                        <a href={`tel:${item.phone}`} className="hover:underline text-stone-600">
                          📞 {item.phone}
                        </a>
                      )}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-stone-700 bg-stone-50/80 p-3.5 rounded-xl border border-stone-100">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${item.email}?subject=Regarding your inquiry at Hawassa Mesob`}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#294491]"
                  >
                    <span>✉ Reply</span>
                  </a>
                  {!item.isReviewed ? (
                    <Button
                      type="button"
                      variant="primary"
                      className="text-xs min-h-[38px] px-3.5 py-1.5 rounded-xl shadow-2xs"
                      onClick={() => onToggleRead(item, true)}
                    >
                      Mark read ✓
                    </Button>
                  ) : (
                    <span className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600">
                      ✓ Read
                    </span>
                  )}
                </div>
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
