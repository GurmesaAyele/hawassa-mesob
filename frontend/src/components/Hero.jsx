import { UI, pick } from "../i18n.js";

export default function Hero({ lang, query, setQuery, popular, onOpen, orgCount, serviceCount }) {
  const t = UI[lang];
  return (
    <section className="hero" id="top">
      <div className="hero__weave" aria-hidden="true" />
      <div className="wrap hero__inner">
        <h1>{t.heroTitle}</h1>
        <p className="hero__text">{t.heroText}</p>

        <label className="search">
          <span className="sr-only">{t.searchPlaceholder}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
          />
          {query && (
            <button type="button" className="search__clear" onClick={() => setQuery("")}>
              {t.clear}
            </button>
          )}
        </label>

        <div className="hero__popular">
          <span>{t.popular}:</span>
          {popular.map((s) => (
            <button key={s.id} className="chip" onClick={() => onOpen(s.id)}>
              {pick(s.name, lang)}
            </button>
          ))}
        </div>

        <p className="hero__meta">
          {orgCount} {t.organizations.toLowerCase()} · {t.servicesCount(serviceCount)}
        </p>
      </div>
    </section>
  );
}
