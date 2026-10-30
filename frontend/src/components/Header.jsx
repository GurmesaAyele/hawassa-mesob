import { UI } from "../i18n.js";

// Small woven-basket mark drawn in SVG (a nod to the "mesob" basket).
function Mark() {
  return (
    <svg className="mark" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M4 16h32l-4 20H8z" fill="var(--straw)" />
      <path d="M8 22h24M9.5 29h21M14 16l-1 20M20 16v20M26 16l1 20" stroke="var(--clay)" strokeWidth="1.6" fill="none" />
      <path d="M2 16h36" stroke="var(--lake)" strokeWidth="4" strokeLinecap="round" />
      <path d="M13 12c0-5 14-5 14 0" stroke="var(--lake)" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function Header({ lang, setLang, onHome }) {
  const t = UI[lang];
  return (
    <header className="header">
      <div className="wrap header__row">
        <a href="#top" className="brand" onClick={onHome}>
          <Mark />
          <span>
            <strong>{t.siteName}</strong>
            <small>{t.tagline}</small>
          </span>
        </a>
        <nav className="nav" aria-label="Main">
          <a href="#services" onClick={onHome}>{t.navServices}</a>
          <a href="#contact">{t.navContact}</a>
          <div className="lang" role="group" aria-label="Language">
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>EN</button>
            <button className={lang === "am" ? "on" : ""} onClick={() => setLang("am")} aria-pressed={lang === "am"} lang="am">አማ</button>
          </div>
        </nav>
      </div>
    </header>
  );
}
