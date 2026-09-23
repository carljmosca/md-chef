import React, { useState } from 'react';
import { Calendar, Plus, X, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { useMealPlan } from '../../context/MealPlanContext';
import { useRecipes } from '../../context/RecipeContext';
import { useShopping } from '../../context/ShoppingContext';
import { MealIdeaRoulette } from './MealIdeaRoulette';
import { Recipe } from '../../types/recipe';

interface MealPlannerViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
}

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  onSelectRecipe,
  onCookRecipe
}) => {
  const { mealPlans, setMealForDay, clearDayMeal, clearEntireWeek, addAllMealsToShoppingList } =
    useMealPlan();
  const { recipes, getRecipeById } = useRecipes();
  const { addIngredientsFromRecipe } = useShopping();

  const [activeSlotModal, setActiveSlotModal] = useState<{
    dayName: string;
    mealType: 'breakfast' | 'lunch' | 'dinner';
  } | null>(null);

  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const handleAddWeekToShopping = async () => {
    const totalAdded = await addAllMealsToShoppingList(recipes, (r) =>
      addIngredientsFromRecipe(r, 1)
    );
    setAddedNotice(`Added ${totalAdded} ingredients to your Shopping List!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Roulette Idea Spark Section */}
      <MealIdeaRoulette onSelectRecipe={onSelectRecipe} onCookRecipe={onCookRecipe} />

      {/* Meal Planner Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            <span>Weekly Meal Plan</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Plan your dinners for the week and generate your complete grocery shopping list in one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddWeekToShopping}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Week to Shopping List</span>
          </button>

          <button
            onClick={clearEntireWeek}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
            title="Clear Whole Week"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {addedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* Days Grid (Monday - Sunday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {mealPlans.map((day) => {
          const dinnerRecipe = day.dinner ? getRecipeById(day.dinner) : undefined;
          const lunchRecipe = day.lunch ? getRecipeById(day.lunch) : undefined;

          return (
            <div
              key={day.dayName}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  {day.dayName}
                </span>
              </div>

              {/* Dinner Slot */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Dinner
                </span>

                {dinnerRecipe ? (
                  <div className="bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 rounded-xl p-2.5 space-y-1 relative group">
                    <button
                      onClick={() => clearDayMeal(day.dayName, 'dinner')}
                      className="absolute top-1 right-1 p-1 rounded-md text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p
                      onClick={() => onSelectRecipe(dinnerRecipe)}
                      className="text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 leading-snug line-clamp-2"
                    >
                      {dinnerRecipe.frontmatter.title}
                    </p>
                    <span className="text-[10px] text-stone-400 block">
                      {dinnerRecipe.category}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveSlotModal({ dayName: day.dayName, mealType: 'dinner' })}
                    className="w-full border border-dashed border-stone-300 dark:border-stone-700 hover:border-brand-400 rounded-xl p-2 text-stone-400 hover:text-brand-600 text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Recipe</span>
                  </button>
                )}
              </div>

              {/* Lunch Slot */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Lunch (Optional)
                </span>

                {lunchRecipe ? (
                  <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 space-y-1 relative group">
                    <button
                      onClick={() => clearDayMeal(day.dayName, 'lunch')}
                      className="absolute top-1 right-1 p-1 rounded-md text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p
                      onClick={() => onSelectRecipe(lunchRecipe)}
                      className="text-xs font-medium text-stone-800 dark:text-stone-200 cursor-pointer hover:text-brand-600 leading-snug line-clamp-1"
                    >
                      {lunchRecipe.frontmatter.title}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveSlotModal({ dayName: day.dayName, mealType: 'lunch' })}
                    className="w-full border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-300 rounded-xl p-1.5 text-stone-400 hover:text-stone-600 text-[11px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Pick Recipe for Day Slot */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Choose recipe for {activeSlotModal.dayName} {activeSlotModal.mealType}
              </h3>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 pr-1">
              {recipes.map((r) => (
                <div
                  key={r.id}
                  onClick={async () => {
                    await setMealForDay(
                      activeSlotModal.dayName,
                      activeSlotModal.mealType,
                      r.id
                    );
                    setActiveSlotModal(null);
                  }}
                  className="py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 rounded-xl transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-stone-800 dark:text-stone-200">
                      {r.frontmatter.title}
                    </h4>
                    <span className="text-xs text-stone-400">
                      {r.category} • {r.ingredients.length} items
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    Select
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

