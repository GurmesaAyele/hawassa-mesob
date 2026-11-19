import { useCallback, useEffect, useRef, useState } from "react";
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
import { adminApi, setAdminToken, getAdminToken } from "../services/adminApi";
import { API_CONFIG } from "../config/api";
import mesobFavicon from "../assets/favicon.png";
import mesobLogo from "../assets/images/hawassa_mesob_circle_logo.png";
import "./AdminDashboard.css";

const ADMIN_ROLES = new Set(["OPERATOR", "SUPER_ADMIN", "STAFF"]);
const ADMIN_SESSION_EXPIRY_KEY = "adminSessionExpiresAt";
const SECTIONS = [
  { id: "institutions", label: "Institutions" },
  { id: "services", label: "Services" },
  { id: "staff", label: "Staff members", superAdminOnly: true },
  { id: "messages", label: "Messages", superAdminOnly: true },
  { id: "site-settings", label: "Location & contact" },
  { id: "home", label: "Home content" },
  { id: "vip-tickets", label: "VIP tickets", hideForOperator: true },
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
      setAdminToken(null);
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-layout">
      {/* ─── Authentic Hawassa Mesob Circle Logo Background (Large Scale) ─── */}
      <div className="admin-login-bg-layer" aria-hidden="true">
        <img
          src={mesobLogo}
          alt=""
          className="admin-login-bg-logo"
        />
      </div>

      {/* ─── Left Showcase Section (Brand Colors, Official Logo) ─── */}
      <section className="admin-login-intro" aria-label="Hawassa Mesob Administration Portal">
        <div className="admin-login-intro__top">
          <Link className="admin-login-brand" to="/">
            <img
              src={mesobFavicon}
              alt="Hawassa Mesob Official Emblem"
              className="admin-login-brand__img"
            />
            <div className="admin-login-brand__text">
              <span className="admin-login-brand__title">HAWASSA MESOB</span>
              <span className="admin-login-brand__sub">ONE-STOP PUBLIC SERVICE CENTER</span>
            </div>
          </Link>
        </div>

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

          <div className="admin-login-card__bottom">
            <Link className="admin-login-return" to="/">
              <span>← Return to public portal</span>
            </Link>
          </div>
        </form>
        {authError && <p role="alert" className="admin-login-error">{authError}</p>}
      </section>
    </main>
  );
}

export default function AdminDashboard() {
  const [section, setSection] = useState("institutions");
  const [currentUser, setCurrentUser] = useState(null);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

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
  const isOperator = currentUser?.role === "OPERATOR";

  const shouldShowOverview = !isStaff && (
    isSuperAdmin
      ? (section === "institutions" || section === "services" || section === "staff")
      : isOperator
        ? (section === "institutions" || section === "services")
        : false
  );

  const refreshData = useCallback(async (userOverride) => {
    const activeUser = userOverride || currentUserRef.current;
    const isSuper = activeUser?.role === "SUPER_ADMIN";
    const results = await Promise.allSettled([
      adminApi.institutions(),
      adminApi.services(),
      isSuper ? adminApi.messages() : Promise.resolve({ data: [], meta: { unreadCount: 0 } }),
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
        let sessionExpiresAt = localStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);
        if (!sessionExpiresAt) {
          const storedToken = getAdminToken();
          sessionExpiresAt = getSessionExpiry(storedToken);
          if (sessionExpiresAt) {
            localStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, sessionExpiresAt);
          }
        }
        if (!sessionExpiresAt || !Number.isFinite(Date.parse(sessionExpiresAt)) || Date.parse(sessionExpiresAt) <= Date.now()) {
          localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
          setAdminToken(null);
          setAuthMessage("Please sign in again to start a new 24-hour session.");
          adminApi.logout().catch((requestError) => {
            if (active) setAuthError(`Could not clear the previous session. ${requestError.message}`);
          });
          return;
        }
        if (user.role === "STAFF") {
          setSection("vip-tickets");
        } else if (user.role === "OPERATOR") {
          setSection("institutions");
        }
        const activeUser = { ...user, sessionExpiresAt };
        currentUserRef.current = activeUser;
        setCurrentUser(activeUser);
        if (activeUser.role !== "STAFF") {
          refreshData(activeUser);
        }
      })
      .catch((requestError) => {
        localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
        setAdminToken(null);
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

    // 1. Live SSE stream listener for real-time overview updates
    let eventSource = null;
    try {
      const streamUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_DASHBOARD}/stream`;
      eventSource = new EventSource(streamUrl);
      eventSource.addEventListener("queue_update", () => {
        refreshData();
      });
    } catch (err) {
      console.warn("[Admin Dashboard] SSE error:", err);
    }

    // 2. High-frequency background sync (every 5 seconds)
    const interval = setInterval(refreshData, 5000);

    // 3. Tab visibility sync
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshData();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, refreshData]);

  useEffect(() => {
    function handleUnauthorized(event) {
      setCurrentUser(null);
      localStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
      setAdminToken(null);
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
    currentUserRef.current = user;
    setCurrentUser(user);
    setLoading(user.role !== "STAFF");
    if (user.role !== "STAFF") {
      refreshData(user);
    }
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

  const updateMessageStatus = (message) => runMutation(
    () => adminApi.updateMessage(message.id, true),
    "Message marked as read.",
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
      <header className="border-b border-[#182f6a] border-t-2 border-t-[#d9a83f] bg-gradient-to-r from-[#172c60] via-[#294491] to-[#1c3575] text-white sticky top-0 z-40 shadow-md backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity" to="/">
              <img
                src={mesobFavicon}
                alt="Hawassa Mesob Logo"
                className="h-8 w-8 rounded-full object-contain border border-amber-400/60 shadow-xs bg-white/10 p-0.5"
              />
              <span className="font-extrabold tracking-tight text-sm sm:text-base text-white">HAWASSA MESOB</span>
            </Link>
            <span className="text-blue-300/40 font-mono">/</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              isSuperAdmin
                ? "bg-[#13234d] border-amber-400/60 text-amber-200"
                : isOperator
                  ? "bg-[#13234d] border-sky-400/60 text-sky-200"
                  : "bg-[#13234d] border-emerald-400/60 text-emerald-200"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                isSuperAdmin ? "bg-amber-400 animate-pulse" : isOperator ? "bg-sky-400" : "bg-emerald-400"
              }`}></span>
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
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-blue-100/80 hover:text-white transition-colors"
            >
              <span>Public Portal</span>
              <span className="text-[10px]">↗</span>
            </Link>

            <div className="h-4 w-px bg-blue-300/20 hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#152758] border border-amber-400/50 text-xs font-bold text-amber-300 shadow-2xs">
                {(currentUser.name || currentUser.email || "A").slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-bold text-white truncate max-w-[130px]">{currentUser.name || currentUser.email}</p>
                <p className="text-[11px] text-blue-200 font-medium">
                  {currentUser.role === "SUPER_ADMIN" ? "Super Admin" : isStaff ? "Staff Officer" : "Operator"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/30 transition-all shadow-2xs"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Sub-bar for Super Admin / Operator */}
        {!isStaff && (
          <div className="border-t border-[#182d63] bg-[#162b5e]/95 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none" role="tablist">
              {SECTIONS.filter((item) => {
                if (item.superAdminOnly && !isSuperAdmin) return false;
                if (item.hideForOperator && isOperator) return false;
                return true;
              }).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={section === item.id}
                  onClick={() => setSection(item.id)}
                  className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    section === item.id
                      ? "bg-white text-[#172c60] shadow-xs font-bold ring-1 ring-black/5"
                      : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === "messages" && unreadCount > 0 && (
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-blue-950 shadow-2xs">
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
        {shouldShowOverview && (
          <section className="mb-6" aria-label="Executive Operations Overview">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-3.5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#294491]">Executive Workspace</p>
                <h2 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">Operations Overview</h2>
              </div>
              <span className="text-xs font-medium text-stone-500">Live system status and directory metrics</span>
            </div>

            {loading ? (
              <SkeletonMetricsGrid count={isSuperAdmin ? 4 : 2} />
            ) : (
              <div
                className={
                  isSuperAdmin
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    : "grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl"
                }
              >
                {/* Metric 1: Institutions */}
                <article
                  onClick={() => setSection("institutions")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white ${
                    isSuperAdmin ? "p-5" : "p-3.5 sm:p-4"
                  } shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    section === "institutions" ? "border-[#294491] ring-2 ring-[#294491]/20 shadow-sm" : "border-stone-200/80"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#294491] via-[#3d5fb8] to-[#d9a83f]"></div>
                  <div className={`flex items-center justify-between ${isSuperAdmin ? "mb-3" : "mb-2 sm:mb-2.5"}`}>
                    <span className={`flex ${isSuperAdmin ? "h-10 w-10" : "h-8.5 w-8.5 sm:h-9 sm:w-9"} items-center justify-center rounded-xl bg-blue-50 text-[#294491] border border-blue-100 shadow-2xs`}>
                      <svg className={`${isSuperAdmin ? "h-5 w-5" : "h-4.5 w-4.5"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#294491]">
                      Directory
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500">Institutions</p>
                  <p className={`mt-0.5 ${isSuperAdmin ? "text-3xl" : "text-2xl sm:text-3xl"} font-extrabold tracking-tight text-stone-900`}>{institutions.length}</p>
                  <p className={`mt-1.5 ${isSuperAdmin ? "text-xs" : "text-[11px] sm:text-xs"} font-medium text-stone-500 flex items-center gap-1.5`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {institutions.filter((item) => item.isActive).length} active bodies
                  </p>
                </article>

                {/* Metric 2: Catalog Services */}
                <article
                  onClick={() => setSection("services")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white ${
                    isSuperAdmin ? "p-5" : "p-3.5 sm:p-4"
                  } shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                    section === "services" ? "border-sky-600 ring-2 ring-sky-600/20 shadow-sm" : "border-stone-200/80"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-600 to-sky-400"></div>
                  <div className={`flex items-center justify-between ${isSuperAdmin ? "mb-3" : "mb-2 sm:mb-2.5"}`}>
                    <span className={`flex ${isSuperAdmin ? "h-10 w-10" : "h-8.5 w-8.5 sm:h-9 sm:w-9"} items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100 shadow-2xs`}>
                      <svg className={`${isSuperAdmin ? "h-5 w-5" : "h-4.5 w-4.5"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-sky-100/80 border border-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                      Catalog
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500">Citizen Services</p>
                  <p className={`mt-0.5 ${isSuperAdmin ? "text-3xl" : "text-2xl sm:text-3xl"} font-extrabold tracking-tight text-stone-900`}>{services.length}</p>
                  <p className={`mt-1.5 ${isSuperAdmin ? "text-xs" : "text-[11px] sm:text-xs"} font-medium text-stone-500 flex items-center gap-1.5`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                    {services.filter((item) => item.isActive).length} published services
                  </p>
                </article>

                {/* Metric 3: Citizen Inquiries (Super Admin Only) */}
                {isSuperAdmin && (
                  <article
                    onClick={() => setSection("messages")}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                      section === "messages" ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm" : "border-stone-200/80"
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100 shadow-2xs">
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
                )}

                {/* Metric 4: VIP Queue (Super Admin Only) */}
                {isSuperAdmin && (
                  <article
                    onClick={() => setSection("vip-tickets")}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                      section === "vip-tickets" ? "border-purple-600 ring-2 ring-purple-600/20 shadow-sm" : "border-stone-200/80"
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-[#d9a83f]"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shadow-2xs">
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
                )}
              </div>
            )}
          </section>
        )}

        {!isStaff && error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 border-l-4 border-l-red-600 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">!</span>
              <p className="font-medium">{error}</p>
            </div>
            <button type="button" onClick={retryLoading} className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors shadow-2xs">
              Retry
            </button>
          </div>
        )}
        {!isStaff && notice && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 border-l-4 border-l-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">✓</span>
            <p className="font-semibold">{notice}</p>
          </div>
        )}

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
        {!isStaff && isSuperAdmin && section === "messages" && (
          <MessagesManager
            items={messages}
            loading={loading}
            unreadCount={unreadCount}
            error={messagesError}
            onToggleRead={updateMessageStatus}
          />
        )}
        {!isStaff && section === "site-settings" && (
          <SiteSettingsManager readOnly={!isSuperAdmin && !isOperator} />
        )}
        {!isStaff && section === "home" && (
          <>
            <HomeContentManager readOnly={!isSuperAdmin && !isOperator} />
            <p className="text-sm text-stone-600">
              Homepage links are not included in the documented content endpoints and remain unchanged.
            </p>
          </>
        )}
        {!isOperator && section === "vip-tickets" && (
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