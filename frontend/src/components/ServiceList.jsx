import { UI, pick } from "../i18n.js";

export function formatFee(fee, lang, t) {
  if (!fee || fee.amount === 0) return t.free;
  const base = `${fee.amount.toLocaleString("en-US")} ${lang === "am" ? "ብር" : "ETB"}`;
  return base;
}

export default function ServiceList({ lang, services, orgsById, onOpen, onReset }) {
  const t = UI[lang];

  if (services.length === 0) {
    return (
      <div className="empty" role="status">
        <h3>{t.noResultsTitle}</h3>
        <p>{t.noResultsText}</p>
        <button className="btn" onClick={onReset}>{t.allOrgs}</button>
      </div>
    );
  }

  return (
    <ul className="rows">
      {services.map((s) => (
        <li key={s.id}>
          <button className="row" onClick={() => onOpen(s.id)}>
            <span className="row__main">
              <strong>{pick(s.name, lang)}</strong>
              <span className="row__org">{pick(orgsById[s.org].name, lang)}</span>
            </span>
            <span className="row__facts">
              <span><small>{t.fee}</small>{formatFee(s.fee, lang, t)}</span>
              <span><small>{t.time}</small>{pick(s.time, lang)}</span>
            </span>
            <svg className="row__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
