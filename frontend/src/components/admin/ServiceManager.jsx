import { useMemo, useState } from "react";
import { Button, FIELD_CLASS, Field, LanguageSwitch, LocalizedFields, Status } from "./AdminFields";

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

export default function ServiceManager({ items, institutions, loading, saving, onSave, onDeactivate }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => items.filter((item) => [
    item.title?.en, item.title?.am, item.institution?.name?.en, item.institution?.code,
  ].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [items, query]);

  return (
    <section className="admin-section" aria-labelledby="services-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Catalog management</p>
          <h2 id="services-heading" className="text-2xl font-bold text-stone-900">Services <span className="ml-1 text-base font-medium text-stone-500">{items.length}</span></h2>
        </div>
        {!editing && <Button disabled={!institutions.length} onClick={() => setEditing({})}>Add service</Button>}
      </div>

      {editing && <ServiceForm key={editing.id || "new"} initial={editing.id ? editing : null} institutions={institutions} saving={saving} onCancel={() => setEditing(null)} onSave={onSave} />}
      {!institutions.length && !loading && <p className="mb-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">Create an institution before adding services.</p>}

      <label className="mb-3 block max-w-sm">
        <span className="sr-only">Search services</span>
        <input className={FIELD_CLASS} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by service or institution" />
      </label>

      <div className="admin-table-wrap overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Processing</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">Loading services...</td></tr>
            ) : rows.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-stone-900">{item.title?.en || "Untitled service"}</p>
                  <p className="mt-0.5 max-w-sm truncate text-xs text-stone-500">{item.description?.en}</p>
                </td>
                <td className="px-4 py-3 text-stone-600">{item.institution?.name?.en || item.institution?.code || "-"}</td>
                <td className="px-4 py-3 text-stone-600">{item.estimatedFee == null ? "-" : `${item.estimatedFee} ETB`}</td>
                <td className="px-4 py-3 text-stone-600">{item.processingDays == null ? "-" : `${item.processingDays} days`}</td>
                <td className="px-4 py-3"><Status active={item.isActive} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                    {item.isActive && <Button variant="danger" disabled={saving} onClick={() => onDeactivate(item)}>Deactivate</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">{items.length ? "No services match this search." : "No services found."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}