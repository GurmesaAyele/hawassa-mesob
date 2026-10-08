# Workspace Guide

## 🎯 Quick Start

All development happens in the `frontend` folder.

```bash
cd frontend
npm install
npm run dev
```

## 📂 Folder Structure

```
hawassa-mesob/
│
├── .git/                    # Git repository
│
├── frontend/                # 👈 MAIN APPLICATION
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── data/           # Mock data
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers
│   │   └── ...
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies
│   └── vite.config.js      # Vite config
│
├── README.md               # Main documentation
└── WORKSPACE_GUIDE.md      # This file
```

## 🛠️ Working with Frontend

### Install Dependencies
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Creates optimized build in `frontend/dist/`

### Preview Production Build
```bash
npm run preview
```

## 📝 Development Workflow

1. **Navigate to frontend folder**
   ```bash
   cd frontend
   ```

2. **Make your changes** in `src/`

3. **Test locally**
   ```bash
   npm run dev
   ```

4. **Build before committing**
   ```bash
   npm run build
   ```

## 🎨 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Main app component |
| `frontend/src/main.jsx` | Entry point |
| `frontend/src/index.css` | Global styles |
| `frontend/tailwind.config.js` | Tailwind config |
| `frontend/vite.config.js` | Vite config |

## 🚀 Deployment

To deploy the frontend:

1. Build the project:
   ```bash
   cd frontend
   npm run build
   ```

2. Upload `frontend/dist/` folder to:
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting

## 📦 What's Built

- ✅ Header & Navigation (Addis MESOB style)
- ✅ Hero Section with Search
- ✅ AI Chatbot (MESOB AI Assistant)
- ✅ Service Categories
- ✅ Popular Services
- ✅ How It Works Section
- ✅ Full Component Library
- ✅ Mock Data (Services, Organizations, News, FAQs)

## 🎯 Next Steps

Continue building in the `frontend` folder:
- Services directory page
- Service detail pages
- Application tracking
- News section
- FAQ page
- Contact page

---

**Remember**: Always work in the `frontend/` directory!
