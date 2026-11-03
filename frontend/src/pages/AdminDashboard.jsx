import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstitutionManager from "../components/admin/InstitutionManager";
import ServiceManager from "../components/admin/ServiceManager";
import HomeContentManager from "../components/admin/HomeContentManager";
import MessagesManager from "../components/admin/MessagesManager";
import SiteSettingsManager from "../components/admin/SiteSettingsManager";
import ConfirmationDialog from "../components/admin/ConfirmationDialog";
import { adminApi } from "../services/adminApi";
import "./AdminDashboard.css";

const ADMIN_ROLES = new Set(["OPERATOR", "SUPER_ADMIN"]);
const SECTIONS = [
  { id: "institutions", label: "Institutions" },
  { id: "services", label: "Services" },
  { id: "messages", label: "Messages" },
  { id: "site-settings", label: "Location & contact" },
  { id: "home", label: "Home content" },
];

function AdminSignIn({ message, onSignedIn, authError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await adminApi.login({ email: email.trim(), password });
      const { user } = await adminApi.me();
      if (!user || !ADMIN_ROLES.has(user.role)) {
        throw new Error("This account does not have access to the admin dashboard.");
      }
      onSignedIn(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-layout">
      <section className="admin-login-intro" aria-label="Administration portal information">
        <Link className="admin-login-brand" to="/">
          <span className="admin-login-brand__mark" aria-hidden="true">M</span>
          <span><strong>MESOB</strong><small>HAWASSA CITY CENTER</small></span>
        </Link>
        <div className="admin-login-intro__body">
          <p className="admin-eyebrow">STAFF PORTAL</p>
          <h1>Administration,<br />with clarity.</h1>
          <p>Manage the services, institutions, and information that connect Hawassa City residents to public services.</p>
        </div>
        <p className="admin-login-intro__footer">A trusted digital gateway for every citizen.</p>
      </section>
      <section className="admin-login-panel">
        <form onSubmit={submit} className="admin-login-card">
          <div className="admin-login-card__heading">
            <p className="admin-eyebrow">HAWASSA MESOB / ADMINISTRATION</p>
            <h2>Welcome back</h2>
            <p>Sign in with your active administrator account.</p>
          </div>
          {message && <p role="status" className="admin-callout admin-callout--security">{message}</p>}
          {error && <p role="alert" className="admin-callout admin-callout--error">{error}</p>}
          <label className="admin-login-field">
            <span>Email address</span>
            <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@hawassamesobcenter.et" />
          </label>
          <label className="admin-login-field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </label>
          <button className="admin-login-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in to dashboard"}
          </button>
          <Link className="admin-login-return" to="/">← Return to public site</Link>
          <p className="admin-login-security">Access is limited to authorized staff accounts.</p>
        </form>
        {authError && <p role="alert" className="admin-login-error">{authError}</p>}
      </section>
    </main>
  );
}

export default function AdminDashboard() {
  const [section, setSection] = useState("institutions");
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesError, setMessagesError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const refreshData = useCallback(async () => {
    const results = await Promise.allSettled([
      adminApi.institutions(),
      adminApi.services(),
      adminApi.messages(),
    ]);
    const sessionExpired = results.some(
      (result) => result.status === "rejected" && result.reason.status === 401,
    );
    if (sessionExpired) return false;

    const [institutionResult, serviceResult, messageResult] = results;
    const failures = [];
    if (institutionResult.status === "fulfilled") {
      setInstitutions(institutionResult.value);
    } else {
      failures.push(`Institutions: ${institutionResult.reason.message}`);
    }
    if (serviceResult.status === "fulfilled") {
      setServices(serviceResult.value);
    } else {
      failures.push(`Services: ${serviceResult.reason.message}`);
    }
    if (messageResult.status === "fulfilled") {
      const { data, meta } = messageResult.value;
      if (!Array.isArray(data) || typeof meta?.unreadCount !== "number") {
        setMessages([]);
        setUnreadCount(0);
        setMessagesError("The API returned an unexpected inbox response.");
        failures.push("Messages: The API returned an unexpected inbox response.");
      } else {
        setMessages(data);
        setUnreadCount(meta.unreadCount);
        setMessagesError("");
      }
    } else {
      setMessages([]);
      setUnreadCount(0);
      setMessagesError(messageResult.reason.message);
      failures.push(`Messages: ${messageResult.reason.message}`);
    }
    setError(failures.length ? `Some dashboard data could not be loaded. ${failures.join(" ")}` : "");
    setLoading(false);
    return failures.length === 0;
  }, []);

  useEffect(() => {
    let active = true;
    adminApi.me()
      .then(({ user }) => {
        if (!active) return;
        if (!user || !ADMIN_ROLES.has(user.role)) {
          setAuthError("This account does not have access to the admin dashboard.");
          return;
        }
        setCurrentUser(user);
      })
      .catch((requestError) => {
        if (active && requestError.status !== 401) setAuthError(requestError.message);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    refreshData();
  }, [currentUser, refreshData]);

  useEffect(() => {
    function handleUnauthorized() {
      setCurrentUser(null);
      setAuthMessage("Your session has expired. Please sign in again.");
      setAuthError("");
      setInstitutions([]);
      setServices([]);
      setMessages([]);
      setMessagesError("");
      setUnreadCount(0);
    }
    window.addEventListener("admin:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("admin:unauthorized", handleUnauthorized);
  }, []);

  const signIn = (user) => {
    setAuthError("");
    setAuthMessage("");
    setError("");
    setCurrentUser(user);
    setLoading(true);
  };

  const signOut = async () => {
    setError("");
    try {
      await adminApi.logout();
      setCurrentUser(null);
      setInstitutions([]);
      setServices([]);
      setMessages([]);
      setMessagesError("");
      setUnreadCount(0);
      setAuthMessage("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

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
    setConfirmation({
      title: "Deactivate institution?",
      message: `${name} and its services will no longer appear in public listings. You can reactivate them later by editing the record.`,
      confirmLabel: "Deactivate",
      action: () => runMutation(() => adminApi.deactivateInstitution(institution.id), "Institution and its services deactivated."),
    });
  };

  const deleteInstitution = (institution) => {
    const name = institution.name?.en || institution.code;
    setConfirmation({
      title: "Delete institution permanently?",
      message: `“${name}” and its services will be permanently deleted. This action cannot be undone.`,
      confirmLabel: "Delete permanently",
      action: () => runMutation(() => adminApi.deleteInstitution(institution.id), "Institution permanently deleted."),
    });
  };

  const reactivateInstitution = (institution) => runMutation(
    () => adminApi.updateInstitution(institution.id, { isActive: true }),
    "Institution reactivated. Its services can be reactivated individually.",
  );

  const saveService = (payload, id) => runMutation(
    () => id ? adminApi.updateService(id, payload) : adminApi.createService(payload),
    id ? "Service updated." : "Service created.",
  );

  const deactivateService = (service) => {
    const title = service.title?.en || "this service";
    setConfirmation({
      title: "Deactivate service?",
      message: `“${title}” will no longer appear in public listings. You can reactivate it later by editing the record.`,
      confirmLabel: "Deactivate",
      action: () => runMutation(() => adminApi.deactivateService(service.id), "Service deactivated."),
    });
  };

  const reactivateService = (service) => runMutation(
    () => adminApi.updateService(service.id, { isActive: true }),
    "Service reactivated.",
  );

  const confirmDestructiveAction = async () => {
    if (!confirmation) return;
    try {
      await confirmation.action();
    } finally {
      setConfirmation(null);
    }
  };

  const updateMessageStatus = (message, isReviewed) => runMutation(
    () => adminApi.updateMessage(message.id, isReviewed),
    isReviewed ? "Message marked as read." : "Message marked as unread.",
  );

  const retryLoading = async () => {
    setLoading(true);
    await refreshData();
  };

  if (authLoading) {
    return <div className="admin-shell admin-session-check"><p role="status">Checking administrator session...</p></div>;
  }

  if (!currentUser) {
    return (
      <div className="admin-shell min-h-screen">
        <AdminSignIn message={authMessage} authError={authError} onSignedIn={signIn} />
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-stone-50 text-stone-900">
      <header className="admin-header border-b border-emerald-950 bg-emerald-950 text-white">
        <div className="admin-header__inner">
          <div className="admin-header__brand">
            <p className="admin-eyebrow">HAWASSA MESOB / ADMINISTRATION</p>
            <h1 className="mt-1 text-2xl font-bold">Content dashboard</h1>
          </div>
          <div className="admin-account">
            <span className="admin-account__avatar" aria-hidden="true">{(currentUser.name || currentUser.email || "A").slice(0, 1).toUpperCase()}</span>
            <span className="admin-account__identity">
              <strong>{currentUser.name || currentUser.email}</strong>
              <small>{currentUser.role === "SUPER_ADMIN" ? "Super admin" : "Operator"}</small>
            </span>
            <button type="button" className="admin-account__action" onClick={signOut}>Sign out</button>
            <Link className="admin-account__action" to="/">Public site</Link>
          </div>
          <nav className="admin-nav" aria-label="Admin sections">
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
        <section className="admin-overview" aria-label="Dashboard summary">
          <div className="admin-overview__intro">
            <p className="admin-eyebrow">YOUR WORKSPACE</p>
            <h2>Operations overview</h2>
            <p>A clear view of the services and information managed by your team.</p>
          </div>
          <div className="admin-overview__metrics">
            <article className="admin-metric">
              <span className="admin-metric__icon" aria-hidden="true">01</span>
              <span className="admin-metric__label">Institutions</span>
              <strong>{loading ? "—" : institutions.length}</strong>
              <small>{loading ? "Loading records" : `${institutions.filter((item) => item.isActive).length} active`}</small>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__icon" aria-hidden="true">02</span>
              <span className="admin-metric__label">Services</span>
              <strong>{loading ? "—" : services.length}</strong>
              <small>{loading ? "Loading records" : `${services.filter((item) => item.isActive).length} active`}</small>
            </article>
            <article className="admin-metric admin-metric--inbox">
              <span className="admin-metric__icon" aria-hidden="true">03</span>
              <span className="admin-metric__label">Unread messages</span>
              <strong>{messagesError ? "—" : unreadCount}</strong>
              <small>{messagesError ? "Inbox unavailable" : "Citizen contact inbox"}</small>
            </article>
          </div>
        </section>

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
            readOnly={!isSuperAdmin}
            onSave={saveInstitution}
            onDeactivate={deactivateInstitution}
            onReactivate={reactivateInstitution}
            onDelete={deleteInstitution}
          />
        )}
        {section === "services" && (
          <ServiceManager
            items={services}
            institutions={institutions}
            loading={loading}
            saving={saving}
            readOnly={!isSuperAdmin}
            onSave={saveService}
            onDeactivate={deactivateService}
            onReactivate={reactivateService}
          />
        )}
        {section === "messages" && (
          <MessagesManager
            items={messages}
            loading={loading}
            unreadCount={unreadCount}
            error={messagesError}
            onToggleRead={updateMessageStatus}
          />
        )}
        {section === "site-settings" && <SiteSettingsManager readOnly={!isSuperAdmin} />}
        {section === "home" && (
          <>
            <HomeContentManager readOnly={!isSuperAdmin} />
            <p className="text-sm text-stone-600">
              Homepage links are not included in the documented content endpoints and remain unchanged.
            </p>
          </>
        )}
      </main>
      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        busy={saving}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmDestructiveAction}
      />
    </div>
  );
}