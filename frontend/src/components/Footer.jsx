import { UI, pick } from "../i18n.js";
import { SITE } from "../data/mesob.js";

export default function Footer({ lang }) {
  const t = UI[lang];
  return (
    <footer className="footer" id="contact">
      <div className="wrap footer__grid">
        <div>
          <h2>{t.contactTitle}</h2>
          <p>{t.disclaimer}</p>
        </div>
        <dl>
          <dt>{t.address}</dt>
          <dd>{pick(SITE.address, lang)}</dd>
          <dt>{t.hours}</dt>
          <dd>{pick(SITE.hours, lang)}</dd>
          <dt>{t.phone}</dt>
          <dd><a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a></dd>
        </dl>
      </div>
    </footer>
  );
}
