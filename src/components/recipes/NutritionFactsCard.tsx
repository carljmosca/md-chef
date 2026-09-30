import React, { useState } from 'react';
import { Flame, PieChart, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import type { Recipe } from '../../types/recipe.ts';
import { analyzeRecipeNutrition } from '../../services/nutrition.ts';
import { Badge } from '../common/Badge.tsx';

interface NutritionFactsCardProps {
  recipe: Recipe;
  servings: number;
}

export const NutritionFactsCard: React.FC<NutritionFactsCardProps> = ({ recipe, servings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const nutrition = analyzeRecipeNutrition(recipe, servings);
  const { perServing, total, percentDailyValue, macroPercentages, dietaryHighlights } = nutrition;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Header Banner - Toggleable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                Nutritional Breakdown
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                USDA Reference
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              ~<strong className="text-stone-800 dark:text-stone-200 font-semibold">{perServing.calories} kcal</strong> per serving ({servings} servings)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Macro Pills */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              {perServing.protein}g Protein
            </span>
            <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
              {perServing.carbohydrates}g Carbs
            </span>
            <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
              {perServing.fat}g Fat
            </span>
          </div>

          <div className="p-1 rounded-lg text-stone-400">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expanded Nutrition Dashboard */}
      {isOpen && (
        <div className="p-5 border-t border-stone-100 dark:border-stone-800 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Dietary Highlight Badges */}
          {dietaryHighlights.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {dietaryHighlights.map((badge, idx) => (
                <Badge key={idx} variant="green" size="sm">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Macro Distribution Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-brand-500" />
                Calorie Distribution
              </span>
              <span>
                {macroPercentages.protein}% Protein • {macroPercentages.carbs}% Carbs • {macroPercentages.fat}% Fat
              </span>
            </div>

            <div className="w-full h-3 rounded-full overflow-hidden flex bg-stone-100 dark:bg-stone-800 shadow-inner">
              <div
                style={{ width: `${macroPercentages.protein}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Protein: ${macroPercentages.protein}%`}
              />
              <div
                style={{ width: `${macroPercentages.carbs}%` }}
                className="bg-blue-500 transition-all duration-300"
                title={`Carbohydrates: ${macroPercentages.carbs}%`}
              />
              <div
                style={{ width: `${macroPercentages.fat}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Fat: ${macroPercentages.fat}%`}
              />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">Calories</span>
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{perServing.calories}</span>
              <span className="text-[10px] text-stone-400 block">{percentDailyValue.calories}% Daily Value</span>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">Protein</span>
              <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{perServing.protein}g</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">{percentDailyValue.protein}% Daily Value</span>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold block">Carbs</span>
              <span className="text-xl font-bold text-blue-800 dark:text-blue-200">{perServing.carbohydrates}g</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block">{percentDailyValue.carbohydrates}% Daily Value</span>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
              <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">Fat</span>
              <span className="text-xl font-bold text-amber-800 dark:text-amber-200">{perServing.fat}g</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block">{percentDailyValue.fat}% Daily Value</span>
            </div>
          </div>

          {/* Detailed Nutrient Table */}
          <div className="text-xs divide-y divide-stone-100 dark:divide-stone-800 border-t border-b border-stone-200 dark:border-stone-800">
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Saturated Fat</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.saturatedFat}g ({percentDailyValue.saturatedFat}% DV)</span>
            </div>
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Dietary Fiber</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.fiber}g ({percentDailyValue.fiber}% DV)</span>
            </div>
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Sugars</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.sugar}g</span>
            </div>
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Sodium</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.sodium}mg ({percentDailyValue.sodium}% DV)</span>
            </div>
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Potassium</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.potassium}mg ({percentDailyValue.potassium}% DV)</span>
            </div>
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Calcium</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.calcium}mg ({percentDailyValue.calcium}% DV)</span>
            </div>
            <div className="py-2 flex items-center justify-between font-semibold">
              <span className="text-stone-700 dark:text-stone-300">Iron</span>
              <span className="text-stone-900 dark:text-stone-100">{perServing.iron}mg ({percentDailyValue.iron}% DV)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Entire Recipe Total: {total.calories} kcal ({total.protein}g protein, {total.carbohydrates}g carbs, {total.fat}g fat)</span>
            <span className="italic">*Percent Daily Values based on a 2,000 calorie diet</span>
          </div>
        </div>
      )}
    </div>
  );
};
