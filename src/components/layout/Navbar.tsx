import React from 'react';
import { ChefHat, RefreshCw, Search, BookOpen, Sparkles, ShoppingBag, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';

interface NavbarProps {
  currentTab: 'recipes' | 'meals' | 'shopping' | 'settings';
  setCurrentTab: (tab: 'recipes' | 'meals' | 'shopping' | 'settings') => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSearch }) => {
  const { recipes, syncState, triggerSync } = useRecipes();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentTab('recipes')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 tracking-tight">
                MD-Chef
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
              {recipes.length} offline recipes
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100 dark:bg-stone-800/60 p-1 rounded-xl">
          <button
            onClick={() => setCurrentTab('recipes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'recipes'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Recipes
          </button>

          <button
            onClick={() => setCurrentTab('meals')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'meals'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Meal Ideas
          </button>

          <button
            onClick={() => setCurrentTab('shopping')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'shopping'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Shopping List
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'settings'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        {/* Right Action Icons: Quick Search & Git Sync */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/80 rounded-lg transition-colors"
            title="Search recipes (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded shadow-xs">
              ⌘K
            </kbd>
          </button>

          {/* Git Differential Sync Button */}
          <button
            onClick={() => triggerSync()}
            disabled={syncState.isSyncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              syncState.isSyncing
                ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300'
                : syncState.error
                ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 hover:bg-rose-100'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/70 shadow-xs'
            }`}
            title={
              syncState.isSyncing
                ? syncState.message
                : syncState.error
                ? `Sync issue: ${syncState.error}`
                : `Git Commit: ${syncState.stats?.lastCommitSha?.slice(0, 7) || 'Connected'}`
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-brand-600' : ''}`}
            />
            <span className="hidden sm:inline">
              {syncState.isSyncing ? 'Syncing...' : 'Git Sync'}
            </span>
            {syncState.stats?.lastCommitSha && !syncState.isSyncing && !syncState.error && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 hidden sm:inline" />
            )}
            {syncState.error && !syncState.isSyncing && (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 hidden sm:inline" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

