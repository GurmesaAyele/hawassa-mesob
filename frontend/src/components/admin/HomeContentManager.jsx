import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button, FIELD_CLASS, Field, LocalizedFields, EmptyState } from "./AdminFields";
import { SkeletonTable } from "./AdminSkeleton";
import ConfirmationDialog from "./ConfirmationDialog";

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
    author: displayText(initial?.author, ""),
    priority: initial?.priority || "medium",
    type: displayText(initial?.category || initial?.type, "general"),
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
          ...(category === "news" && {
            author: updateEnglishTranslation(initial?.author, form.author.trim()),
            category: updateEnglishTranslation(initial?.category, form.type.trim()),
          }),
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

function displayText(value, fallback = "—") {
  if (typeof value === "string") return value || fallback;
  if (value && typeof value === "object") {
    return value.en || value.am || value.sid || fallback;
  }
  return fallback;
}

function displayTitle(item) {
  return displayText(item.title, "Untitled");
}

function updateEnglishTranslation(value, englishValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return englishValue;
  return { ...value, en: englishValue };
}

export default function HomeContentManager({ readOnly = false }) {
  const [category, setCategory] = useState("news");
  const [records, setRecords] = useState({ news: [], announcements: [], videos: [] });
  const [editing, setEditing] = useState(null);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

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

  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing]);

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

  async function remove() {
    if (!pendingDelete) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      if (category === "news") await adminApi.deleteNews(pendingDelete.id);
      else if (category === "announcements") await adminApi.deleteAnnouncement(pendingDelete.id);
      else await adminApi.deleteVideo(pendingDelete.id);
      setNotice("Homepage content deleted.");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
      setPendingDelete(null);
    }
  }

  const items = records[category];
  const categoryLabel = CONTENT_TYPES.find(([id]) => id === category)?.[1];

  return (
    <section className="space-y-4" aria-labelledby="home-content-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="home-content-heading" className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Portal Content &amp; Media
            </h2>
            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Publish public announcements, news articles, and embedded video briefings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-xs shadow-2xs" role="tablist">
            {CONTENT_TYPES.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={category === id}
                onClick={() => { setCategory(id); setEditing(null); setNotice(""); }}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  category === id
                    ? "bg-white text-emerald-950 shadow-xs font-bold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {label} ({records[id].length})
              </button>
            ))}
          </div>

          {!readOnly && !editing && (
            <Button
              onClick={() => setEditing({})}
              className="rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              <span>Add {category === "videos" ? "Video" : category === "news" ? "News" : "Announcement"}</span>
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-900 rounded-r-lg">
          You have read-only access. A super admin can manage homepage content.
        </p>
      )}

      {error && (
        <div role="alert" className="border-l-4 border-red-600 bg-red-50 p-3.5 text-xs text-red-900 rounded-r-lg">
          <p>{error}</p>
          <button type="button" onClick={refresh} className="mt-1 font-semibold underline">Retry</button>
        </div>
      )}
      {notice && (
        <p role="status" className="border-l-4 border-emerald-700 bg-emerald-50 p-3.5 text-xs text-emerald-900 rounded-r-lg">
          {notice}
        </p>
      )}

      {editing && (
        <div ref={formRef} className="scroll-mt-4">
          <ContentForm
            key={`${category}-${editing.id || "new"}`}
            category={category}
            initial={editing.id ? editing : null}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        </div>
      )}

      {loading ? (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-4 py-3.5">Details</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTable rows={4} columns={4} />
            </tbody>
          </table>
        </div>
      ) : items.length ? (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-xs">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-4 py-3.5">Details</th>
                <th className="px-4 py-3.5">Published Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-stone-100 hover:bg-stone-50/60 transition-colors">
                  <td className="max-w-sm px-5 py-3.5 font-bold text-stone-900">{displayTitle(item)}</td>
                  <td className="px-4 py-3.5 text-xs text-stone-600">
                    {category === "videos"
                      ? `${displayText(item.category, "Video")} / ${displayText(item.youtubeUrl)}`
                      : category === "announcements"
                        ? `${displayText(item.type, "general")} / ${displayText(item.priority, "medium")}`
                        : displayText(item.author)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-stone-500">
                    {new Date(item.publishedAt || item.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      {!readOnly && (
                        <>
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
                            onClick={() => setPendingDelete(item)}
                            className="rounded-lg border border-red-200/80 bg-red-50/60 p-1.5 text-xs text-red-600 hover:bg-red-100 shadow-2xs transition-all"
                            title="Delete content"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white">
          <EmptyState
            icon="building"
            title={`No ${categoryLabel.toLowerCase()} published yet`}
            description="Add content here to publish announcements, news articles, and videos on the citizen-facing portal."
            action={
              !readOnly ? (
                <Button type="button" onClick={() => setEditing({})}>
                  + Add New {categoryLabel.slice(0, -1)}
                </Button>
              ) : null
            }
          />
        </div>
      )}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${category === "videos" ? "video" : category === "news" ? "news item" : "announcement"}?`}
        message={`“${pendingDelete ? displayTitle(pendingDelete) : ""}” will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete permanently"
        busy={saving}
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </section>
  );
}
