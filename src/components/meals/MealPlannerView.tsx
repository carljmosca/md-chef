import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  X,
  ShoppingBag,
  Check,
  Trash2,
  Search,
  Sunrise,
  Sun,
  Moon,
  Flame
} from 'lucide-react';
import { useMealPlan } from '../../context/MealPlanContext';
import { useRecipes } from '../../context/RecipeContext';
import { useShopping } from '../../context/ShoppingContext';
import { MealIdeaRoulette } from './MealIdeaRoulette';
import { Recipe, MealType } from '../../types/recipe';

interface MealPlannerViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
}

const MEAL_CONFIG: Array<{
  type: MealType;
  label: string;
  icon: typeof Sunrise;
  badgeBg: string;
  badgeText: string;
  cardBg: string;
  cardBorder: string;
}> = [
  {
    type: 'breakfast',
    label: 'Breakfast',
    icon: Sunrise,
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    cardBg: 'bg-amber-50/40 dark:bg-amber-950/20',
    cardBorder: 'border-amber-200/70 dark:border-amber-900/40'
  },
  {
    type: 'lunch',
    label: 'Lunch',
    icon: Sun,
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60',
    badgeText: 'text-sky-800 dark:text-sky-300',
    cardBg: 'bg-sky-50/40 dark:bg-sky-950/20',
    cardBorder: 'border-sky-200/70 dark:border-sky-900/40'
  },
  {
    type: 'dinner',
    label: 'Dinner',
    icon: Moon,
    badgeBg: 'bg-brand-100 dark:bg-brand-950/60',
    badgeText: 'text-brand-800 dark:text-brand-300',
    cardBg: 'bg-brand-50/40 dark:bg-brand-950/20',
    cardBorder: 'border-brand-200/70 dark:border-brand-900/40'
  }
];

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  onSelectRecipe,
  onCookRecipe
}) => {
  const {
    mealPlans,
    addRecipeToMeal,
    removeRecipeFromMeal,
    clearEntireWeek,
    addAllMealsToShoppingList
  } = useMealPlan();
  const { recipes, getRecipeById } = useRecipes();
  const { addIngredientsFromRecipe } = useShopping();

  const [activeSlotModal, setActiveSlotModal] = useState<{
    dayName: string;
    mealType: MealType;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Derive all unique categories from recipes for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [recipes]);

  // Filter recipes for the selection modal
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        r.frontmatter.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.frontmatter.tags && r.frontmatter.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesCat =
        selectedCategory === 'all' || r.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesQuery && matchesCat;
    });
  }, [recipes, searchQuery, selectedCategory]);

  const handleAddWeekToShopping = async () => {
    const totalAdded = await addAllMealsToShoppingList(recipes, (r) =>
      addIngredientsFromRecipe(r, 1)
    );
    setAddedNotice(`Added ${totalAdded} ingredients to your Shopping List!`);
    setTimeout(() => setAddedNotice(null), 3500);
  };

  const totalPlannedDishes = useMemo(() => {
    return mealPlans.reduce((sum, day) => {
      return (
        sum +
        (day.breakfast?.length || 0) +
        (day.lunch?.length || 0) +
        (day.dinner?.length || 0)
      );
    }, 0);
  }, [mealPlans]);

  return (
    <div className="space-y-8">
      {/* Top Roulette Idea Spark Section */}
      <MealIdeaRoulette onSelectRecipe={onSelectRecipe} onCookRecipe={onCookRecipe} />

      {/* Meal Planner Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200/80 dark:border-stone-800">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            <span>Weekly Meal Plan</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Plan breakfast, lunch, and dinner (main dishes, sides, salads, appetizers) for the week and generate your grocery list.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddWeekToShopping}
            disabled={totalPlannedDishes === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Week to Shopping List</span>
          </button>

          {totalPlannedDishes > 0 && (
            <button
              onClick={clearEntireWeek}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
              title="Clear Whole Week"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {addedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* Days Grid (Monday - Sunday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {mealPlans.map((day) => {
          const dayDishCount =
            (day.breakfast?.length || 0) + (day.lunch?.length || 0) + (day.dinner?.length || 0);

          return (
            <div
              key={day.dayName}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
                <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  {day.dayName}
                </span>
                {dayDishCount > 0 ? (
                  <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                    {dayDishCount} {dayDishCount === 1 ? 'dish' : 'dishes'}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400">Empty</span>
                )}
              </div>

              {/* Meal Slots (Breakfast, Lunch, Dinner) */}
              <div className="space-y-3.5 flex-1">
                {MEAL_CONFIG.map(({ type, label, icon: MealIcon, badgeBg, badgeText, cardBg, cardBorder }) => {
                  const recipeIds = day[type] || [];
                  const recipeList = recipeIds
                    .map((id) => getRecipeById(id))
                    .filter((r): r is Recipe => Boolean(r));

                  return (
                    <div key={type} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`p-1 rounded-md ${badgeBg} ${badgeText}`}>
                            <MealIcon className="w-3 h-3" />
                          </span>
                          <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                            {label}
                          </span>
                        </div>

                        {recipeList.length > 0 && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('all');
                              setActiveSlotModal({ dayName: day.dayName, mealType: type });
                            }}
                            className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                            title={`Add another dish to ${day.dayName} ${label}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>

                      {/* List of Recipes in this Meal Slot */}
                      {recipeList.length > 0 ? (
                        <div className="space-y-1.5">
                          {recipeList.map((recipe, idx) => (
                            <div
                              key={`${recipe.id}-${idx}`}
                              className={`${cardBg} border ${cardBorder} rounded-xl p-2 space-y-1 relative group hover:border-brand-300 dark:hover:border-brand-700 transition-colors`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p
                                  onClick={() => onSelectRecipe(recipe)}
                                  className="text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 leading-snug line-clamp-2"
                                >
                                  {recipe.frontmatter.title}
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => onCookRecipe(recipe)}
                                    className="p-1 rounded text-stone-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Cook this recipe"
                                  >
                                    <Flame className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => removeRecipeFromMeal(day.dayName, type, recipe.id, idx)}
                                    className="p-1 rounded text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from meal"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                                <span>{recipe.category}</span>
                                {recipe.frontmatter.prep_time && (
                                  <span>• {recipe.frontmatter.prep_time}m</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setActiveSlotModal({ dayName: day.dayName, mealType: type });
                          }}
                          className="w-full border border-dashed border-stone-200 dark:border-stone-800 hover:border-brand-400 dark:hover:border-brand-600 rounded-xl p-2 text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add {label}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Pick Recipe for Day Slot */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  Add to {activeSlotModal.dayName}{' '}
                  <span className="capitalize">{activeSlotModal.mealType}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Select a main dish, salad, side, soup, or dessert
                </p>
              </div>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipe by title, category, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-brand-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  All ({recipes.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-brand-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Recipes List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 pr-1">
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((r) => {
                  const targetDay = mealPlans.find((d) => d.dayName === activeSlotModal.dayName);
                  const isAlreadyInSlot = targetDay?.[activeSlotModal.mealType]?.includes(r.id);

                  return (
                    <div
                      key={r.id}
                      onClick={async () => {
                        await addRecipeToMeal(
                          activeSlotModal.dayName,
                          activeSlotModal.mealType,
                          r.id
                        );
                        setActiveSlotModal(null);
                      }}
                      className="py-3 px-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 rounded-xl transition-colors group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-stone-800 dark:text-stone-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {r.frontmatter.title}
                          </h4>
                          {isAlreadyInSlot && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Already Added
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span>{r.category}</span>
                          <span>•</span>
                          <span>{r.ingredients.length} ingredients</span>
                          {r.frontmatter.prep_time && (
                            <>
                              <span>•</span>
                              <span>{r.frontmatter.prep_time}m prep</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        Add +
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-stone-400 space-y-1">
                  <p className="text-sm font-medium">No recipes found</p>
                  <p className="text-xs">Try adjusting your search query or category filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
