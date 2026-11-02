import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button, FIELD_CLASS, Field } from "./AdminFields";

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

export default function SiteSettingsManager() {
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
    <section className="admin-section" aria-labelledby="site-settings-heading">
      <div className="mb-5">
        <p className="text-sm text-stone-500">Public site information</p>
        <h2 id="site-settings-heading" className="text-2xl font-bold text-stone-900">Location &amp; contact</h2>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p>{error}</p>
          <button type="button" onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}
      {notice && <p role="status" className="mb-4 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

      {loading || !form ? (
        <p role="status" className="border border-stone-200 bg-white px-4 py-8 text-center text-stone-500">Loading site settings...</p>
      ) : (
        <form onSubmit={submit} className="admin-form space-y-6 border border-stone-200 bg-white p-5 md:p-6">
          <fieldset className="space-y-4">
            <legend className="mb-3 text-lg font-bold text-stone-900">Contact details</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Address"><input className={FIELD_CLASS} value={form.address} onChange={(event) => update("address", event.target.value)} required /></Field>
              <Field label="Plus code"><input className={FIELD_CLASS} value={form.plusCode} onChange={(event) => update("plusCode", event.target.value)} required /></Field>
              <Field label="Phone number"><input className={FIELD_CLASS} type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></Field>
              <Field label="Phone display format"><input className={FIELD_CLASS} type="tel" value={form.phoneDisplay} onChange={(event) => update("phoneDisplay", event.target.value)} required /></Field>
              <Field label="Email"><input className={FIELD_CLASS} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></Field>
              <Field label="Website"><input className={FIELD_CLASS} type="url" value={form.website} onChange={(event) => update("website", event.target.value)} required /></Field>
            </div>
            <Field label="Operating hours summary"><input className={FIELD_CLASS} value={form.operatingHours} onChange={(event) => update("operatingHours", event.target.value)} required /></Field>
            <Field label="Detailed office hours (one per line: days | hours)">
              <textarea className={FIELD_CLASS} rows="4" value={form.officeHoursDetailed} onChange={(event) => update("officeHoursDetailed", event.target.value)} required />
            </Field>
          </fieldset>

          <fieldset className="space-y-4 border-t border-stone-200 pt-5">
            <legend className="mb-3 text-lg font-bold text-stone-900">Map location</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Place name"><input className={FIELD_CLASS} value={form.placeName} onChange={(event) => update("placeName", event.target.value)} required /></Field>
              <Field label="Google Maps place URL"><input className={FIELD_CLASS} type="url" value={form.googleMapsUrl} onChange={(event) => update("googleMapsUrl", event.target.value)} required /></Field>
              <Field label="Latitude"><input className={FIELD_CLASS} type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} required /></Field>
              <Field label="Longitude"><input className={FIELD_CLASS} type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} required /></Field>
            </div>
            <Field label="Google Maps embed URL"><input className={FIELD_CLASS} type="url" value={form.embedUrl} onChange={(event) => update("embedUrl", event.target.value)} required /></Field>
          </fieldset>

          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save contact and map settings"}</Button>
        </form>
      )}
    </section>
  );
}
