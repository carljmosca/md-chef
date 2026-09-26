# MD-Chef 🍳 — Markdown Recipe Companion PWA

A sleek, responsive Progressive Web App (PWA) built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**. MD-Chef connects directly to Git repositories containing Markdown format recipes (defaulting to [`carljmosca/recipes`](https://github.com/carljmosca/recipes)), parses checklist-driven recipes, and implements an intelligent **Git-commit differential sync engine** that only updates modified or added recipes.

---

## ✨ Features

### 🔄 Git-Commit Aware Differential Sync
- **Automatic Startup Check**: Seamlessly checks the configured Git repository for remote updates whenever the app opens, keeping your cookbook up to date.
- **Commit & Tree SHA Inspection**: Queries GitHub's Git Tree and Commits APIs to compare local IndexedDB recipe blob SHAs with the remote tree.
- **Minimal Bandwidth**: Unchanged recipes (where Git blob SHA matches) are skipped with zero re-downloading. Only modified or newly added recipes are fetched.
- **Repository Flexibility**: Supports custom GitHub owner, repo name, branch, and subdirectories in Settings.
- **Instant Offline Ready**: Pre-seeded with snapshot recipes so the app works immediately on first launch even with zero internet connection.

### 📖 Rich Recipe Parsing & Organization
- **Structured Subheadings**: Full support for ingredient and instruction subsections (e.g. `### Sauce`, `### Dough`, `### Toppings`).
- **Interactive Checklists**: Mark off ingredients and instructions with persistent progress tracking and one-tap reset.
- **Accurate Yield Scaler**: Real-time ingredient scaling (0.5x, 1x, 2x, 3x) that handles fractions, mixed numbers, and unit conversions.

### 🔪 Immersive Kitchen Cooking Mode
- **Hands-Free Kitchen View**: High-contrast, large-font layout designed to be read easily from across a counter.
- **Screen Wake Lock API**: Keeps your phone or tablet display awake while cooking (`navigator.wakeLock`).
- **Interactive Auto-Detected Timers**: Automatically parses cooking times (e.g. `8-10 minutes`, `30 seconds`, `1 hour`) and provides 1-tap countdown timers with Web Audio alarms (no external sound files required).
- **Text-to-Speech (TTS)**: Reads current step instructions aloud hands-free via the Web Speech API.
- **Quick Ingredients Drawer**: Slide-out panel lets you check quantities without losing your place in the steps.
- **Step Checklists & Confetti**: Mark off steps as you cook with audio chimes and a celebration when the dish is finished.

### 🔍 Advanced Search & Discovery
- **Instant Search**: Full-text client-side search across recipe titles, ingredients, cuisine categories, and tags.
- **Cuisine Filters**: Quick pill filters for Italian, Asian, Beef, Chicken, Desserts, Greek, Mexican, Pork, Sides, Thai, and Pasta.
- **Difficulty & Time Badges**: Filter by Easy, Medium, Hard, and sort by Title, Category, or Fewest Ingredients.
- **Quick Search Modal**: Press <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> anywhere in the app to find any recipe in milliseconds.

### 🎲 Recipe Roulette & Idea Spark
- **Can't decide what to cook?** Spin the culinary wheel to get random meal suggestions tailored by cuisine or difficulty.

### 📅 Weekly Meal Planner
- Plan dinners and lunches for Monday through Sunday.
- **1-Click Grocery Generation**: Click **"Add Week to Shopping List"** to instantly scale and import all ingredients needed for your entire week!

### 🛒 Categorized Shopping List & Google Keep Integration
- Automatically classifies ingredients into grocery store aisles: **Produce**, **Meat & Seafood**, **Dairy & Refrigerated**, **Pantry & Dry Goods**, **Spices & Seasonings**, **Bakery**, and **Other**.
- Real-time servings scaler (0.5x, 1x, 2x, 3x) scales quantities accurately (e.g., `3 1/2 cups` becomes `7 cups`).
- **Google Keep Export & Launch**: 1-click **"Copy & Open Keep"** formats the grocery checklist grouped cleanly by aisle category, copies it to the clipboard, and launches [Google Keep](https://keep.google.com) ready to paste into a new note.
- **Flexible Sharing**: Add custom items, check off items in-store, and share via SMS, WhatsApp, or standard clipboard copy.

### 📤 Recipe Sharing
- Native mobile share sheet via the **Web Share API**.
- One-click copy formatted recipe text or direct URL hash deep-link (`#/recipe/Italian/chicken-marsala.md`).
- Pre-filled email button (`mailto:`) with recipe ingredients and instructions.

### 📱 Progressive Web App (PWA)
- Full offline support with Web App Manifest and Service Worker caching.
- Installable on iOS (Add to Home Screen) and Android/Desktop Chrome.
- Persistent local database powered by **IndexedDB**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build & PWA Generation
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Unit Tests
```bash
npm test
```

---

## 🛠️ Tech Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom culinary theme & dark mode
- **Build Tool**: Vite 6 with `vite-plugin-pwa`
- **Database**: IndexedDB (with `localStorage` fallback)
- **Icons**: Lucide React
- **Celebration FX**: Canvas Confetti

