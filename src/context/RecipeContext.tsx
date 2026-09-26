import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Recipe, SyncStats } from '../types/recipe';
import {
  getAllRecipesFromDB,
  saveRecipesToDB,
  getSyncStatsFromDB,
  getFavoritesFromDB,
  saveFavoritesToDB,
  saveSingleRecipeToDB
} from '../services/storage';
import { getSeedRecipes } from '../data/defaultRecipes';
import { syncWithGitHub } from '../services/githubSync';
import { useSettings } from './SettingsContext';

interface SyncState {
  isSyncing: boolean;
  message: string;
  progress: number;
  stats: SyncStats | null;
  error: string | null;
}

interface RecipeContextValue {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  categories: string[];
  allTags: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedDifficulty: string | null;
  setSelectedDifficulty: (diff: string | null) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (favOnly: boolean) => void;
  activeRecipe: Recipe | null;
  setActiveRecipe: (r: Recipe | null) => void;
  activeCookingRecipe: Recipe | null;
  setActiveCookingRecipe: (r: Recipe | null) => void;
  toggleFavorite: (recipeId: string) => Promise<void>;
  syncState: SyncState;
  triggerSync: () => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
  getRandomRecipe: (categoryFilter?: string) => Recipe | null;
}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const hasSyncedOnLaunchRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    message: '',
    progress: 0,
    stats: null,
    error: null
  });

  // Load from IndexedDB or seed data
  const loadInitialRecipes = useCallback(async () => {
    try {
      const stored = await getAllRecipesFromDB();
      const favIds = await getFavoritesFromDB();
      const favSet = new Set(favIds);
      const lastStats = await getSyncStatsFromDB();

      if (lastStats) {
        setSyncState((prev) => ({ ...prev, stats: lastStats }));
      }

      if (stored.length > 0) {
        const enriched = stored.map((r) => ({
          ...r,
          isFavorite: favSet.has(r.id)
        }));
        setRecipes(enriched);
      } else {
        // Seed default recipes for instant offline readiness
        const seeds = getSeedRecipes().map((r) => ({
          ...r,
          isFavorite: favSet.has(r.id)
        }));
        await saveRecipesToDB(seeds);
        setRecipes(seeds);
      }
    } catch (err) {
      console.error('Failed to load recipes', err);
    } finally {
      setIsInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadInitialRecipes();
  }, [loadInitialRecipes]);

  // Deep linking via URL hash: #/recipe/Italian/chicken-marsala.md
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/recipe/')) {
        const path = decodeURIComponent(hash.replace('#/recipe/', ''));
        const found = recipes.find((r) => r.path === path || r.id === path);
        if (found) {
          setActiveRecipe(found);
        }
      } else if (hash.startsWith('#/cook/')) {
        const path = decodeURIComponent(hash.replace('#/cook/', ''));
        const found = recipes.find((r) => r.path === path || r.id === path);
        if (found) {
          setActiveCookingRecipe(found);
        }
      }
    };

    if (recipes.length > 0) {
      handleHash();
    }
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [recipes]);

  // Sync trigger
  const triggerSync = useCallback(async () => {
    setSyncState({
      isSyncing: true,
      message: 'Checking for updates...',
      progress: 0,
      stats: syncState.stats,
      error: null
    });

    try {
      const { stats, updatedRecipes } = await syncWithGitHub(settings, (msg, pct) => {
        setSyncState((prev) => ({
          ...prev,
          message: msg,
          progress: pct !== undefined ? pct : prev.progress
        }));
      });

      const favIds = await getFavoritesFromDB();
      const favSet = new Set(favIds);
      const enriched = updatedRecipes.map((r) => ({
        ...r,
        isFavorite: favSet.has(r.id)
      }));

      setRecipes(enriched);
      setSyncState({
        isSyncing: false,
        message: 'Sync completed!',
        progress: 100,
        stats,
        error: null
      });

      // Update active recipe if it was updated
      if (activeRecipe) {
        const refreshed = enriched.find((r) => r.id === activeRecipe.id);
        if (refreshed) setActiveRecipe(refreshed);
      }
    } catch (err: any) {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        message: '',
        error: err.message || 'Failed to sync with repository'
      }));
    }
  }, [settings, syncState.stats, activeRecipe]);

  // Check git repository for updates when the app opens
  useEffect(() => {
    if (!isInitialLoaded || hasSyncedOnLaunchRef.current) return;
    if (!settings.autoSyncOnLaunch) return;

    hasSyncedOnLaunchRef.current = true;

    // Small delay to allow the app UI to smoothly mount and display cached recipes first
    const timer = setTimeout(() => {
      triggerSync().catch((err) => {
        console.warn('Initial git sync on app launch encountered an issue:', err);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [isInitialLoaded, settings.autoSyncOnLaunch, triggerSync]);

  // Toggle favorite
  const toggleFavorite = async (recipeId: string) => {
    const updated = recipes.map((r) => {
      if (r.id === recipeId) {
        const nextFav = !r.isFavorite;
        saveSingleRecipeToDB({ ...r, isFavorite: nextFav });
        return { ...r, isFavorite: nextFav };
      }
      return r;
    });

    setRecipes(updated);

    const favIds = updated.filter((r) => r.isFavorite).map((r) => r.id);
    await saveFavoritesToDB(favIds);

    if (activeRecipe && activeRecipe.id === recipeId) {
      setActiveRecipe((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    recipes.forEach((r) => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats).sort();
  }, [recipes]);

  // Distinct tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach((r) => {
      r.frontmatter.tags?.forEach((t) => tags.add(t.toLowerCase()));
    });
    return Array.from(tags).sort();
  }, [recipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return recipes.filter((r) => {
      // Category filter
      if (selectedCategory && r.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty && r.frontmatter.difficulty !== selectedDifficulty) {
        return false;
      }

      // Favorites only
      if (showFavoritesOnly && !r.isFavorite) {
        return false;
      }

      // Search query
      if (q) {
        const titleMatch = r.frontmatter.title?.toLowerCase().includes(q);
        const tagMatch = r.frontmatter.tags?.some((t) => t.toLowerCase().includes(q));
        const categoryMatch = r.category.toLowerCase().includes(q);
        const ingredientMatch = r.ingredients.some((ing) => ing.raw.toLowerCase().includes(q));
        const instructionMatch = r.instructions.some((inst) => inst.text.toLowerCase().includes(q));
        const creditMatch = r.frontmatter.credit?.toLowerCase().includes(q);
        const sourceMatch = r.frontmatter.source?.toLowerCase().includes(q);

        if (
          !titleMatch &&
          !tagMatch &&
          !categoryMatch &&
          !ingredientMatch &&
          !instructionMatch &&
          !creditMatch &&
          !sourceMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [recipes, searchQuery, selectedCategory, selectedDifficulty, showFavoritesOnly]);

  const getRecipeById = useCallback(
    (id: string) => {
      return recipes.find((r) => r.id === id || r.path === id);
    },
    [recipes]
  );

  const getRandomRecipe = useCallback(
    (categoryFilter?: string): Recipe | null => {
      const candidates = categoryFilter
        ? recipes.filter((r) => r.category.toLowerCase() === categoryFilter.toLowerCase())
        : recipes;

      if (candidates.length === 0) return null;
      const idx = Math.floor(Math.random() * candidates.length);
      return candidates[idx];
    },
    [recipes]
  );

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        filteredRecipes,
        categories,
        allTags,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedDifficulty,
        setSelectedDifficulty,
        showFavoritesOnly,
        setShowFavoritesOnly,
        activeRecipe,
        setActiveRecipe,
        activeCookingRecipe,
        setActiveCookingRecipe,
        toggleFavorite,
        syncState,
        triggerSync,
        getRecipeById,
        getRandomRecipe
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export function useRecipes(): RecipeContextValue {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}

