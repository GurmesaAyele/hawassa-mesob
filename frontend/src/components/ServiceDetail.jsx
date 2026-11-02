import { useState, useEffect } from "react";
import { UI, pick } from "../i18n.js";
import { formatFee } from "./ServiceList.jsx";
import { SITE } from "../data/mesob.js";

export default function ServiceDetail({ lang, service, org, onBack }) {
  const t = UI[lang];
  const [done, setDone] = useState({});

  // Reset the checklist and scroll to top when a different service opens.
  useEffect(() => {
    setDone({});
    window.scrollTo({ top: 0 });
  }, [service.id]);

  const total = service.requirements.length;
  const ready = Object.values(done).filter(Boolean).length;

  return (
    <article className="detail">
      <button className="back" onClick={onBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        {t.back}
      </button>

      <header className="detail__head">
        <p className="detail__org">{pick(org.name, lang)}</p>
        <h1>{pick(service.name, lang)}</h1>
        <p>{pick(service.summary, lang)}</p>
      </header>

      <dl className="facts">
        <div>
          <dt>{t.fee}</dt>
          <dd>
            {formatFee(service.fee, lang, t)}
            {service.fee.note && <small>{pick(service.fee.note, lang)}</small>}
          </dd>
        </div>
        <div>
          <dt>{t.time}</dt>
          <dd>{pick(service.time, lang)}</dd>
        </div>
        <div>
          <dt>{t.office}</dt>
          <dd>{pick(org.floor, lang)}</dd>
        </div>
      </dl>

      <section className="block">
        <div className="block__head">
          <h2>{t.required}</h2>
          <span className="progress" aria-live="polite">{t.checked(ready, total)}</span>
        </div>
        <ul className="checklist">
          {service.requirements.map((r, i) => (
            <li key={i}>
              <label>
                <input
                  type="checkbox"
                  checked={!!done[i]}
                  onChange={(e) => setDone({ ...done, [i]: e.target.checked })}
                />
                <span>{pick(r, lang)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="hint">{t.originals}</p>
      </section>

      <section className="block">
        <h2>{t.steps}</h2>
        <ol className="steps">
          {service.steps.map((s, i) => (
            <li key={i}>{pick(s, lang)}</li>
          ))}
        </ol>
      </section>

      {service.notes.length > 0 && (
        <section className="block note">
          <h2>{t.notes}</h2>
          <ul>
            {service.notes.map((n, i) => (
              <li key={i}>{pick(n, lang)}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="detail__actions">
        <button className="btn" onClick={() => window.print()}>{t.print}</button>
        <p className="hint">{t.disclaimer} {t.updated}: {SITE.updated}.</p>
      </div>
    </article>
  );
}
