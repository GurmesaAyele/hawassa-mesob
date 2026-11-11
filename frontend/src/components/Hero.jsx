import { useState, useEffect } from 'react';
import { UI, pick } from "../i18n.js";

// Import high-quality images
import mesob1 from '../assets/images/mesob1.jfif';
import mesob2 from '../assets/images/mesob2.jfif';
import mesob3 from '../assets/images/mesob3.jfif';
import mesob4 from '../assets/images/mesob4.jfif';
import mesob5 from '../assets/images/mesob5.jfif';
import mesob6 from '../assets/images/mesob6.jfif';
import mesob7 from '../assets/images/mesob7.jfif';
import mesob8 from '../assets/images/mesob8.jfif';
import mesob9 from '../assets/images/mesob9.jfif';
import mesob10 from '../assets/images/mesob10.jfif';
import mesob11 from '../assets/images/mesob11.jfif';
import mesob12 from '../assets/images/mesob12.jfif';

const heroImages = [
  mesob1, mesob2, mesob3, mesob4, mesob5, mesob6,
  mesob7, mesob8, mesob9, mesob10, mesob11, mesob12
];

export default function Hero({ lang, query, setQuery, popular, onOpen, orgCount, serviceCount }) {
  const t = UI[lang];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero" id="top">
      {/* High-quality image slideshow background */}
      <div className="hero__background" aria-hidden="true">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`hero__background-image ${index === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
      </div>
      {/* Subtle overlay for text readability */}
      <div className="hero__overlay" aria-hidden="true" />
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
