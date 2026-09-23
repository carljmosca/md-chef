import { Recipe, AppSettings, ShoppingItem, MealPlanDay, SyncStats } from '../types/recipe';

const DB_NAME = 'md_chef_db';
const DB_VERSION = 1;

const STORES = {
  RECIPES: 'recipes',
  SETTINGS: 'settings',
  SHOPPING: 'shopping',
  MEAL_PLAN: 'meal_plan',
  SYNC_STATS: 'sync_stats',
  FAVORITES: 'favorites'
};

const DEFAULT_SETTINGS: AppSettings = {
  repoOwner: 'carljmosca',
  repoName: 'recipes',
  branch: 'main',
  subdirectory: '',
  autoSyncOnLaunch: true,
  theme: 'system',
  keepAwakeInCookingMode: true,
  speechVoiceRate: 1.0
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.RECIPES)) {
        const recipeStore = db.createObjectStore(STORES.RECIPES, { keyPath: 'id' });
        recipeStore.createIndex('category', 'category', { unique: false });
        recipeStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORES.SHOPPING)) {
        db.createObjectStore(STORES.SHOPPING, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.MEAL_PLAN)) {
        db.createObjectStore(STORES.MEAL_PLAN, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_STATS)) {
        db.createObjectStore(STORES.SYNC_STATS);
      }
      if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
        db.createObjectStore(STORES.FAVORITES);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Recipes Storage
export async function getAllRecipesFromDB(): Promise<Recipe[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RECIPES, 'readonly');
      const store = tx.objectStore(STORES.RECIPES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back from IndexedDB for recipes', err);
    const raw = localStorage.getItem('md_chef_recipes_backup');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRecipesToDB(recipes: Recipe[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RECIPES, 'readwrite');
      const store = tx.objectStore(STORES.RECIPES);
      for (const recipe of recipes) {
        store.put(recipe);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for recipes', err);
    try {
      localStorage.setItem('md_chef_recipes_backup', JSON.stringify(recipes));
    } catch (e) {
      console.error('Storage full in localStorage fallback', e);
    }
  }
}

export async function saveSingleRecipeToDB(recipe: Recipe): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RECIPES, 'readwrite');
      const store = tx.objectStore(STORES.RECIPES);
      store.put(recipe);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving single recipe', err);
  }
}

export async function deleteRecipeFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RECIPES, 'readwrite');
      const store = tx.objectStore(STORES.RECIPES);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error deleting recipe', err);
  }
}

export async function clearAllRecipesInDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RECIPES, 'readwrite');
      const store = tx.objectStore(STORES.RECIPES);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error clearing recipes', err);
  }
}

// Settings Storage
export async function getSettingsFromDB(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('app_settings');
      req.onsuccess = () => resolve({ ...DEFAULT_SETTINGS, ...(req.result || {}) });
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    const raw = localStorage.getItem('md_chef_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  }
}

export async function saveSettingsToDB(settings: AppSettings): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = tx.objectStore(STORES.SETTINGS);
    store.put(settings, 'app_settings');
  } catch {
    // fallback
  }
  localStorage.setItem('md_chef_settings', JSON.stringify(settings));
}

// Shopping List Storage
export async function getShoppingListFromDB(): Promise<ShoppingItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SHOPPING, 'readonly');
      const store = tx.objectStore(STORES.SHOPPING);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    const raw = localStorage.getItem('md_chef_shopping');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveShoppingListToDB(items: ShoppingItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SHOPPING, 'readwrite');
    const store = tx.objectStore(STORES.SHOPPING);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
  } catch {
    // fallback
  }
  localStorage.setItem('md_chef_shopping', JSON.stringify(items));
}

// Meal Plan Storage
export async function getMealPlansFromDB(): Promise<MealPlanDay[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.MEAL_PLAN, 'readonly');
      const store = tx.objectStore(STORES.MEAL_PLAN);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    const raw = localStorage.getItem('md_chef_meal_plans');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveMealPlansToDB(plans: MealPlanDay[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.MEAL_PLAN, 'readwrite');
    const store = tx.objectStore(STORES.MEAL_PLAN);
    store.clear();
    for (const plan of plans) {
      store.put(plan);
    }
  } catch {
    // fallback
  }
  localStorage.setItem('md_chef_meal_plans', JSON.stringify(plans));
}

// Sync Stats Storage
export async function getSyncStatsFromDB(): Promise<SyncStats | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.SYNC_STATS, 'readonly');
      const store = tx.objectStore(STORES.SYNC_STATS);
      const req = store.get('last_sync');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    const raw = localStorage.getItem('md_chef_sync_stats');
    return raw ? JSON.parse(raw) : null;
  }
}

export async function saveSyncStatsToDB(stats: SyncStats): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SYNC_STATS, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_STATS);
    store.put(stats, 'last_sync');
  } catch {
    // fallback
  }
  localStorage.setItem('md_chef_sync_stats', JSON.stringify(stats));
}

// Favorites Storage
export async function getFavoritesFromDB(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.FAVORITES, 'readonly');
      const store = tx.objectStore(STORES.FAVORITES);
      const req = store.get('favorite_ids');
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    const raw = localStorage.getItem('md_chef_favorites');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveFavoritesToDB(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.FAVORITES, 'readwrite');
    const store = tx.objectStore(STORES.FAVORITES);
    store.put(ids, 'favorite_ids');
  } catch {
    // fallback
  }
  localStorage.setItem('md_chef_favorites', JSON.stringify(ids));
}

// Request persistent storage from browser
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

export async function getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number } | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return {
      usageMB: Math.round(((est.usage || 0) / (1024 * 1024)) * 10) / 10,
      quotaMB: Math.round(((est.quota || 0) / (1024 * 1024)) * 10) / 10
    };
  }
  return null;
}

