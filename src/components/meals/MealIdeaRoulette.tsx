import React, { useState } from 'react';
import { Sparkles, Dices, Flame, BookOpen, Clock, Users } from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { useRecipes } from '../../context/RecipeContext';
import { Badge } from '../common/Badge';

interface MealIdeaRouletteProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
}

export const MealIdeaRoulette: React.FC<MealIdeaRouletteProps> = ({
  onSelectRecipe,
  onCookRecipe
}) => {
  const { recipes, categories, getRandomRecipe } = useRecipes();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [suggestedRecipe, setSuggestedRecipe] = useState<Recipe | null>(() => getRandomRecipe());
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const catFilter = selectedCategory === 'All' ? undefined : selectedCategory;
      const pick = getRandomRecipe(catFilter);
      if (pick) setSuggestedRecipe(pick);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 90);
  };

  return (
    <div className="bg-gradient-to-br from-brand-500/10 via-amber-500/5 to-transparent border border-brand-200/80 dark:border-brand-900/60 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Recipe Roulette & Idea Spark</span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            Can’t decide what to cook?
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Let MD-Chef pick a delicious meal idea from your repository collection.
          </p>
        </div>

        {/* Filter and Spin Button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 focus:outline-none"
          >
            <option value="All">Any Cuisine</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={handleSpin}
            disabled={isSpinning || recipes.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all ${
              isSpinning ? 'opacity-80' : ''
            }`}
          >
            <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Choosing...' : 'Surprise Me!'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Recipe Display Card */}
      {suggestedRecipe && (
        <div
          className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm transition-all duration-300 ${
            isSpinning ? 'scale-98 opacity-70 blur-[1px]' : 'scale-100 opacity-100'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="brand">{suggestedRecipe.category}</Badge>
                {suggestedRecipe.frontmatter.difficulty && (
                  <Badge variant="stone">{suggestedRecipe.frontmatter.difficulty}</Badge>
                )}
              </div>

              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                {suggestedRecipe.frontmatter.title}
              </h3>

              <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                {(suggestedRecipe.frontmatter.cook_time || suggestedRecipe.frontmatter.prep_time) && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {suggestedRecipe.frontmatter.cook_time || suggestedRecipe.frontmatter.prep_time}
                  </span>
                )}
                {suggestedRecipe.frontmatter.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    {suggestedRecipe.frontmatter.servings} servings
                  </span>
                )}
                <span>{suggestedRecipe.ingredients.length} ingredients</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={() => onSelectRecipe(suggestedRecipe)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-bold transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Recipe</span>
              </button>

              <button
                onClick={() => onCookRecipe(suggestedRecipe)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Cook Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

