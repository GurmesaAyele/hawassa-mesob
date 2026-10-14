import { useMemo, useState } from "react";
import { UI, pick } from "./i18n.js";
import { ORGANIZATIONS, SERVICES } from "./data/mesob.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import OrgFilter from "./components/OrgFilter.jsx";
import ServiceList from "./components/ServiceList.jsx";
import ServiceDetail from "./components/ServiceDetail.jsx";
import Footer from "./components/Footer.jsx";

const orgsById = Object.fromEntries(ORGANIZATIONS.map((o) => [o.id, o]));

export default function App() {
  const [lang, setLang] = useState("en");
  const [query, setQuery] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [openId, setOpenId] = useState(null); // selected service id

  const t = UI[lang];

  // Search across names + organization names in BOTH languages.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => {
      if (orgId && s.org !== orgId) return false;
      if (!q) return true;
      const haystack = [
        s.name.en, s.name.am, s.summary.en, s.summary.am,
        orgsById[s.org].name.en, orgsById[s.org].name.am,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, orgId]);

  const counts = useMemo(() => {
    const c = {};
    SERVICES.forEach((s) => (c[s.org] = (c[s.org] || 0) + 1));
    return c;
  }, []);

  const popular = SERVICES.filter((s) => s.popular);
  const current = openId ? SERVICES.find((s) => s.id === openId) : null;

  const open = (id) => setOpenId(id);
  const home = () => setOpenId(null);
  const reset = () => { setQuery(""); setOrgId(null); };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header lang={lang} setLang={setLang} onHome={home} />

      <main id="main" lang={lang}>
        {current ? (
          <div className="wrap">
            <ServiceDetail lang={lang} service={current} org={orgsById[current.org]} onBack={home} />
          </div>
        ) : (
          <>
            <Hero
              lang={lang}
              query={query}
              setQuery={setQuery}
              popular={popular}
              onOpen={open}
              orgCount={ORGANIZATIONS.length}
              serviceCount={SERVICES.length}
            />
            <section className="wrap browse" id="services">
              <OrgFilter
                lang={lang}
                orgs={ORGANIZATIONS}
                counts={counts}
                total={SERVICES.length}
                active={orgId}
                onChange={setOrgId}
              />
              <div className="browse__list">
                <h2 className="browse__title">
                  {orgId ? pick(orgsById[orgId].name, lang) : t.navServices}
                  <span>{t.servicesCount(filtered.length)}</span>
                </h2>
                <ServiceList lang={lang} services={filtered} orgsById={orgsById} onOpen={open} onReset={reset} />
              </div>
            </section>
          </>
        )}
      </main>

      <Footer lang={lang} />
    </>
  );
}
