export const FIELD_CLASS = "w-full rounded border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20";

export const LOCALES = [
  ["en", "English"],
  ["am", "Amharic"],
  ["sid", "Sidaamu Afoo"],
];

const LOCALE_LABELS = Object.fromEntries(LOCALES);

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function LanguageSwitch({ value, onChange }) {
  return (
    <div className="admin-language-switch inline-flex border border-stone-300 bg-white p-1" role="group" aria-label="Language">
      {LOCALES.map(([locale, label]) => (
        <button
          key={locale}
          type="button"
          aria-pressed={value === locale}
          onClick={() => onChange(locale)}
          className={`admin-language-switch__option min-h-9 min-w-20 px-3 text-sm font-semibold transition-colors ${value === locale ? "bg-emerald-800 text-white" : "text-stone-600 hover:bg-stone-100"}`}
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
    primary: "border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900 disabled:border-stone-300 disabled:bg-stone-300",
    secondary: "border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:text-stone-400",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-stone-400",
  };

  return (
    <button
      className={`admin-button inline-flex min-h-10 items-center justify-center border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Status({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${active ? "text-emerald-800" : "text-stone-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-600" : "bg-stone-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}