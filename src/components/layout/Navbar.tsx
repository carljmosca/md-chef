import React from 'react';
import {
  ChefHat,
  RefreshCw,
  Search,
  BookOpen,
  Calendar,
  ShoppingBag,
  Settings,
  CheckCircle2,
  AlertCircle,
  Bot
} from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';
import { useSettings } from '../../context/SettingsContext';

interface NavbarProps {
  currentTab: 'recipes' | 'meals' | 'shopping' | 'ai' | 'settings';
  setCurrentTab: (tab: 'recipes' | 'meals' | 'shopping' | 'ai' | 'settings') => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSearch }) => {
  const { recipes, syncState, triggerSync } = useRecipes();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentTab('recipes')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 tracking-tight whitespace-nowrap">
                MD-Chef
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block whitespace-nowrap">
              {recipes.length} offline recipes
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-stone-100 dark:bg-stone-800/60 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setCurrentTab('recipes')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
              currentTab === 'recipes'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Recipes</span>
          </button>

          <button
            onClick={() => setCurrentTab('meals')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
              currentTab === 'meals'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span><span className="hidden lg:inline">Meal </span>Planner</span>
          </button>

          <button
            onClick={() => setCurrentTab('shopping')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
              currentTab === 'shopping'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Shopping<span className="hidden lg:inline"> List</span></span>
          </button>

          {settings.enableAIChef && (
            <button
              onClick={() => setCurrentTab('ai')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                currentTab === 'ai'
                  ? 'bg-gradient-to-r from-brand-600 to-amber-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Bot className={`w-4 h-4 shrink-0 ${currentTab === 'ai' ? 'text-white' : 'text-brand-600 dark:text-brand-400'}`} />
              <span>AI Chef</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md hidden xl:inline ${
                currentTab === 'ai' ? 'bg-white/20 text-white' : 'bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
              }`}>
                WebMCP
              </span>
            </button>
          )}

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
              currentTab === 'settings'
                ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Action Icons: Quick Search & Git Sync */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Search recipes (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded shadow-xs shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Git Differential Sync Button */}
          <button
            onClick={() => triggerSync()}
            disabled={syncState.isSyncing}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap shrink-0 ${
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
              className={`w-3.5 h-3.5 shrink-0 ${syncState.isSyncing ? 'animate-spin text-brand-600' : ''}`}
            />
            <span className="hidden sm:inline shrink-0">
              {syncState.isSyncing ? 'Syncing...' : 'Git Sync'}
            </span>
            {syncState.stats?.lastCommitSha && !syncState.isSyncing && !syncState.error && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 hidden sm:inline shrink-0" />
            )}
            {syncState.error && !syncState.isSyncing && (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 hidden sm:inline shrink-0" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

