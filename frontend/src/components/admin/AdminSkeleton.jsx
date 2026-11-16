/**
 * AdminSkeleton.jsx
 * Premium, zero-layout-shift shimmer skeleton components
 * Inspired by modern AI interfaces and Neumorphic/Kinpaku design tokens.
 */

export function Skeleton({ className = "", style = {}, rounded = "rounded-md" }) {
  return (
    <div
      className={`shimmer-effect relative overflow-hidden ${rounded} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, width = "100%", className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 && lines > 1 ? "70%" : width }}
        />
      ))}
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonMetricsGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTableRow({ columns = 6 }) {
  return (
    <tr className="border-t border-stone-100">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-4 align-middle">
          {idx === 0 ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ) : idx === columns - 1 ? (
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          ) : (
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-16 opacity-70" />
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </>
  );
}

export function SkeletonVipRow() {
  return (
    <tr className="border-t border-stone-100">
      {/* Ref */}
      <td className="px-4 py-4 align-top">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-3 w-20" />
      </td>

      {/* Citizen Contact */}
      <td className="px-4 py-4 align-top">
        <Skeleton className="h-4 w-36 mb-1.5" />
        <Skeleton className="h-3 w-44" />
      </td>

      {/* Services */}
      <td className="px-4 py-4 align-top">
        <div className="rounded-lg border border-stone-100 bg-stone-50/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-24" />
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-4 align-top">
        <Skeleton className="h-3.5 w-24 mb-1" />
        <Skeleton className="h-2.5 w-16 opacity-60" />
      </td>

      {/* Overall Status */}
      <td className="px-4 py-4 align-top">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>

      {/* Actions */}
      <td className="px-4 py-4 align-top text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonVipTable({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonVipRow key={i} />
      ))}
    </>
  );
}

export function SkeletonMessageCard() {
  return (
    <article className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-2.5 w-28 opacity-70" />
      <SkeletonText lines={3} className="pt-2" />
    </article>
  );
}

export function SkeletonForm({ fields = 4 }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-5">
      <div className="border-b border-stone-100 pb-4">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

