export const FIELD_CLASS = "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-[#294491] focus:outline-none focus:ring-2 focus:ring-[#294491]/20";

export const LOCALES = [
  ["en", "English"],
  ["am", "Amharic"],
  ["sid", "Sidaamu Afoo"],
];

const LOCALE_LABELS = Object.fromEntries(LOCALES);

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

export function LanguageSwitch({ value, onChange }) {
  return (
    <div className="admin-language-switch inline-flex rounded-xl border border-stone-200 bg-stone-100 p-1" role="group" aria-label="Language selector">
      {LOCALES.map(([locale, label]) => (
        <button
          key={locale}
          type="button"
          aria-pressed={value === locale}
          onClick={() => onChange(locale)}
          className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-all ${
            value === locale
              ? "bg-[#294491] text-white shadow-xs font-bold"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function LocalizedFields({ label, value, locale, errors = {}, multiline = false, allLocales = false, onChange }) {
  const Input = multiline ? "textarea" : "input";
  const locales = allLocales ? LOCALES : LOCALES.filter(([code]) => code === locale);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-stone-800">{label}</legend>
      <div className={allLocales ? "grid gap-4 md:grid-cols-3" : "space-y-3"}>
        {locales.map(([code]) => (
          <Field key={code} label={LOCALE_LABELS[code]} error={errors[code]}>
            <Input
              className={FIELD_CLASS}
              value={value[code] || ""}
              onChange={(event) => onChange(code, event.target.value)}
              lang={code}
              rows={multiline ? 3 : undefined}
            />
          </Field>
        ))}
      </div>
    </fieldset>
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "border-[#294491] bg-[#294491] text-white hover:bg-[#1f3575] active:bg-[#16275c] disabled:border-stone-200 disabled:bg-stone-200 disabled:text-stone-400 shadow-xs",
    secondary: "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100 disabled:border-stone-200 disabled:text-stone-400 shadow-xs",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 disabled:border-stone-200 disabled:text-stone-400 shadow-xs",
  };

  return (
    <button
      className={`admin-button inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#294491] focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Status({ active }) {
  return (
    <span className={`admin-status inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      active
        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
        : "bg-stone-100 text-stone-600 border border-stone-200"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-600" : "bg-stone-400"}`} aria-hidden="true" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function EmptyState({ icon = "search", title, description, action }) {
  const icons = {
    search: (
      <svg className="h-6 w-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    queue: (
      <svg className="h-6 w-6 text-[#294491]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    users: (
      <svg className="h-6 w-6 text-[#294491]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    building: (
      <svg className="h-6 w-6 text-[#294491]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    inbox: (
      <svg className="h-6 w-6 text-[#294491]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  };

  const renderedIcon = typeof icon === "string" ? icons[icon] || icons.search : icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200/80 mb-3 shadow-xs">
        {renderedIcon}
      </div>
      <h3 className="text-sm font-bold text-stone-900 tracking-tight">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-stone-500 leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
