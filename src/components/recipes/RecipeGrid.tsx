import React, { useState } from 'react';
import { Search, X, Heart, ArrowUpDown, RefreshCw, ChefHat } from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '../../types/recipe';

interface RecipeGridProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
}

export const RecipeGrid: React.FC<RecipeGridProps> = ({ onSelectRecipe, onCookRecipe }) => {
  const {
    filteredRecipes,
    recipes,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    showFavoritesOnly,
    setShowFavoritesOnly,
    toggleFavorite,
    triggerSync,
    syncState
  } = useRecipes();

  const [sortBy, setSortBy] = useState<'title' | 'category' | 'ingredients'>('title');

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    if (sortBy === 'title') {
      return a.frontmatter.title.localeCompare(b.frontmatter.title);
    }
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    if (sortBy === 'ingredients') {
      return a.ingredients.length - b.ingredients.length;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter Control Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-4">
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes, ingredients (e.g. garlic, chicken, wine), tags..."
            className="w-full pl-11 pr-10 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills (Scrollable horizontally) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            All Cuisines ({recipes.length})
          </button>

          {categories.map((cat) => {
            const count = recipes.filter((r) => r.category.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory?.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? null : cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat} <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Second Filter Row: Favorites toggle, Difficulty, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all ${
                showFavoritesOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>Favorites Only</span>
            </button>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty || ''}
              onChange={(e) => setSelectedDifficulty(e.target.value || null)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-xs font-medium focus:outline-none"
            >
              <option value="title">Title (A-Z)</option>
              <option value="category">Category</option>
              <option value="ingredients">Fewest Ingredients</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header / Active Filters Status */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
        <span>
          Showing <strong className="text-stone-800 dark:text-stone-200">{sortedRecipes.length}</strong> of{' '}
          {recipes.length} recipes
        </span>

        {(searchQuery || selectedCategory || selectedDifficulty || showFavoritesOnly) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
              setSelectedDifficulty(null);
              setShowFavoritesOnly(false);
            }}
            className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Recipes Grid */}
      {sortedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelectRecipe}
              onCook={onCookRecipe}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              No recipes match your criteria
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Try adjusting your search terms, removing filters, or syncing the latest recipes from GitHub.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedDifficulty(null);
                setShowFavoritesOnly(false);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={() => triggerSync()}
              disabled={syncState.isSyncing}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Repo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
