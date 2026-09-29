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

### 🤖 WebMCP & AI Culinary Suite (Local-First Architecture)
- **Client-First & Zero Server Load**: MD-Chef is a Progressive Web App (PWA) where recipes, shopping lists, meal plans, and the USDA nutrition engine reside entirely in the **user's client browser (IndexedDB and memory)**. 
- **Protected Local HTTP Endpoint**: To keep remote hosting free and protect your server from heavy AI scraping/computation, the built-in MCP HTTP server is **restricted to local calls (`localhost` / `127.0.0.1`)** with a built-in guard blocking non-local IP requests.
- **Built-in AI Chef**: Conversational culinary assistant running in-app that searches your cookbook, calculates nutritional profiles, and automatically generates grocery checklists.
- **OpenAPI 3.0 Specification**: Local `/mcp/openapi.json` endpoint ready to paste directly into ChatGPT Custom GPT Actions.
- **11 Registered Culinary Tools**: Search recipes, inspect steps & ingredients, compute nutrition from raw ingredients, analyze recipe nutrition, and manage shopping lists.

### 🥗 Offline Nutrition Calculation Engine
- **USDA-Referenced Nutritional Profiles**: Instant, 100% offline estimation of calories, macronutrients, and micronutrients for any recipe or raw ingredient list.
- **FDA-Style Nutrition Facts Card**: Interactive collapsible nutrition card with calorie energy distribution (% calories from protein, carbs, fat) and % Daily Values (DV).
- **Dietary Badges**: Automatically tags recipes as **High-Protein**, **Keto/Low-Carb**, **Low-Fat**, **High-Fiber**, or **Low-Sodium**.

### 📱 Progressive Web App (PWA)
- Full offline support with Web App Manifest and Service Worker caching.
- Installable on iOS (Add to Home Screen) and Android/Desktop Chrome.
- Persistent local database powered by **IndexedDB**.

---

## 🤖 WebMCP & Local HTTP Integration Guide

Because MD-Chef is a client-first application, all recipes, personal edits, shopping checklists, and meal plans live in **your browser's IndexedDB**. 

To protect hosting servers from heavy computation and preserve complete user data privacy, the MCP server is designed for **local client-side execution**:

- **Local MCP Endpoint**: `http://localhost:5173/mcp`
- **Local MCP SSE Stream**: `http://localhost:5173/mcp/sse`
- **Local OpenAPI Schema**: `http://localhost:5173/mcp/openapi.json`
- **Non-Local Guard**: Requests from non-loopback IPs receive a `403 Forbidden`, ensuring zero external load on remote hosting infrastructure.

---

### 🔌 Connecting Claude, ChatGPT, Copilot, and Gemini

#### 1. Claude (Anthropic)
Claude Desktop connects directly to the local HTTP/SSE endpoint:
1. Open your Claude configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the `md-chef` local HTTP endpoint:
   ```json
   {
     "mcpServers": {
       "md-chef": {
         "url": "http://localhost:5173/mcp"
       }
     }
   }
   ```
3. Restart Claude Desktop. Claude now communicates with your local MD-Chef instance with zero external server traffic!

#### 2. ChatGPT (OpenAI)
Connect ChatGPT to MD-Chef using **Custom GPT Actions**:
1. In ChatGPT, create or edit a Custom GPT and click **Add Action**.
2. Click **Import from URL** and paste your local OpenAPI URL:
   `http://localhost:5173/mcp/openapi.json`
3. ChatGPT imports all recipe search, nutrition, and shopping list tools for local interaction.

#### 3. Microsoft Copilot & Edge
- **Microsoft Edge Copilot**: Open MD-Chef in Microsoft Edge and open the Copilot sidebar. Copilot reads the page context and `document.modelContext` directly inside your browser tab without making any server requests.
- **VS Code / GitHub Copilot**: Configure the local HTTP endpoint in settings:
   ```json
   {
     "mcp": {
       "servers": {
         "md-chef": {
           "url": "http://localhost:5173/mcp"
         }
       }
     }
   }
   ```

#### 4. Google Gemini
- **Chrome Built-in AI / Gemini Nano (`window.ai`)**:
  Chrome 128+ with Prompt API runs Gemini Nano on-device. With the W3C WebMCP flag enabled, Gemini Nano binds directly to `navigator.modelContext` / `document.modelContext`, querying the in-memory cookbook with 0ms network latency and zero server load.
- **Gemini Web / API Clients**:
  Connect to your local instance at `http://localhost:5173/mcp`.

---

### Registered Culinary Tools Reference

| Tool Name | Description | Key Parameters |
| :--- | :--- | :--- |
| `search_recipes` | Search recipes by keyword query, cuisine, or ingredients. | `query` (string, required) |
| `get_recipe_details` | Retrieve full recipe markdown, ingredients, steps, and notes. | `recipeId` (string, required) |
| `get_random_recipe` | Pick a random recipe for meal inspiration. | `category` (optional string) |
| `list_categories` | List all unique categories and recipe counts. | *None* |
| `compute_nutrition` | Calculate calories, macros, and % DV for a raw ingredient list. | `ingredients` (array of strings, required) |
| `analyze_recipe_nutrition` | Calculate nutrition profile and per-serving breakdown for a recipe. | `recipeId` (string, required) |
| `add_to_shopping_list` | Add items to the persistent shopping list. | `items` (array of strings, required) |
| `get_shopping_list` | Retrieve all current grocery checklist items. | *None* |
| `clear_completed_shopping`| Remove checked-off items from the grocery list. | *None* |
| `get_meal_plan` | Get the 7-day scheduled breakfast, lunch, and dinner meal plan. | *None* |
| `schedule_meal` | Schedule a recipe for a specific day and meal slot. | `day` (e.g. "Monday"), `meal` ("breakfast" \| "lunch" \| "dinner"), `recipeId` |

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

