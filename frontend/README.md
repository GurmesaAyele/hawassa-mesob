# Hawassa MESOB Portal (React + Vite)

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

## Where to edit
- `src/data/mesob.js` – organizations, services, fees, documents, steps (SAMPLE DATA – replace with real data)
- `src/i18n.js` – interface text in English and Amharic (add Sidaama here)
- `src/styles.css` – colors are CSS variables at the top

## Connect a backend later
In `App.jsx`, replace the imports from `data/mesob.js` with a `fetch()` inside `useEffect`
and keep the same object shape.
