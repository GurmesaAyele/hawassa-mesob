import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button, FIELD_CLASS, Field, LocalizedFields } from "./AdminFields";

const CONTENT_TYPES = [
  ["news", "News"],
  ["announcements", "Announcements"],
  ["videos", "YouTube videos"],
];
const LOCALES = ["en", "am", "sid"];

function localizedValue(value) {
  if (typeof value === "string") return { en: value, am: value, sid: value };
  return { en: "", am: "", sid: "", ...value };
}

function articleForm(initial, category) {
  return {
    title: localizedValue(initial?.title),
    content: localizedValue(initial?.content),
    date: (initial?.publishedAt || initial?.date || "").slice(0, 10),
    image: initial?.imageUrl || initial?.image || "",
    author: initial?.author || "",
    priority: initial?.priority || "medium",
    type: initial?.category || initial?.type || "general",
    ...(category === "videos" && {
      title: localizedValue(initial?.titleTranslations || initial?.title),
      content: localizedValue(initial?.descriptionTranslations || initial?.description),
      videoCategory: localizedValue(initial?.category),
      videoAuthor: localizedValue(initial?.author),
      youtubeUrl: initial?.youtubeUrl || "",
      thumbnail: initial?.thumbnail || "",
      duration: initial?.duration || "",
      views: initial?.views || "",
    }),
  };
}

function ContentForm({ category, initial, saving, onCancel, onSave }) {
  const [form, setForm] = useState(() => articleForm(initial, category));
  const [error, setError] = useState("");
  const isVideo = category === "videos";
  const isAnnouncement = category === "announcements";

  function updateLocalized(key, locale, value) {
    setForm((current) => ({ ...current, [key]: { ...current[key], [locale]: value } }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isVideo) {
      if (!form.title.en.trim()) return setError("Enter an English video title.");
      if (!form.youtubeUrl.trim()) return setError("Enter a YouTube URL.");
    } else {
      if (!form.title.en.trim()) return setError("Enter an English title.");
      if (!form.content.en.trim()) return setError("Enter English content.");
    }

    const date = form.date ? new Date(`${form.date}T00:00:00.000Z`).toISOString() : undefined;
    const payload = isVideo
      ? {
          title: Object.fromEntries(LOCALES.map((locale) => [locale, form.title[locale].trim()])),
          youtubeUrl: form.youtubeUrl.trim(),
          description: Object.fromEntries(LOCALES.map((locale) => [locale, form.content[locale].trim()])),
          category: Object.fromEntries(LOCALES.map((locale) => [locale, form.videoCategory[locale].trim()])),
          author: Object.fromEntries(LOCALES.map((locale) => [locale, form.videoAuthor[locale].trim()])),
          duration: form.duration.trim(),
          views: form.views.trim(),
          thumbnail: form.thumbnail.trim() || null,
          date,
        }
      : {
          title: Object.fromEntries(LOCALES.map((locale) => [locale, form.title[locale].trim()])),
          content: Object.fromEntries(LOCALES.map((locale) => [locale, form.content[locale].trim()])),
          image: form.image.trim() || null,
          ...(category === "news" && { author: form.author.trim(), category: form.type.trim() }),
          ...(isAnnouncement && { priority: form.priority, type: form.type }),
          date,
        };

    const saved = await onSave(payload, initial?.id);
    if (saved) onCancel();
  }

  return (
    <form onSubmit={submit} className="admin-form mb-6 space-y-5 border border-stone-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Homepage content</p>
          <h3 className="mt-1 text-xl font-bold text-stone-900">{initial ? "Edit item" : "Add item"}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>Close</Button>
        </div>
      </div>

      {isVideo ? (
        <>
          <LocalizedFields label="Video title" value={form.title} allLocales onChange={(locale, value) => updateLocalized("title", locale, value)} />
          <Field label="YouTube URL">
            <input className={FIELD_CLASS} type="url" placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} />
          </Field>
          <LocalizedFields label="Description (optional)" value={form.content} allLocales multiline onChange={(locale, value) => updateLocalized("content", locale, value)} />
          <LocalizedFields label="Category (optional)" value={form.videoCategory} allLocales onChange={(locale, value) => updateLocalized("videoCategory", locale, value)} />
          <LocalizedFields label="Author (optional)" value={form.videoAuthor} allLocales onChange={(locale, value) => updateLocalized("videoAuthor", locale, value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Duration (optional)">
              <input className={FIELD_CLASS} value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="15:32" />
            </Field>
            <Field label="Views (optional)">
              <input className={FIELD_CLASS} value={form.views} onChange={(event) => setForm({ ...form, views: event.target.value })} placeholder="1.3M views" />
            </Field>
            <Field label="Thumbnail URL or site path (optional)">
              <input className={FIELD_CLASS} value={form.thumbnail} onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} />
            </Field>
          </div>
        </>
      ) : (
        <>
          <LocalizedFields label="Title" value={form.title} allLocales onChange={(locale, value) => updateLocalized("title", locale, value)} />
          <LocalizedFields label="Content" value={form.content} allLocales multiline onChange={(locale, value) => updateLocalized("content", locale, value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Image URL or site path (optional)">
              <input className={FIELD_CLASS} value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
            </Field>
            {category === "news" && (
              <>
                <Field label="Author (optional)">
                  <input className={FIELD_CLASS} value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} />
                </Field>
                <Field label="Category">
                  <input className={FIELD_CLASS} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
                </Field>
              </>
            )}
          </div>
          {isAnnouncement && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Priority">
                <select className={FIELD_CLASS} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>
              <Field label="Type">
                <select className={FIELD_CLASS} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option value="event">Event</option>
                  <option value="update">Update</option>
                  <option value="alert">Alert</option>
                  <option value="general">General</option>
                </select>
              </Field>
            </div>
          )}
        </>
      )}

      <Field label="Publication date (optional)">
        <input className={FIELD_CLASS} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      </Field>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : initial ? "Save changes" : "Publish"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function displayTitle(item) {
  if (typeof item.title === "string") return item.title;
  return item.title?.en || item.title?.am || item.title?.sid || "Untitled";
}

export default function HomeContentManager() {
  const [category, setCategory] = useState("news");
  const [records, setRecords] = useState({ news: [], announcements: [], videos: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [news, announcements, videos] = await Promise.all([
        adminApi.news(),
        adminApi.announcements(),
        adminApi.videos(),
      ]);
      setRecords({ news, announcements, videos });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.news(), adminApi.announcements(), adminApi.videos()])
      .then(([news, announcements, videos]) => {
        if (active) setRecords({ news, announcements, videos });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function save(payload, id) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (category === "news") {
        await (id ? adminApi.updateNews(id, payload) : adminApi.createNews(payload));
      } else if (category === "announcements") {
        await (id ? adminApi.updateAnnouncement(id, payload) : adminApi.createAnnouncement(payload));
      } else {
        await (id ? adminApi.updateVideo(id, payload) : adminApi.createVideo(payload));
      }
      setNotice("Homepage content saved.");
      setEditing(null);
      await refresh();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${displayTitle(item)}"? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      if (category === "news") await adminApi.deleteNews(item.id);
      else if (category === "announcements") await adminApi.deleteAnnouncement(item.id);
      else await adminApi.deleteVideo(item.id);
      setNotice("Homepage content deleted.");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const items = records[category];
  const categoryLabel = CONTENT_TYPES.find(([id]) => id === category)?.[1];

  return (
    <section className="admin-section" aria-labelledby="home-content-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Homepage publishing</p>
          <h2 id="home-content-heading" className="text-2xl font-bold text-stone-900">Home content</h2>
        </div>
        {!editing && <Button onClick={() => setEditing({})}>Add {category === "videos" ? "video" : category === "news" ? "news" : "announcement"}</Button>}
      </div>

      {error && (
        <div role="alert" className="admin-callout admin-callout--error mb-4 px-4 py-3 text-sm text-red-900">
          <p>{error}</p>
          <button type="button" onClick={refresh} className="mt-2 font-semibold underline">Retry</button>
        </div>
      )}
      {notice && <p role="status" className="admin-callout admin-callout--success mb-4 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Homepage content types">
        {CONTENT_TYPES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={category === id}
            onClick={() => { setCategory(id); setEditing(null); setNotice(""); }}
            className={`rounded border px-4 py-2 text-sm font-semibold ${category === id ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}
          >
            {label} ({records[id].length})
          </button>
        ))}
      </div>

      {editing && (
        <ContentForm
          key={`${category}-${editing.id || "new"}`}
          category={category}
          initial={editing.id ? editing : null}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {loading ? (
        <p role="status" className="py-8 text-sm text-stone-600">Loading homepage content...</p>
      ) : items.length ? (
        <div className="admin-table-wrap overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-100 text-xs uppercase tracking-wide text-stone-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-stone-100">
                  <td className="max-w-sm px-4 py-3 font-semibold text-stone-900">{displayTitle(item)}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {category === "videos" ? `${item.category?.en || "Video"} / ${item.youtubeUrl}` : category === "announcements" ? `${item.type || "general"} / ${item.priority || "medium"}` : item.author || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{new Date(item.publishedAt || item.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                      <Button variant="danger" onClick={() => remove(item)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
          <h3 className="font-semibold text-stone-800">No {categoryLabel.toLowerCase()} yet</h3>
          <p className="mt-1 text-sm text-stone-600">Add content here to show it on the public site.</p>
        </div>
      )}
    </section>
  );
}
