import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Flame,
  ShoppingBag,
  Share2,
  Calendar,
  Heart,
  Clock,
  Users,
  Check,
  Copy,
  Mail,
  ExternalLink,
  Plus,
  Minus,
  Timer as TimerIcon,
  FileCode,
  RotateCcw,
  User,
  Globe
} from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { Badge } from '../common/Badge';
import { scaleIngredientQuantity } from '../../services/markdownParser';
import { useShopping } from '../../context/ShoppingContext';
import { useMealPlan } from '../../context/MealPlanContext';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onStartCooking: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack,
  onStartCooking,
  onToggleFavorite
}) => {
  const { addIngredientsFromRecipe } = useShopping();
  const { setMealForDay } = useMealPlan();

  const baseServings = recipe.frontmatter.servings || 4;
  const [servings, setServings] = useState<number>(baseServings);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMealPlanMenu, setShowMealPlanMenu] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [addedToCartNotice, setAddedToCartNotice] = useState(false);

  const scaleFactor = servings / baseServings;

  const toggleIngredientCheck = (id: string) => {
    const next = new Set(checkedIngredients);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIngredients(next);
  };

  const toggleStepCheck = (idx: number) => {
    const next = new Set(checkedSteps);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCheckedSteps(next);
  };

  const handleAddAllToCart = async () => {
    await addIngredientsFromRecipe(recipe, scaleFactor);
    setAddedToCartNotice(true);
    setTimeout(() => setAddedToCartNotice(false), 2500);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/recipe/${encodeURIComponent(recipe.path)}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: recipe.frontmatter.title,
          text: `Check out this recipe for ${recipe.frontmatter.title} on MD-Chef!`,
          url
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    setShowShareMenu(true);
  };

  const copyRecipeLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/recipe/${encodeURIComponent(recipe.path)}`;
    navigator.clipboard.writeText(url);
    setCopiedNotice('Recipe link copied to clipboard!');
    setTimeout(() => setCopiedNotice(null), 2500);
    setShowShareMenu(false);
  };

  const groupedIngredients = useMemo(() => {
    const groups: { section?: string; items: typeof recipe.ingredients }[] = [];
    let currentGroup: { section?: string; items: typeof recipe.ingredients } | null = null;

    for (const ing of recipe.ingredients) {
      if (!currentGroup || currentGroup.section !== ing.section) {
        currentGroup = { section: ing.section, items: [ing] };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push(ing);
      }
    }
    return groups;
  }, [recipe.ingredients]);

  const groupedInstructions = useMemo(() => {
    const groups: { section?: string; items: { step: typeof recipe.instructions[0]; globalIdx: number }[] }[] = [];
    let currentGroup: { section?: string; items: { step: typeof recipe.instructions[0]; globalIdx: number }[] } | null = null;

    recipe.instructions.forEach((step, idx) => {
      if (!currentGroup || currentGroup.section !== step.section) {
        currentGroup = { section: step.section, items: [{ step, globalIdx: idx }] };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push({ step, globalIdx: idx });
      }
    });
    return groups;
  }, [recipe.instructions]);

  const copyFormattedRecipeText = () => {
    let text = `🍳 ${recipe.frontmatter.title}\n`;
    if (recipe.frontmatter.servings) text += `Servings: ${servings}\n`;
    if (recipe.frontmatter.prep_time) text += `Prep: ${recipe.frontmatter.prep_time} | `;
    if (recipe.frontmatter.cook_time) text += `Cook: ${recipe.frontmatter.cook_time}\n`;
    text += `\n--- INGREDIENTS ---\n`;
    let lastSection: string | undefined = undefined;
    recipe.ingredients.forEach((ing) => {
      if (ing.section && ing.section !== lastSection) {
        text += `\n[${ing.section}]\n`;
        lastSection = ing.section;
      }
      text += `• ${scaleIngredientQuantity(ing.raw, scaleFactor)}\n`;
    });
    text += `\n--- INSTRUCTIONS ---\n`;
    let lastInstSection: string | undefined = undefined;
    recipe.instructions.forEach((step, i) => {
      if (step.section && step.section !== lastInstSection) {
        text += `\n[${step.section}]\n`;
        lastInstSection = step.section;
      }
      text += `${i + 1}. ${step.text}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedNotice('Full recipe text copied!');
    setTimeout(() => setCopiedNotice(null), 2500);
    setShowShareMenu(false);
  };

  const emailRecipe = () => {
    const subject = encodeURIComponent(`Recipe: ${recipe.frontmatter.title}`);
    let body = `Hi!\n\nHere is the recipe for ${recipe.frontmatter.title} (${servings} servings):\n\nINGREDIENTS:\n`;
    let lastSection: string | undefined = undefined;
    recipe.ingredients.forEach((ing) => {
      if (ing.section && ing.section !== lastSection) {
        body += `\n[${ing.section}]\n`;
        lastSection = ing.section;
      }
      body += `- ${scaleIngredientQuantity(ing.raw, scaleFactor)}\n`;
    });
    body += `\nINSTRUCTIONS:\n`;
    let lastInstSection: string | undefined = undefined;
    recipe.instructions.forEach((step, i) => {
      if (step.section && step.section !== lastInstSection) {
        body += `\n[${step.section}]\n`;
        lastInstSection = step.section;
      }
      body += `${i + 1}. ${step.text}\n`;
    });
    body += `\nShared via MD-Chef Recipe Companion`;

    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    setShowShareMenu(false);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Navigation & Action Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Recipes</span>
        </button>

        <div className="flex items-center gap-2 relative">
          {/* Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs transition-colors"
            title="Toggle Favorite"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium shadow-xs transition-colors"
              title="Share Recipe"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Share Popover Menu */}
            {showShareMenu && (
              <div className="absolute right-0 top-12 z-20 w-56 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                <button
                  onClick={copyRecipeLink}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/60 rounded-lg text-left"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  <span>Copy Web Link</span>
                </button>
                <button
                  onClick={copyFormattedRecipeText}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/60 rounded-lg text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                  <span>Copy Full Recipe Text</span>
                </button>
                <button
                  onClick={emailRecipe}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/60 rounded-lg text-left"
                >
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>Send via Email</span>
                </button>
              </div>
            )}
          </div>

          {/* Add to Meal Plan Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMealPlanMenu(!showMealPlanMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">Meal Plan</span>
            </button>

            {showMealPlanMenu && (
              <div className="absolute right-0 top-12 z-20 w-48 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl p-2 space-y-1">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 py-1">
                  Assign Dinner To:
                </p>
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={async () => {
                      await setMealForDay(day, 'dinner', recipe.id);
                      setShowMealPlanMenu(false);
                      setCopiedNotice(`Added to ${day}'s Dinner!`);
                      setTimeout(() => setCopiedNotice(null), 2500);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 dark:text-stone-200 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 rounded-lg transition-colors"
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Big Start Cooking Button */}
          <button
            onClick={() => onStartCooking(recipe)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>Cooking Mode</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {copiedNotice && (
        <div className="bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl text-center shadow-lg animate-in fade-in">
          {copiedNotice}
        </div>
      )}

      {/* Recipe Header Card */}
      <header className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand" size="md">
            {recipe.category}
          </Badge>
          {recipe.frontmatter.difficulty && (
            <Badge variant="stone" size="md">
              {recipe.frontmatter.difficulty}
            </Badge>
          )}
          <span className="text-xs text-stone-400 font-mono">
            {recipe.path}
          </span>
        </div>

        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
          {recipe.frontmatter.title}
        </h1>

        {recipe.frontmatter.description && (
          <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
            {recipe.frontmatter.description}
          </p>
        )}

        {/* Prominent Attribution: Credit & Source */}
        {(recipe.frontmatter.credit || recipe.frontmatter.source) && (
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
            {recipe.frontmatter.credit && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg border border-stone-200 dark:border-stone-700/80 font-medium shadow-2xs">
                <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>Credit: <strong className="text-stone-900 dark:text-stone-100 font-semibold">{recipe.frontmatter.credit}</strong></span>
              </span>
            )}
            {recipe.frontmatter.source && (
              /^https?:\/\//i.test(recipe.frontmatter.source) ? (
                <a
                  href={recipe.frontmatter.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50/80 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 rounded-lg border border-brand-200 dark:border-brand-800/80 font-medium transition-colors shadow-2xs group"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Source:{' '}
                    <span className="underline decoration-brand-400 underline-offset-2">
                      {(() => {
                        try {
                          return new URL(recipe.frontmatter.source).hostname.replace(/^www\./, '');
                        } catch {
                          return 'Website';
                        }
                      })()}
                    </span>
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg border border-stone-200 dark:border-stone-700/80 font-medium shadow-2xs">
                  <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>Source: <strong className="text-stone-900 dark:text-stone-100 font-semibold">{recipe.frontmatter.source}</strong></span>
                </span>
              )
            )}
          </div>
        )}

        {/* Recipe Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          {recipe.frontmatter.prep_time && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                Prep Time
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-brand-500" />
                {recipe.frontmatter.prep_time}
              </span>
            </div>
          )}

          {recipe.frontmatter.cook_time && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
                Cook Time
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm flex items-center gap-1.5 mt-0.5">
                <Flame className="w-4 h-4 text-amber-500" />
                {recipe.frontmatter.cook_time}
              </span>
            </div>
          )}

          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
              Servings
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <Users className="w-4 h-4 text-brand-500" />
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-6 h-6 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold w-6 text-center text-stone-800 dark:text-stone-200">
                  {servings}
                </span>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="w-6 h-6 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {scaleFactor !== 1 && (
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                  ({scaleFactor}x)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
              Ingredients
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm mt-0.5 block">
              {recipe.ingredients.length} items
            </span>
          </div>
        </div>

        {/* Tags */}
        {recipe.frontmatter.tags && recipe.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {recipe.frontmatter.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Main Two-Column Content: Ingredients Checklist & Step Directions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ingredients Column (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Ingredients</span>
                <span className="text-xs font-sans font-normal text-stone-400">
                  ({recipe.ingredients.length})
                </span>
              </h2>

              {checkedIngredients.size > 0 && (
                <button
                  onClick={() => setCheckedIngredients(new Set())}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors px-2 py-0.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Reset checked ingredients"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({checkedIngredients.size})</span>
                </button>
              )}
            </div>

            <button
              onClick={handleAddAllToCart}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                addedToCartNotice
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {addedToCartNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Added to List!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
                  <span>Add to List</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-5">
            {groupedIngredients.map((group, gIdx) => (
              <div key={group.section || `ing-group-${gIdx}`} className={gIdx > 0 ? 'pt-4 border-t border-stone-100 dark:border-stone-800' : ''}>
                {group.section && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <h3 className="font-serif font-bold text-sm tracking-wide text-brand-700 dark:text-brand-400">
                      {group.section}
                    </h3>
                    <span className="text-[11px] font-sans font-medium text-stone-400 dark:text-stone-500">
                      ({group.items.length})
                    </span>
                  </div>
                )}

                <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {group.items.map((ing) => {
                    const isChecked = checkedIngredients.has(ing.id);
                    const scaledText = scaleIngredientQuantity(ing.raw, scaleFactor);

                    return (
                      <div
                        key={ing.id}
                        onClick={() => toggleIngredientCheck(ing.id)}
                        className="py-3 flex items-start gap-3 cursor-pointer group hover:bg-stone-50/50 dark:hover:bg-stone-800/30 px-1 rounded-lg transition-colors"
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-stone-300 dark:border-stone-600 group-hover:border-stone-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <span
                          className={`text-sm leading-snug transition-all ${
                            isChecked
                              ? 'text-stone-400 dark:text-stone-500 line-through'
                              : 'text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          {scaledText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Instructions Column (7 cols) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Instructions</span>
                <span className="text-xs font-sans font-normal text-stone-400">
                  ({recipe.instructions.length} steps)
                </span>
              </h2>

              {checkedSteps.size > 0 && (
                <button
                  onClick={() => setCheckedSteps(new Set())}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors px-2 py-0.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Reset completed steps"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({checkedSteps.size}/{recipe.instructions.length})</span>
                </button>
              )}
            </div>

            <button
              onClick={() => onStartCooking(recipe)}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Step-by-Step Mode</span>
            </button>
          </div>

          <div className="space-y-6">
            {groupedInstructions.map((group, gIdx) => (
              <div key={group.section || `inst-group-${gIdx}`} className="space-y-3">
                {group.section && (
                  <div className="flex items-center gap-2 pt-1 px-1">
                    <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
                      {group.section}
                    </h3>
                    <span className="text-xs font-sans font-medium text-stone-400 dark:text-stone-500">
                      ({group.items.length} {group.items.length === 1 ? 'step' : 'steps'})
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {group.items.map(({ step, globalIdx }) => {
                    const isDone = checkedSteps.has(globalIdx);

                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStepCheck(globalIdx)}
                        className={`border rounded-2xl p-5 shadow-xs flex items-start gap-4 cursor-pointer group transition-all ${
                          isDone
                            ? 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800/60'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-brand-300 dark:hover:border-brand-700'
                        }`}
                      >
                        {/* Step Checkbox & Number Badge */}
                        <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                : 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 group-hover:border-brand-500 text-transparent'
                            }`}
                            title={isDone ? 'Mark step incomplete' : 'Mark step complete'}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <span
                            className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center border transition-colors ${
                              isDone
                                ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700'
                                : 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200/60 dark:border-brand-800/60'
                            }`}
                          >
                            {globalIdx + 1}
                          </span>
                        </div>

                        <div className="space-y-3 flex-1">
                          <p
                            className={`text-sm sm:text-base leading-relaxed transition-all ${
                              isDone
                                ? 'text-stone-400 dark:text-stone-500 line-through'
                                : 'text-stone-800 dark:text-stone-200'
                            }`}
                          >
                            {step.text}
                          </p>

                          {/* Detected Timers in Step */}
                          {step.timers.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {step.timers.map((timer, tIdx) => (
                                <div
                                  key={tIdx}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold"
                                >
                                  <TimerIcon className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{timer.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recipe Footer: Source Credit & Raw Markdown Toggle */}
      <footer className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex flex-wrap items-center gap-3">
          {recipe.frontmatter.credit && (
            <span>Recipe Credit: <strong className="text-stone-700 dark:text-stone-300">{recipe.frontmatter.credit}</strong></span>
          )}
          {recipe.frontmatter.source && (
            /^https?:\/\//i.test(recipe.frontmatter.source) ? (
              <a
                href={recipe.frontmatter.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Original Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span>Source: <strong className="text-stone-700 dark:text-stone-300">{recipe.frontmatter.source}</strong></span>
            )
          )}
        </div>

        <button
          onClick={() => setShowRawMarkdown(!showRawMarkdown)}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{showRawMarkdown ? 'Hide Raw Markdown' : 'View Git Markdown Source'}</span>
        </button>
      </footer>

      {/* Raw Markdown Source Viewer */}
      {showRawMarkdown && (
        <pre className="p-4 bg-stone-900 text-stone-200 rounded-2xl overflow-x-auto text-xs font-mono border border-stone-800">
          <code>{recipe.rawContent}</code>
        </pre>
      )}
    </article>
  );
};
