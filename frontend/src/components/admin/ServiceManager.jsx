import { useMemo, useState } from "react";
import { Button, FIELD_CLASS, Field, LanguageSwitch, LocalizedFields, Status, EmptyState } from "./AdminFields";
import { SkeletonTable } from "./AdminSkeleton";

const emptyService = () => ({
  providerId: "",
  title: { en: "", am: "", sid: "" },
  description: { en: "", am: "", sid: "" },
  requirements: { en: "", am: "", sid: "" },
  estimatedFee: "",
  processingDays: "",
  isActive: true,
});

function requirementLines(requirements = []) {
  const locales = ["en", "am", "sid"];
  return Object.fromEntries(locales.map((locale) => [
    locale,
    requirements.map((item) => typeof item === "string" ? item : item?.[locale] || "").filter(Boolean).join("\n"),
  ]));
}

function ServiceForm({ initial, institutions, saving, onCancel, onSave }) {
  const [language, setLanguage] = useState("en");
  const [form, setForm] = useState(() => initial ? {
    ...initial,
    providerId: initial.institution?.id || initial.providerId || "",
    title: { en: "", am: "", sid: "", ...initial.title },
    description: { en: "", am: "", sid: "", ...initial.description },
    requirements: requirementLines(initial.requirements),
    estimatedFee: initial.estimatedFee ?? "",
    processingDays: initial.processingDays ?? "",
  } : emptyService());
  const [errors, setErrors] = useState({});

  const changeLocalized = (key, locale, value) => setForm((current) => ({
    ...current,
    [key]: { ...current[key], [locale]: value },
  }));

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.providerId) nextErrors.providerId = "Choose an institution.";
    if (!form.title.en.trim()) nextErrors.title = { en: "English title is required." };
    if (form.estimatedFee !== "" && (!Number.isFinite(Number(form.estimatedFee)) || Number(form.estimatedFee) < 0)) {
      nextErrors.estimatedFee = "Enter a non-negative fee.";
    }
    if (form.processingDays !== "" && (!Number.isInteger(Number(form.processingDays)) || Number(form.processingDays) < 0)) {
      nextErrors.processingDays = "Enter a non-negative whole number.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const requirementLists = Object.fromEntries(["en", "am", "sid"].map((locale) => [
      locale,
      form.requirements[locale].split("\n").map((line) => line.trim()),
    ]));
    const count = Math.max(...Object.values(requirementLists).map((list) => list.length));
    const requirements = Array.from({ length: count }, (_, index) => Object.fromEntries(
      ["en", "am", "sid"].map((locale) => [locale, requirementLists[locale][index] || ""]),
    )).filter((item) => Object.values(item).some(Boolean));

    const payload = {
      providerId: form.providerId,
      title: Object.fromEntries(Object.entries(form.title).map(([locale, value]) => [locale, value.trim()])),
      description: Object.fromEntries(Object.entries(form.description).map(([locale, value]) => [locale, value.trim()])),
      requirements,
      estimatedFee: form.estimatedFee === "" ? null : Number(form.estimatedFee),
      processingDays: form.processingDays === "" ? null : Number(form.processingDays),
      isActive: Boolean(form.isActive),
    };
    const saved = await onSave(payload, initial?.id);
    if (saved) onCancel();
  }

  return (
    <form onSubmit={submit} className="admin-form mb-6 space-y-5 border border-stone-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Service record</p>
          <h3 className="mt-1 text-xl font-bold text-stone-900">{initial ? "Edit service" : "Add service"}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitch value={language} onChange={setLanguage} />
          <Button type="button" variant="secondary" onClick={onCancel}>Close</Button>
        </div>
      </div>

      <Field label="Institution" error={errors.providerId}>
        <select className={FIELD_CLASS} value={form.providerId} onChange={(event) => setForm({ ...form, providerId: event.target.value })}>
          <option value="">Choose an institution</option>
          {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name?.en || institution.code}</option>)}
        </select>
      </Field>
      <LocalizedFields label="Service title" value={form.title} locale={language} errors={errors.title} onChange={(locale, value) => changeLocalized("title", locale, value)} />
      <LocalizedFields label="Description" value={form.description} locale={language} multiline onChange={(locale, value) => changeLocalized("description", locale, value)} />
      <LocalizedFields label="Requirements (one per line)" value={form.requirements} locale={language} multiline onChange={(locale, value) => changeLocalized("requirements", locale, value)} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fee (ETB), optional" error={errors.estimatedFee}>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} value={form.estimatedFee} onChange={(event) => setForm({ ...form, estimatedFee: event.target.value })} />
        </Field>
        <Field label="Processing days, optional" error={errors.processingDays}>
          <input type="number" min="0" step="1" className={FIELD_CLASS} value={form.processingDays} onChange={(event) => setForm({ ...form, processingDays: event.target.value })} />
        </Field>
      </div>
      <label className="flex w-fit items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
        Service is active
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : initial ? "Save changes" : "Create service"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function ServiceManager({ items, institutions, loading, saving, readOnly = false, onSave, onDeactivate, onReactivate }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => items.filter((item) => [
    item.title?.en, item.title?.am, item.institution?.name?.en, item.institution?.code,
  ].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [items, query]);

  return (
    <section className="space-y-4" aria-labelledby="services-heading">
      {/* ─── Elevated Header & Pro Command Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="services-heading" className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Citizen Services Catalog
            </h2>
            <span className="rounded-full bg-sky-100 border border-sky-300 px-2.5 py-0.5 text-xs font-bold text-sky-900">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Official government procedures, processing timelines, and fee schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services or institutions..."
              className="w-56 sm:w-72 rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-8 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            )}
          </div>

          {!readOnly && !editing && (
            <Button
              disabled={!institutions.length}
              onClick={() => setEditing(emptyService())}
              className="rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              <span>Add Service</span>
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-900 rounded-r-lg">
          You have read-only access. A super admin can manage services.
        </p>
      )}

      {editing && (
        <ServiceForm
          key={editing.id || "new"}
          initial={editing.id ? editing : null}
          institutions={institutions}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={onSave}
        />
      )}

      {!institutions.length && !loading && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-900 rounded-r-lg">
          Create an institution before adding services.
        </p>
      )}

      {/* ─── Elevated Modern Data Table ─── */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Service Offering</th>
              <th scope="col" className="px-4 py-3.5">Providing Institution</th>
              <th scope="col" className="px-4 py-3.5">Gov Fee</th>
              <th scope="col" className="px-4 py-3.5">Est. Timeline</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : rows.map((item) => (
              <tr key={item.id} className="border-t border-stone-100 hover:bg-stone-50/60 transition-colors">
                {/* Service Title & Description */}
                <td className="px-5 py-3.5 align-middle max-w-xs">
                  <p className="font-bold text-stone-900 leading-snug">{item.title?.en || "Untitled service"}</p>
                  {item.description?.en && (
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{item.description.en}</p>
                  )}
                </td>

                {/* Institution */}
                <td className="px-4 py-3.5 align-middle text-xs">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    {item.institution?.code || item.institution?.name?.en || "Unassigned"}
                  </span>
                </td>

                {/* Fee */}
                <td className="px-4 py-3.5 align-middle text-xs">
                  {item.estimatedFee != null ? (
                    <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {item.estimatedFee} ETB
                    </span>
                  ) : (
                    <span className="text-stone-400">Free / None</span>
                  )}
                </td>

                {/* Processing Days */}
                <td className="px-4 py-3.5 align-middle text-xs">
                  {item.processingDays != null ? (
                    <span className="inline-flex items-center gap-1 font-medium text-stone-700 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                      <span>⏱</span> {item.processingDays} {item.processingDays === 1 ? "day" : "days"}
                    </span>
                  ) : (
                    <span className="text-stone-400">Same-day</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5 align-middle">
                  <Status active={item.isActive} />
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5 align-middle text-right">
                  {!readOnly && (
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-2xs transition-all"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => item.isActive ? onDeactivate(item) : onReactivate(item)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs ${
                          item.isActive
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon="search"
                    title={items.length ? "No services match this search" : "No services registered"}
                    description={
                      items.length
                        ? `No services found matching "${query}". Try searching with different keywords.`
                        : "Add services provided by institutions in Hawassa Mesob."
                    }
                    action={
                      query ? (
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
                        >
                          Clear search
                        </button>
                      ) : !readOnly && institutions.length ? (
                        <Button type="button" onClick={() => setEditing(emptyService())}>
                          + Add First Service
                        </Button>
                      ) : null
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}