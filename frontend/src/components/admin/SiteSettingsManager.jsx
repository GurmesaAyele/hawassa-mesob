import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button, FIELD_CLASS, Field } from "./AdminFields";
import { SkeletonForm } from "./AdminSkeleton";

function hoursToText(hours = []) {
  return hours.map((entry) => `${entry.days} | ${entry.hours}`).join("\n");
}

function textToHours(value) {
  return value.split("\n").filter((line) => line.trim()).map((line) => {
    const [days, ...hours] = line.split("|");
    return { days: days.trim(), hours: hours.join("|").trim() };
  });
}

function settingsForm(settings) {
  return {
    ...settings.contact,
    officeHoursDetailed: hoursToText(settings.contact.officeHoursDetailed),
    placeName: settings.map.placeName,
    latitude: String(settings.map.coordinates.latitude),
    longitude: String(settings.map.coordinates.longitude),
    embedUrl: settings.map.embedUrl,
    googleMapsUrl: settings.map.googleMapsUrl,
  };
}

export default function SiteSettingsManager({ readOnly = false }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setForm(settingsForm(await adminApi.siteSettings()));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    adminApi.siteSettings()
      .then((settings) => {
        if (active) setForm(settingsForm(settings));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await adminApi.updateSiteSettings({
        contact: {
          address: form.address.trim(),
          plusCode: form.plusCode.trim(),
          operatingHours: form.operatingHours.trim(),
          officeHoursDetailed: textToHours(form.officeHoursDetailed),
          phone: form.phone.trim(),
          phoneDisplay: form.phoneDisplay.trim(),
          email: form.email.trim(),
          website: form.website.trim(),
        },
        map: {
          placeName: form.placeName.trim(),
          coordinates: {
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
          },
          embedUrl: form.embedUrl.trim(),
          googleMapsUrl: form.googleMapsUrl.trim(),
        },
      });
      setForm(settingsForm(saved));
      setNotice("Contact and map settings saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="site-settings-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="site-settings-heading" className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
            Location &amp; Public Information
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Citizen contact details, operating hours, and interactive map coordinates.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-red-600 bg-red-50 p-3.5 text-xs text-red-900 rounded-r-lg">
          <p>{error}</p>
          <button type="button" onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}
      {notice && (
        <p role="status" className="border-l-4 border-emerald-700 bg-emerald-50 p-3.5 text-xs text-emerald-900 rounded-r-lg">
          {notice}
        </p>
      )}
      {readOnly && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-900 rounded-r-lg">
          You have read-only access. A super admin can update these settings.
        </p>
      )}

      {loading || !form ? (
        <SkeletonForm fields={6} />
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-8">
          <fieldset disabled={readOnly} className="space-y-8">
            <fieldset className="space-y-4">
              <div className="border-b border-stone-100 pb-2">
                <legend className="text-base font-bold text-stone-900">Contact Details</legend>
                <p className="text-xs text-stone-500">Official contact addresses displayed across the public portal</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Physical Address"><input className={FIELD_CLASS} value={form.address} onChange={(event) => update("address", event.target.value)} required /></Field>
                <Field label="Plus Code"><input className={FIELD_CLASS} value={form.plusCode} onChange={(event) => update("plusCode", event.target.value)} required /></Field>
                <Field label="Phone Number"><input className={FIELD_CLASS} type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></Field>
                <Field label="Phone Display Format"><input className={FIELD_CLASS} type="tel" value={form.phoneDisplay} onChange={(event) => update("phoneDisplay", event.target.value)} required /></Field>
                <Field label="Email Address"><input className={FIELD_CLASS} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></Field>
                <Field label="Official Website"><input className={FIELD_CLASS} type="url" value={form.website} onChange={(event) => update("website", event.target.value)} required /></Field>
              </div>
              <Field label="Operating Hours Summary"><input className={FIELD_CLASS} value={form.operatingHours} onChange={(event) => update("operatingHours", event.target.value)} required /></Field>
              <Field label="Detailed Office Hours (one per line: days | hours)">
                <textarea className={FIELD_CLASS} rows="4" value={form.officeHoursDetailed} onChange={(event) => update("officeHoursDetailed", event.target.value)} required />
              </Field>
            </fieldset>

            <fieldset className="space-y-4 border-t border-stone-100 pt-6">
              <div className="border-b border-stone-100 pb-2">
                <legend className="text-base font-bold text-stone-900">Map &amp; Geolocation</legend>
                <p className="text-xs text-stone-500">Google Maps embed and GPS pin placement for citizen navigation</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Place Name"><input className={FIELD_CLASS} value={form.placeName} onChange={(event) => update("placeName", event.target.value)} required /></Field>
                <Field label="Google Maps Place URL"><input className={FIELD_CLASS} type="url" value={form.googleMapsUrl} onChange={(event) => update("googleMapsUrl", event.target.value)} required /></Field>
                <Field label="Latitude"><input className={FIELD_CLASS} type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} required /></Field>
                <Field label="Longitude"><input className={FIELD_CLASS} type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} required /></Field>
              </div>
              <Field label="Google Maps Embed URL"><input className={FIELD_CLASS} type="url" value={form.embedUrl} onChange={(event) => update("embedUrl", event.target.value)} required /></Field>
            </fieldset>
          </fieldset>

          {!readOnly && (
            <div className="border-t border-stone-100 pt-5 flex items-center justify-end">
              <Button type="submit" disabled={saving} className="rounded-xl px-5">
                {saving ? "Saving Changes..." : "Save Public Settings"}
              </Button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
