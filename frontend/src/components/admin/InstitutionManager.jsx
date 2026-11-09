import { useEffect, useMemo, useRef, useState } from "react";
import { Button, FIELD_CLASS, Field, LocalizedFields, Status } from "./AdminFields";
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
    <section className="admin-section" aria-labelledby="institutions-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Organization directory</p>
          <h2 id="institutions-heading" className="text-2xl font-bold text-stone-900">Institutions <span className="ml-1 text-base font-medium text-stone-500">{items.length}</span></h2>
        </div>
        {!readOnly && !editing && <Button onClick={() => setEditing({})}>Add institution</Button>}
      </div>
      {readOnly && <p className="mb-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">You have read-only access. A super admin can manage institutions.</p>}

      {editing && (
        <div ref={formRef} className="scroll-mt-4">
          <InstitutionForm key={editing.id || "new"} initial={editing.id ? editing : null} saving={saving} onCancel={() => setEditing(null)} onSave={onSave} />
        </div>
      )}

      <label className="admin-table-search">
        <span className="sr-only">Search institutions</span>
        <input className={FIELD_CLASS} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, code, location, phone" />
      </label>

      <div className="admin-table-wrap admin-institution-table-wrap">
        <table className="admin-institution-table">
          <colgroup>
            <col className="admin-institution-table__name" />
            <col className="admin-institution-table__email" />
            <col className="admin-institution-table__location" />
            <col className="admin-institution-table__contact" />
            <col className="admin-institution-table__services" />
            <col className="admin-institution-table__status" />
            <col className="admin-institution-table__actions" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Institution</th>
              <th scope="col">Email / website</th>
              <th scope="col">Location</th>
              <th scope="col">Contact</th>
              <th scope="col" className="admin-institution-table__center">Services</th>
              <th scope="col">Status</th>
              <th scope="col" className="admin-institution-table__actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-table-state">Loading institutions...</td></tr>
            ) : rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="admin-institution-identity">
                    <div className="institution-logo-frame institution-logo-frame--table flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-stone-50 text-sm font-bold text-emerald-800">
                      {item.logoUrl ? <img src={assetUrl(item.logoUrl)} alt="" className="institution-logo-image h-full w-full object-contain" /> : item.name?.en?.[0] || "?"}
                    </div>
                    <div className="admin-institution-identity__text">
                      <p className="admin-institution-identity__name">{item.name?.en || "Unnamed institution"}</p>
                      <p className="admin-institution-identity__code">{item.code || "No institution code"}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="admin-institution-contact">
                    {item.email
                      ? <a href={`mailto:${item.email}`}>{item.email}</a>
                      : <span className="admin-table-muted">No email</span>}
                    {item.website
                      ? <a href={item.website} target="_blank" rel="noreferrer">Visit website <span aria-hidden="true">↗</span></a>
                      : <span className="admin-table-muted">No website</span>}
                  </div>
                </td>
                <td>{item.floorRoomNumber || <span className="admin-table-muted">Not set</span>}</td>
                <td>{item.contactPhone || <span className="admin-table-muted">Not set</span>}</td>
                <td className="admin-institution-table__center">
                  <span className="admin-service-count">{item.serviceCount ?? 0}</span>
                </td>
                <td><Status active={item.isActive} /></td>
                <td className="admin-institution-table__actions-cell">
                  <div className="admin-institution-actions">
                    {!readOnly && (
                      <>
                        <Button className="admin-table-action" variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                        {item.isActive && <Button className="admin-table-action admin-table-action--warning" variant="danger" disabled={saving} onClick={() => onDeactivate(item)}>Deactivate</Button>}
                        {!item.isActive && <Button className="admin-table-action" disabled={saving} onClick={() => onReactivate(item)}>Reactivate</Button>}
                        <Button className="admin-table-action admin-table-action--danger" variant="danger" disabled={saving} onClick={() => onDelete(item)}>Delete</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="admin-table-state">
                <strong>{items.length ? "No matching institutions" : "No institutions yet"}</strong>
                <span>{items.length ? "Try another name, code, location, or phone number." : "Create an institution to start building the directory."}</span>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}