import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_CONFIG, getLocaleCode } from '../config/api';
import mesobCircleLogo from '../assets/images/hawassa_mesob_circle_logo.png';
import mesobOfficeBg from '../assets/images/mesob.jpg';
import footerLogo from '../assets/images/hawasssa_mesob.png';

import './VIPPublicDashboard.css';

// ─── Localized Translations for Queue Display ────────────────────────────────
const TRANSLATIONS = {
  English: {
    title: "Hawassa Mesob VIP Queue Management",
    colOrganization: "Organization",
    colCounter: "Counter",
    colStaffName: "Staff Name",
    colNumber: "Number",
    emptyMessage: "No tickets available at the moment.",
    viewRequestedOnly: "Pending Requests Only",
    viewAllDesks: "Show All Counters",
    motionLabel: "Hawassa Mesob • One-Stop Public Service Center",
    liveBadge: "Live Motion",
    fullscreenBtn: "Fullscreen",
    windowedBtn: "Exit",
  },
  Amharic: {
    title: "የሀዋሳ የተራ አስተዳደር መቆጣጠሪያ",
    colOrganization: "ተቋም",
    colCounter: "መስኮት",
    colStaffName: "የሰራተኛ ስም",
    colNumber: "ቁጥር",
    emptyMessage: "በአሁኑ ሰዓት የሚስተናገድ ተገልጋይ የለም።",
    viewRequestedOnly: "በመጠባበቅ ላይ ያሉ",
    viewAllDesks: "ሁሉንም መስኮቶች አሳይ",
    motionLabel: "የሀዋሳ መሶብ • የአንድ ማዕከል የህዝብ አገልግሎት",
    liveBadge: "የቀጥታ ማሳያ",
    fullscreenBtn: "ሙሉ ስክሪን",
    windowedBtn: "ውጣ",
  },
  Sidama: {
    title: "Hawassa Kassu Mashala",
    colOrganization: "Uurrinsha",
    colCounter: "Dargu",
    colStaffName: "Loosasinchu Su'ma",
    colNumber: "Kiiro",
    emptyMessage: "Tenne yanna kasso nookkiho.",
    viewRequestedOnly: "Agadhanni noore",
    viewAllDesks: "Baala Dargubba",
    motionLabel: "Hawassa Mesob • Mitte Dargi Dagate Agurro",
    liveBadge: "Dagate Mashala",
    fullscreenBtn: "Wo'ma Skiriine",
    windowedBtn: "Goochi",
  },
};

export default function VIPPublicDashboard() {
  const [language, setLanguage] = useState('English');
  const [dashboardData, setDashboardData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllDesks, setShowAllDesks] = useState(true);

  // Sync Language
  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved && TRANSLATIONS[saved]) setLanguage(saved);

    const handleLangChange = (e) => {
      if (e.detail && TRANSLATIONS[e.detail]) setLanguage(e.detail);
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const locale = getLocaleCode(language);

  // Fetch Public Dashboard Data
  const fetchDashboard = useCallback(async () => {
    try {
      const endpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_DASHBOARD}?locale=${locale}`;
      const res = await fetch(endpoint, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.warn('[Queue Dashboard] fetch notice:', err.message);
    }
  }, [locale]);

  // Real-time synchronization: SSE stream + continuous fallback polling
  useEffect(() => {
    fetchDashboard();

    // 1. Live Server-Sent Events (SSE) stream for instant server push (<50ms)
    let eventSource = null;
    try {
      const streamUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_DASHBOARD}/stream`;
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener("queue_update", () => {
        fetchDashboard();
      });

      eventSource.addEventListener("open", () => {
        // Connected to live server stream
      });

      eventSource.onerror = () => {
        // Browser natively reconnects on transient network drops
      };
    } catch (err) {
      console.warn("[TV Dashboard] EventSource unavailable:", err.message);
    }

    // 2. High-frequency continuous polling (every 3.5s) as a rock-solid fallback
    const pollInterval = setInterval(() => {
      fetchDashboard();
    }, 3500);

    // 3. Immediately refresh when screen or tab gains focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboard]);

  // Fullscreen support
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // 'F' key shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract staff counters
  const staffCounters = useMemo(() => {
    return dashboardData?.staffCounters || dashboardData?.deskCounters || [];
  }, [dashboardData]);

  // Counters that have pending tickets requested
  const pendingDesks = useMemo(() => {
    return staffCounters.filter((d) => (d.pendingCount || 0) > 0);
  }, [staffCounters]);

  // Total pending tickets across all desks
  const totalPendingTickets = useMemo(() => {
    return staffCounters.reduce((acc, d) => acc + (d.pendingCount || 0), 0);
  }, [staffCounters]);

  // If showAllDesks is true, show all 14 counters.
  // Otherwise, show counters that have pending tickets requested.
  // If no counters have pending tickets, pendingDesks is empty, showing "No tickets available at the moment."
  const displayedDesks = showAllDesks ? staffCounters : pendingDesks;

  return (
    <div className={`queue-tv-screen ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* ─── 0. Office Background Image (mesob.jpg) with Soft Blue Tint ─── */}
      <img
        src={mesobOfficeBg}
        alt="Hawassa Mesob Office Background"
        className="queue-bg-office-layer"
      />

      {/* ─── 1. Authentic Mesob Circle Logo Background (Fitted to Right Section) ─── */}
      <img
        src={mesobCircleLogo}
        alt="Hawassa Mesob Circle Logo Graphic"
        className="queue-bg-logo-layer"
      />

      {/* ─── 2. Top Header with Bold Visible Logo, Title & Controls ─── */}
      <header className="queue-header">
        <div className="queue-header-left">
          <img
            src={footerLogo}
            alt="Hawassa Mesob Logo"
            className="queue-top-logo"
          />
        </div>

        <h1 className="queue-title">{t.title}</h1>

        {/* Minimal utility controls (Fullscreen & Language) */}
        <div className="queue-header-controls">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="queue-ctrl-btn"
            title="Toggle Fullscreen (or press 'F')"
          >
            <span>⛶</span>
            <span className="hidden sm:inline">{isFullscreen ? t.windowedBtn : t.fullscreenBtn}</span>
          </button>

          <div className="queue-lang-group">
            {['English', 'Amharic', 'Sidama'].map((langKey) => (
              <button
                key={langKey}
                type="button"
                onClick={() => {
                  setLanguage(langKey);
                  localStorage.setItem('language', langKey);
                  window.dispatchEvent(new CustomEvent('languageChange', { detail: langKey }));
                }}
                className={`queue-lang-btn ${language === langKey ? 'active' : ''}`}
              >
                {langKey === 'English' ? 'EN' : langKey === 'Amharic' ? 'አማ' : 'SID'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── 4. Main Stage: Left Table + Right Mesob Motion Loop ─── */}
      <main className="queue-main-stage">
        {/* Left: Queue Table (~58% Width) */}
        <section className="queue-table-section">
          <div className="queue-table-container">
            <table className="queue-table">
              <thead>
                <tr>
                  <th style={{ width: '36%', minWidth: '130px' }}>{t.colOrganization}</th>
                  <th style={{ width: '18%', minWidth: '85px' }}>{t.colCounter}</th>
                  <th style={{ width: '26%', minWidth: '115px' }}>{t.colStaffName}</th>
                  <th style={{ width: '20%', minWidth: '75px', textAlign: 'center' }}>{t.colNumber}</th>
                </tr>
              </thead>
              <tbody>
                {displayedDesks.length === 0 ? (
                  /* Exact banner as in the user's reference photo */
                  <tr className="queue-row-empty">
                    <td colSpan={4} className="queue-empty-cell">
                      {t.emptyMessage}
                    </td>
                  </tr>
                ) : (
                  displayedDesks.map((desk, idx) => {
                    const pendingCount = desk.pendingCount ?? desk.number ?? 0;
                    const hasPending = pendingCount > 0;

                    return (
                      <tr
                        key={desk.id || idx}
                        className={hasPending ? 'has-pending' : ''}
                      >
                        {/* 1. Organization */}
                        <td className="font-bold text-slate-900">
                          <div className="truncate max-w-[180px] sm:max-w-[260px] lg:max-w-none">
                            {desk.institutionName || 'MESOB Center'}
                          </div>
                        </td>

                        {/* 2. Counter */}
                        <td className="font-bold text-blue-900 whitespace-nowrap">
                          {desk.roomNumber || `Counter 0${idx + 1}`}
                        </td>

                        {/* 3. Staff Name */}
                        <td className="font-medium text-slate-700">
                          <div className="truncate max-w-[140px] sm:max-w-[200px] lg:max-w-none">
                            {desk.staffName || 'Staff Officer'}
                          </div>
                        </td>

                        {/* 4. Number: Displays the count of pending tickets requested */}
                        <td style={{ textAlign: 'center' }}>
                          {hasPending ? (
                            <span className="queue-pending-number">
                              {pendingCount}
                            </span>
                          ) : (
                            <span className="queue-zero-number">
                              0
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Discreet View Switcher / Status Note */}
          <div className="queue-view-toggle-bar">
            <span>
              {pendingDesks.length} organization{pendingDesks.length === 1 ? '' : 's'} with requests • Total Pending: {totalPendingTickets}
            </span>
            <button
              type="button"
              onClick={() => setShowAllDesks((prev) => !prev)}
              className="queue-toggle-pill"
            >
              <span>{showAllDesks ? t.viewRequestedOnly : t.viewAllDesks}</span>
              <span className="text-amber-400 font-mono">({showAllDesks ? pendingDesks.length : staffCounters.length})</span>
            </button>
          </div>
        </section>

        {/* Right: Mesob Motion Loop Showcase (~38% Width) */}
        <section className="queue-media-section">
          <div className="queue-video-card">
            <iframe
              src="/mesob-motion-loop.html"
              title="Hawassa Mesob Motion Loop"
              className="queue-video-iframe"
              scrolling="no"
              loading="eager"
            />
            <div className="queue-video-caption">
              <span>{t.motionLabel}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-amber-300">
                {t.liveBadge}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
