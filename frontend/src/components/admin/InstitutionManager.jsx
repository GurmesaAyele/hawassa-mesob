import { useEffect, useMemo, useRef, useState } from "react";
import { Button, FIELD_CLASS, Field, LocalizedFields, Status, EmptyState } from "./AdminFields";
import { SkeletonTable } from "./AdminSkeleton";
import { assetUrl } from "../../services/adminApi";
import "../InstitutionLogo.css";

const emptyInstitution = () => ({
  name: { en: "", am: "", sid: "" },
  code: "",
  icon: "",
  email: "",
  website: "",
  description: { en: "", am: "", sid: "" },
  logoUrl: "",
  floorRoomNumber: "",
  contactPhone: "",
  isActive: true,
});

function InstitutionForm({ initial, saving, onCancel, onSave }) {
  const [form, setForm] = useState(() => initial ? {
    ...initial,
    name: { en: "", am: "", sid: "", ...initial.name },
    description: { en: "", am: "", sid: "", ...initial.description },
    icon: initial.icon || "",
    email: initial.email || "",
    website: initial.website || "",
    logoUrl: initial.logoUrl || "",
    floorRoomNumber: initial.floorRoomNumber || "",
    contactPhone: initial.contactPhone || "",
  } : emptyInstitution());
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(() => assetUrl(initial?.logoUrl));

  useEffect(() => {
    if (!logoPreview.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const changeName = (locale, value) => setForm((current) => ({
    ...current,
    name: { ...current.name, [locale]: value },
  }));

  const changeDescription = (locale, value) => setForm((current) => ({
    ...current,
    description: { ...current.description, [locale]: value },
  }));

  function selectLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((current) => ({ ...current, logo: "Choose a PNG, JPG, or WebP image." }));
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({ ...current, logo: "The logo must be 2 MB or smaller." }));
      event.target.value = "";
      return;
    }

    setErrors((current) => ({ ...current, logo: undefined }));
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.en.trim()) nextErrors.name = { en: "English name is required." };
    if (!form.code.trim()) nextErrors.code = "Institution code is required.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    const website = form.website.trim()
      ? /^https?:\/\//i.test(form.website.trim()) ? form.website.trim() : `https://${form.website.trim()}`
      : "";
    if (website) {
      try {
        const url = new URL(website);
        if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error();
      } catch {
        nextErrors.website = "Enter a valid website URL.";
      }
    }
    if (errors.logo) nextErrors.logo = errors.logo;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = new FormData();
    payload.append("name", JSON.stringify(Object.fromEntries(Object.entries(form.name).map(([locale, value]) => [locale, value.trim()]))));
    payload.append("description", JSON.stringify(Object.fromEntries(Object.entries(form.description).map(([locale, value]) => [locale, value.trim()]))));
    payload.append("code", form.code.trim());
    payload.append("email", form.email.trim());
    payload.append("website", website);
    payload.append("floorRoomNumber", form.floorRoomNumber.trim());
    payload.append("contactPhone", form.contactPhone.trim());
    payload.append("isActive", String(Boolean(form.isActive)));
    if (logoFile) payload.append("logo", logoFile);

    const saved = await onSave(payload, initial?.id);
    if (saved) onCancel();
  }

  return (
    <form onSubmit={submit} className="admin-form mb-6 space-y-5 border border-stone-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Institution record</p>
          <h3 className="mt-1 text-xl font-bold text-stone-900">{initial ? "Edit institution" : "Add institution"}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>Close</Button>
        </div>
      </div>

      <LocalizedFields label="Institution name" value={form.name} allLocales errors={errors.name} onChange={changeName} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Unique code" error={errors.code}>
          <input className={FIELD_CLASS} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="HAWASSA_WATER" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className={FIELD_CLASS} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Website" error={errors.website}>
          <input type="text" inputMode="url" className={FIELD_CLASS} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="www.example.gov.et" />
        </Field>
        <Field label="Floor or room">
          <input className={FIELD_CLASS} value={form.floorRoomNumber} onChange={(event) => setForm({ ...form, floorRoomNumber: event.target.value })} />
        </Field>
        <Field label="Contact phone">
          <input type="tel" className={FIELD_CLASS} value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
        </Field>
      </div>

      <Field label="Logo" error={errors.logo}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="institution-logo-frame institution-logo-frame--preview flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-stone-50">
            {logoPreview ? <img src={logoPreview} alt="Institution logo preview" className="institution-logo-image h-full w-full object-contain" /> : <span className="text-xs text-stone-400">No logo</span>}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} className="block min-w-0 flex-1 text-sm text-stone-600 file:mr-3 file:border-0 file:bg-emerald-800 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-900" />
          <span className="w-full text-xs text-stone-500">PNG, JPG, or WebP; maximum 2 MB.</span>
        </div>
      </Field>
      <LocalizedFields label="Description" value={form.description} allLocales multiline onChange={changeDescription} />

      <label className="flex w-fit items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
        Institution is active
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : initial ? "Save changes" : "Create institution"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function InstitutionManager({ items, loading, saving, readOnly = false, onSave, onDeactivate, onReactivate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const formRef = useRef(null);
  const rows = useMemo(() => items.filter((item) => [
    item.name?.en, item.name?.am, item.code, item.floorRoomNumber, item.contactPhone, item.email, item.website,
  ].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [items, query]);

  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing]);

  return (
    <section className="space-y-4" aria-labelledby="institutions-heading">
      {/* ─── Elevated Header & Pro Command Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="institutions-heading" className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Institutions Directory
            </h2>
            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Partner government agencies, public offices, and on-site service desks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search with embedded icon and clear button */}
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
              placeholder="Search name, code, location..."
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
              onClick={() => setEditing(emptyInstitution())}
              className="rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              <span>Add Institution</span>
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-900 rounded-r-lg">
          You have read-only access. A super admin can manage institutions.
        </p>
      )}

      {editing && (
        <div ref={formRef} className="scroll-mt-4">
          <InstitutionForm
            key={editing.id || "new"}
            initial={editing.id ? editing : null}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={onSave}
          />
        </div>
      )}

      {/* ─── Elevated Modern Data Table ─── */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Institution</th>
              <th scope="col" className="px-4 py-3.5">Location</th>
              <th scope="col" className="px-4 py-3.5">Contact / Website</th>
              <th scope="col" className="px-4 py-3.5 text-center">Services</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : rows.map((item) => (
              <tr key={item.id} className="border-t border-stone-100 hover:bg-stone-50/60 transition-colors">
                {/* Institution Name & Code */}
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white p-1 text-sm font-bold text-emerald-800 shadow-2xs overflow-hidden">
                      {item.logoUrl ? (
                        <img src={assetUrl(item.logoUrl)} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 w-full h-full flex items-center justify-center font-black rounded-lg">
                          {(item.name?.en || item.code || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 leading-snug">{item.name?.en || "Unnamed institution"}</p>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mt-0.5">
                        {item.code || "NO_CODE"}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-3.5 align-middle text-xs">
                  {item.floorRoomNumber ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100/90 border border-stone-200/60 px-2.5 py-1 font-medium text-stone-700">
                      <span>📍</span> {item.floorRoomNumber}
                    </span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>

                {/* Contact & Website */}
                <td className="px-4 py-3.5 align-middle text-xs">
                  <div className="space-y-1">
                    {item.email ? (
                      <a href={`mailto:${item.email}`} className="text-emerald-700 hover:underline flex items-center gap-1 font-medium">
                        <span>✉</span> {item.email}
                      </a>
                    ) : null}
                    {item.website ? (
                      <a href={item.website} target="_blank" rel="noreferrer" className="text-stone-500 hover:text-emerald-800 hover:underline flex items-center gap-1 text-[11px]">
                        <span>🌐</span> Visit site ↗
                      </a>
                    ) : null}
                    {item.contactPhone && !item.email ? (
                      <a href={`tel:${item.contactPhone}`} className="text-stone-600 hover:underline flex items-center gap-1">
                        <span>📞</span> {item.contactPhone}
                      </a>
                    ) : null}
                    {!item.email && !item.website && !item.contactPhone && (
                      <span className="text-stone-400">—</span>
                    )}
                  </div>
                </td>

                {/* Services Count */}
                <td className="px-4 py-3.5 align-middle text-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    (item.serviceCount ?? 0) > 0 ? "bg-sky-50 text-sky-800 border border-sky-200" : "bg-stone-100 text-stone-500"
                  }`}>
                    <span>⚡</span> {item.serviceCount ?? 0}
                  </span>
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
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onDelete(item)}
                        className="rounded-lg border border-red-200/80 bg-red-50/60 p-1.5 text-xs text-red-600 hover:bg-red-100 transition-all shadow-2xs"
                        title="Delete institution"
                      >
                        🗑
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
                    icon="building"
                    title={items.length ? "No matching institutions" : "No institutions yet"}
                    description={
                      items.length
                        ? `No institutions match "${query}". Try searching for another name, code, or floor.`
                        : "Create an institution to start building the Hawassa Mesob service directory."
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
                      ) : !readOnly ? (
                        <Button type="button" onClick={() => setEditing(emptyInstitution())}>
                          + Add First Institution
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