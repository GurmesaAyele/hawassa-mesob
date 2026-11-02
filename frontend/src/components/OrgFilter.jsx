import { UI, pick } from "../i18n.js";

export default function OrgFilter({ lang, orgs, counts, total, active, onChange }) {
  const t = UI[lang];
  return (
    <aside className="orgs" aria-label={t.organizations}>
      <h2 className="orgs__title">{t.organizations}</h2>
      <ul>
        <li>
          <button className={!active ? "org on" : "org"} onClick={() => onChange(null)} aria-pressed={!active}>
            <span>{t.allOrgs}</span>
            <em>{total}</em>
          </button>
        </li>
        {orgs.map((o) => (
          <li key={o.id}>
            <button className={active === o.id ? "org on" : "org"} onClick={() => onChange(o.id)} aria-pressed={active === o.id}>
              <span>{pick(o.name, lang)}</span>
              <em>{counts[o.id] || 0}</em>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
