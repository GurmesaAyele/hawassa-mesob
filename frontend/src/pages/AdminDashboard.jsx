import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstitutionManager from "../components/admin/InstitutionManager";
import ServiceManager from "../components/admin/ServiceManager";
import HomeContentManager from "../components/admin/HomeContentManager";
import MessagesManager from "../components/admin/MessagesManager";
import SiteSettingsManager from "../components/admin/SiteSettingsManager";
import { adminApi } from "../services/adminApi";
import "./AdminDashboard.css";

const SECTIONS = [
  { id: "institutions", label: "Institutions" },
  { id: "services", label: "Services" },
  { id: "messages", label: "Messages" },
  { id: "site-settings", label: "Location & contact" },
  { id: "home", label: "Home content" },
];

export default function AdminDashboard() {
  const [section, setSection] = useState("institutions");
  const [institutions, setInstitutions] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshData = useCallback(async () => {
    try {
      const [institutionRows, serviceRows, messageResponse] = await Promise.all([
        adminApi.institutions(),
        adminApi.services(),
        adminApi.messages(),
      ]);
      setInstitutions(institutionRows);
      setServices(serviceRows);
      setMessages(messageResponse.data);
      setUnreadCount(messageResponse.meta.unreadCount);
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.institutions(), adminApi.services(), adminApi.messages()])
      .then(([institutionRows, serviceRows, messageResponse]) => {
        if (!active) return;
        setInstitutions(institutionRows);
        setServices(serviceRows);
        setMessages(messageResponse.data);
        setUnreadCount(messageResponse.meta.unreadCount);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function runMutation(action, successMessage) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await refreshData();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  const saveInstitution = (payload, id) => runMutation(
    () => id ? adminApi.updateInstitution(id, payload) : adminApi.createInstitution(payload),
    id ? "Institution updated." : "Institution created.",
  );

  const deactivateInstitution = (institution) => {
    const name = institution.name?.en || institution.code;
    if (!window.confirm(`Deactivate ${name} and its services? They will no longer appear in public listings.`)) return false;
    return runMutation(() => adminApi.deactivateInstitution(institution.id), "Institution and its services deactivated.");
  };

  const deleteInstitution = (institution) => {
    const name = institution.name?.en || institution.code;
    if (!window.confirm(`Permanently delete ${name} and its services? This cannot be undone.`)) return false;
    return runMutation(() => adminApi.deleteInstitution(institution.id), "Institution permanently deleted.");
  };

  const saveService = (payload, id) => runMutation(
    () => id ? adminApi.updateService(id, payload) : adminApi.createService(payload),
    id ? "Service updated." : "Service created.",
  );

  const deactivateService = (service) => {
    const title = service.title?.en || "this service";
    if (!window.confirm(`Deactivate ${title}? It will no longer appear in public listings.`)) return false;
    return runMutation(() => adminApi.deactivateService(service.id), "Service deactivated.");
  };

  const updateMessageStatus = (message, isReviewed) => runMutation(
    () => adminApi.updateMessage(message.id, isReviewed),
    isReviewed ? "Message marked as read." : "Message marked as unread.",
  );

  const retryLoading = async () => {
    setLoading(true);
    await refreshData();
    setLoading(false);
  };

  return (
    <div className="admin-shell min-h-screen bg-stone-50 text-stone-900">
      <header className="admin-header border-b border-emerald-950 bg-emerald-950 text-white">
        <div className="admin-header__inner mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pt-7 md:px-8">
          <div className="pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Hawassa MESOB / Administration</p>
            <h1 className="mt-1 text-2xl font-bold">Content dashboard</h1>
          </div>
          <Link className="mb-5 text-sm font-medium text-emerald-100 underline decoration-emerald-500 underline-offset-4 hover:text-white" to="/">View public site</Link>
          <nav className="admin-nav flex w-full gap-1 overflow-x-auto" aria-label="Admin sections">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => setSection(item.id)}
                className={`admin-nav__tab border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${section === item.id ? "border-amber-300 bg-stone-50 text-emerald-950" : "border-transparent text-emerald-100 hover:bg-emerald-900"}`}
              >
                <span>{item.label}</span>
                {item.id === "messages" && unreadCount > 0 && (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-bold leading-none text-emerald-950" aria-label={`${unreadCount} unread`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="admin-main mx-auto max-w-7xl space-y-5 px-4 py-7 md:px-8 md:py-9">
        {error && (
          <div role="alert" className="admin-callout admin-callout--error flex flex-wrap items-center justify-between gap-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p>{error}</p>
            <button type="button" onClick={retryLoading} className="font-semibold underline">Retry</button>
          </div>
        )}
        {notice && <p role="status" className="admin-callout admin-callout--success border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

        {section === "institutions" && (
          <InstitutionManager
            items={institutions}
            loading={loading}
            saving={saving}
            onSave={saveInstitution}
            onDeactivate={deactivateInstitution}
            onDelete={deleteInstitution}
          />
        )}
        {section === "services" && (
          <ServiceManager
            items={services}
            institutions={institutions}
            loading={loading}
            saving={saving}
            onSave={saveService}
            onDeactivate={deactivateService}
          />
        )}
        {section === "messages" && (
          <MessagesManager
            items={messages}
            loading={loading}
            unreadCount={unreadCount}
            onToggleRead={updateMessageStatus}
          />
        )}
        {section === "site-settings" && <SiteSettingsManager />}
        {section === "home" && (
          <>
            <HomeContentManager />
            <p className="text-sm text-stone-600">
              Homepage links are not included in the documented content endpoints and remain unchanged.
            </p>
          </>
        )}
      </main>
    </div>
  );
}