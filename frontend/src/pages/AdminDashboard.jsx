import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstitutionManager from "../components/admin/InstitutionManager";
import ServiceManager from "../components/admin/ServiceManager";
import HomeContentManager from "../components/admin/HomeContentManager";
import MessagesManager from "../components/admin/MessagesManager";
import SiteSettingsManager from "../components/admin/SiteSettingsManager";
import VipTicketsManager from "../components/admin/VipTicketsManager";
import StaffManager from "../components/admin/StaffManager";
import ConfirmationDialog from "../components/admin/ConfirmationDialog";
import { SkeletonMetricsGrid } from "../components/admin/AdminSkeleton";
import { adminApi } from "../services/adminApi";
import "./AdminDashboard.css";

const ADMIN_ROLES = new Set(["OPERATOR", "SUPER_ADMIN", "STAFF"]);
const ADMIN_SESSION_EXPIRY_KEY = "adminSessionExpiresAt";
const SECTIONS = [
  { id: "institutions", label: "Institutions" },
  { id: "services", label: "Services" },
  { id: "staff", label: "Staff members", superAdminOnly: true },
  { id: "messages", label: "Messages" },
  { id: "site-settings", label: "Location & contact" },
  { id: "home", label: "Home content" },
  { id: "vip-tickets", label: "VIP tickets" },
];

function getSessionExpiry(token) {
  try {
    const encodedPayload = token?.split(".")[1];
    if (!encodedPayload) return "";
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return Number.isInteger(payload.exp) ? new Date(payload.exp * 1000).toISOString() : "";
  } catch {
    return "";
  }
}

function AdminSignIn({ message, onSignedIn, authError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loginResult = await adminApi.login({ email: email.trim(), password });
      const sessionExpiresAt = getSessionExpiry(loginResult?.token);
      if (!sessionExpiresAt) {
        throw new Error("The server did not provide a valid session expiration. Please try signing in again.");
      }
      localStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, sessionExpiresAt);
      const { user } = await adminApi.me();
      if (!user || !ADMIN_ROLES.has(user.role)) {
        throw new Error("This account does not have access to the admin dashboard.");
      }
      onSignedIn({ ...user, sessionExpiresAt });
    } catch (requestError) {
      localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
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
          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>
            <span className="admin-password-input">
              <input id="admin-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
              <button
                className="admin-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a14.8 14.8 0 01-3.1 3.9" />
                    <path d="M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10.7 10.7 0 004.1-.8" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12s3.3-7 9.5-7 9.5 7 9.5 7-3.3 7-9.5 7-9.5-7-9.5-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </div>
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
  const isStaff = currentUser?.role === "STAFF";

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
        const sessionExpiresAt = localStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);
        if (!sessionExpiresAt || !Number.isFinite(Date.parse(sessionExpiresAt)) || Date.parse(sessionExpiresAt) <= Date.now()) {
          localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
          setAuthMessage("Please sign in again to start a new 24-hour session.");
          adminApi.logout().catch((requestError) => {
            if (active) setAuthError(`Could not clear the previous session. ${requestError.message}`);
          });
          return;
        }
        if (user.role === "STAFF") setSection("vip-tickets");
        setCurrentUser({ ...user, sessionExpiresAt });
      })
      .catch((requestError) => {
        localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
        if (active && requestError.status !== 401) setAuthError(requestError.message);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role === "STAFF") return;
    refreshData();
  }, [currentUser, refreshData]);

  useEffect(() => {
    function handleUnauthorized(event) {
      setCurrentUser(null);
      localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
      setAuthMessage(event.detail?.message || "Your session has expired. Please sign in again.");
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

  useEffect(() => {
    if (!currentUser) return undefined;

    const expiresAt = Date.parse(currentUser.sessionExpiresAt);
    const hasValidExpiry = Number.isFinite(expiresAt);

    let expiryTimer;
    let endingSession = false;

    const expireSession = () => {
      if (endingSession) return;
      endingSession = true;
      adminApi.logout()
        .then(() => {
          localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
          window.dispatchEvent(new CustomEvent("admin:unauthorized", {
            detail: {
              message: hasValidExpiry
                ? "Your session expired after 24 hours. Please sign in again."
                : "The server did not provide a valid session expiration. Please sign in again.",
            },
          }));
        })
        .catch((requestError) => {
          localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
          window.dispatchEvent(new CustomEvent("admin:unauthorized", {
            detail: {
              message: hasValidExpiry
                ? `Your session expired after 24 hours. Could not contact the server to clear the session (${requestError.message}). Please sign in again.`
                : `The server did not provide a valid session expiration. Could not contact the server to clear the session (${requestError.message}). Please sign in again.`,
            },
          }));
        });
    };

    const checkSessionExpiry = () => {
      if (Date.now() >= expiresAt) {
        expireSession();
      }
    };

    expiryTimer = window.setTimeout(expireSession, hasValidExpiry ? Math.max(0, expiresAt - Date.now()) : 0);
    window.addEventListener("focus", checkSessionExpiry);
    document.addEventListener("visibilitychange", checkSessionExpiry);

    return () => {
      window.clearTimeout(expiryTimer);
      window.removeEventListener("focus", checkSessionExpiry);
      document.removeEventListener("visibilitychange", checkSessionExpiry);
    };
  }, [currentUser]);

  const signIn = (user) => {
    setAuthError("");
    setAuthMessage("");
    setError("");
    setSection(user.role === "STAFF" ? "vip-tickets" : "institutions");
    setCurrentUser(user);
    setLoading(user.role !== "STAFF");
  };

  const signOut = async () => {
    setError("");
    try {
      await adminApi.logout();
      setCurrentUser(null);
      localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
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
    <div className="admin-shell min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* ─── Executive Modern Navigation Bar ─── */}
      <header className="border-b border-emerald-950 bg-[#0a231b] text-white sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity" to="/">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 font-black text-emerald-950 text-xs shadow-xs">
                M
              </span>
              <span className="font-extrabold tracking-tight text-sm sm:text-base">HAWASSA MESOB</span>
            </Link>
            <span className="text-emerald-700/60 font-mono">/</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/90 border border-emerald-700/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              {isStaff
                ? `${currentUser.institution?.name?.en || currentUser.institution?.code || "Desk"} Desk`
                : isSuperAdmin
                  ? "Super Admin Console"
                  : "Operations Desk"}
            </span>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-200/80 hover:text-white transition-colors"
            >
              <span>Public Portal</span>
              <span className="text-[10px]">↗</span>
            </Link>

            <div className="h-4 w-px bg-emerald-800/80 hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-900 border border-emerald-700 text-xs font-bold text-amber-300">
                {(currentUser.name || currentUser.email || "A").slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-bold text-white truncate max-w-[130px]">{currentUser.name || currentUser.email}</p>
                <p className="text-[11px] text-emerald-300 font-medium">
                  {currentUser.role === "SUPER_ADMIN" ? "Super Admin" : isStaff ? "Staff Officer" : "Operator"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-emerald-800/80 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900 hover:text-white transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Sub-bar for Super Admin / Operator */}
        {!isStaff && (
          <div className="border-t border-emerald-900/40 bg-[#081d16]/90 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none" role="tablist">
              {SECTIONS.filter((item) => {
                if (item.superAdminOnly && !isSuperAdmin) return false;
                return true;
              }).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={section === item.id}
                  onClick={() => setSection(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    section === item.id
                      ? "bg-white text-emerald-950 shadow-xs font-bold"
                      : "text-emerald-100/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === "messages" && unreadCount > 0 && (
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-emerald-950 shadow-2xs">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className={`admin-main mx-auto max-w-7xl px-4 md:px-8 ${isStaff ? "py-4 md:py-5 space-y-3" : "py-6 md:py-8 space-y-6"}`}>
        {/* ─── Modern AI Bento Operations Overview Grid ─── */}
        {!isStaff && (
          <section className="mb-6" aria-label="Executive Operations Overview">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-3.5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Executive Workspace</p>
                <h2 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">Operations Overview</h2>
              </div>
              <span className="text-xs font-medium text-stone-500">Live system status and directory metrics</span>
            </div>

            {loading ? (
              <SkeletonMetricsGrid count={4} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Institutions */}
                <article
                  onClick={() => setSection("institutions")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    section === "institutions" ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-stone-200/80"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                      Directory
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Institutions</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{institutions.length}</p>
                  <p className="mt-2 text-xs font-medium text-stone-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {institutions.filter((item) => item.isActive).length} active bodies
                  </p>
                </article>

                {/* Metric 2: Catalog Services */}
                <article
                  onClick={() => setSection("services")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    section === "services" ? "border-sky-600 ring-2 ring-sky-600/20" : "border-stone-200/80"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-600 to-sky-400"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-sky-100/80 border border-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                      Catalog
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Citizen Services</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{services.length}</p>
                  <p className="mt-2 text-xs font-medium text-stone-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                    {services.filter((item) => item.isActive).length} published services
                  </p>
                </article>

                {/* Metric 3: Citizen Inquiries */}
                <article
                  onClick={() => setSection("messages")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    section === "messages" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-stone-200/80"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${unreadCount > 0 ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-stone-100 border-stone-200 text-stone-600"}`}>
                      {unreadCount > 0 ? "Action Required" : "Inbox"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Citizen Inquiries</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">{messagesError ? "—" : unreadCount}</p>
                  <p className="mt-2 text-xs font-medium text-stone-500 flex items-center gap-1.5">
                    {unreadCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                    {messagesError ? "Inbox unavailable" : `${unreadCount} unread submissions`}
                  </p>
                </article>

                {/* Metric 4: VIP Queue */}
                <article
                  onClick={() => setSection("vip-tickets")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    section === "vip-tickets" ? "border-purple-600 ring-2 ring-purple-600/20" : "border-stone-200/80"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-400"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-purple-100/80 border border-purple-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800">
                      Fast-Track
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">VIP Ticket Desk</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">Queue</p>
                  <p className="mt-2 text-xs font-medium text-purple-700 group-hover:underline flex items-center gap-1">
                    Manage appointments &amp; orders →
                  </p>
                </article>
              </div>
            )}
          </section>
        )}

        {!isStaff && error && (
          <div role="alert" className="admin-callout admin-callout--error flex flex-wrap items-center justify-between gap-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p>{error}</p>
            <button type="button" onClick={retryLoading} className="font-semibold underline">Retry</button>
          </div>
        )}
        {!isStaff && notice && <p role="status" className="admin-callout admin-callout--success border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

        {!isStaff && section === "institutions" && (
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
        {!isStaff && section === "services" && (
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
        {!isStaff && isSuperAdmin && section === "staff" && (
          <StaffManager institutions={institutions} currentUser={currentUser} />
        )}
        {!isStaff && section === "messages" && (
          <MessagesManager
            items={messages}
            loading={loading}
            unreadCount={unreadCount}
            error={messagesError}
            onToggleRead={updateMessageStatus}
          />
        )}
        {!isStaff && section === "site-settings" && <SiteSettingsManager readOnly={!isSuperAdmin} />}
        {!isStaff && section === "home" && (
          <>
            <HomeContentManager readOnly={!isSuperAdmin} />
            <p className="text-sm text-stone-600">
              Homepage links are not included in the documented content endpoints and remain unchanged.
            </p>
          </>
        )}
        {section === "vip-tickets" && (
          <VipTicketsManager currentUser={currentUser} institutions={institutions} />
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