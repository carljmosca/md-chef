import React from 'react';
import { Clock, Users, Heart, Flame } from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { Badge } from '../common/Badge';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onCook: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onCook,
  onToggleFavorite
}) => {
  const { title, prep_time, cook_time, servings, difficulty, tags, credit, source } = recipe.frontmatter;

  // Category color accents
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'italian':
      case 'pasta':
        return 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40';
      case 'asian':
      case 'thai':
        return 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40';
      case 'mexican':
        return 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40';
      case 'beef':
      case 'pork':
      case 'chicken':
        return 'border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40';
      case 'deserrts':
      case 'dessert':
        return 'border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/40';
      default:
        return 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800';
    }
  };

  const getDifficultyVariant = (diff?: string) => {
    const d = diff?.toLowerCase();
    if (d === 'easy') return 'green';
    if (d === 'hard') return 'amber';
    return 'blue';
  };

  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
    >
      {/* Top Bar: Category Pill & Favorite */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryColor(
              recipe.category
            )}`}
          >
            {recipe.category}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe.id);
            }}
            className="p-1.5 rounded-full text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug mb-1">
          {title}
        </h3>

        {(credit || source) && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 truncate">
            by{' '}
            <span className="font-medium text-stone-700 dark:text-stone-300">
              {credit ||
                (/^https?:\/\//i.test(source!)
                  ? (() => {
                      try {
                        return new URL(source!).hostname.replace(/^www\./, '');
                      } catch {
                        return 'Source';
                      }
                    })()
                  : source)}
            </span>
          </p>
        )}

        {/* Meta Stats: Time, Servings, Difficulty */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-stone-500 dark:text-stone-400 mb-4">
          {(prep_time || cook_time) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{cook_time ? `${cook_time}` : `${prep_time}`}</span>
            </div>
          )}

          {servings && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span>{servings} servings</span>
            </div>
          )}

          {difficulty && (
            <Badge variant={getDifficultyVariant(difficulty)} size="sm">
              {difficulty}
            </Badge>
          )}
        </div>

        {/* Tags preview */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-stone-400 self-center">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Summary & Quick Cook Button */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between mt-auto">
        <div className="text-xs text-stone-400 dark:text-stone-500">
          <span>{recipe.ingredients.length} ingredients</span>
          <span className="mx-1.5">•</span>
          <span>{recipe.instructions.length} steps</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCook(recipe);
          }}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-500 text-brand-700 hover:text-white dark:bg-brand-950/50 dark:text-brand-300 dark:hover:bg-brand-600 dark:hover:text-white transition-all shadow-xs"
          title="Start Cooking Mode"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Cook</span>
        </button>
      </div>
    </div>
  );
};
