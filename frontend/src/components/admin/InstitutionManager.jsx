import { useEffect, useMemo, useRef, useState } from "react";
import { Button, FIELD_CLASS, Field, LocalizedFields, Status } from "./AdminFields";
import { assetUrl } from "../../services/adminApi";

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
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-stone-50">
            {logoPreview ? <img src={logoPreview} alt="Institution logo preview" className="h-full w-full object-contain" /> : <span className="text-xs text-stone-400">No logo</span>}
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

export default function InstitutionManager({ items, loading, saving, onSave, onDeactivate, onDelete }) {
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
        {!editing && <Button onClick={() => setEditing({})}>Add institution</Button>}
      </div>

      {editing && (
        <div ref={formRef} className="scroll-mt-4">
          <InstitutionForm key={editing.id || "new"} initial={editing.id ? editing : null} saving={saving} onCancel={() => setEditing(null)} onSave={onSave} />
        </div>
      )}

      <label className="mb-3 block max-w-sm">
        <span className="sr-only">Search institutions</span>
        <input className={FIELD_CLASS} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, code, location, phone" />
      </label>

      <div className="admin-table-wrap overflow-x-auto border border-stone-200 bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Email / website</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-stone-500">Loading institutions...</td></tr>
            ) : rows.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-stone-50 text-sm font-bold text-emerald-800">
                      {item.logoUrl ? <img src={assetUrl(item.logoUrl)} alt="" className="h-full w-full object-contain" /> : item.name?.en?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{item.name?.en || "Unnamed institution"}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{item.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  <p>{item.email || "-"}</p>
                  {item.website && <a className="text-emerald-800 underline" href={item.website} target="_blank" rel="noreferrer">Website</a>}
                </td>
                <td className="px-4 py-3 text-stone-600">{item.floorRoomNumber || "-"}</td>
                <td className="px-4 py-3 text-stone-600">{item.contactPhone || "-"}</td>
                <td className="px-4 py-3 text-stone-600">{item.serviceCount ?? 0}</td>
                <td className="px-4 py-3"><Status active={item.isActive} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                    {item.isActive && <Button variant="danger" disabled={saving} onClick={() => onDeactivate(item)}>Deactivate</Button>}
                    <Button variant="danger" disabled={saving} onClick={() => onDelete(item)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-stone-500">{items.length ? "No institutions match this search." : "No institutions found."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}