import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useRecipes } from '../../context/RecipeContext';
import { Recipe } from '../../types/recipe';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectRecipe
}) => {
  const { recipes } = useRecipes();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const results = q
    ? recipes.filter((r) => {
        const titleMatch = r.frontmatter.title.toLowerCase().includes(q);
        const catMatch = r.category.toLowerCase().includes(q);
        const tagMatch = r.frontmatter.tags?.some((t) => t.toLowerCase().includes(q));
        const ingMatch = r.ingredients.some((ing) => ing.raw.toLowerCase().includes(q));
        return titleMatch || catMatch || tagMatch || ingMatch;
      })
    : recipes.slice(0, 8);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-200"
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-stone-200 dark:border-stone-800 p-4 flex items-center">
          <Search className="w-5 h-5 text-stone-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type recipe name, ingredient (e.g. garlic, chicken), or cuisine..."
            className="w-full pl-3 pr-10 py-1 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm sm:text-base focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80 p-2">
          {results.length > 0 ? (
            results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  onSelectRecipe(r);
                  onClose();
                }}
                className="p-3 rounded-2xl flex items-center justify-between hover:bg-brand-50/70 dark:hover:bg-brand-950/40 cursor-pointer transition-colors group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                      {r.category}
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="text-[11px] text-stone-400">
                      {r.ingredients.length} ingredients
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {r.frontmatter.title}
                  </h4>
                </div>

                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-brand-500 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-stone-400">
              No matching recipes found for "{query}".
            </div>
          )}
        </div>

        {/* Modal Footer Keybind Info */}
        <div className="bg-stone-50 dark:bg-stone-800/60 px-4 py-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>{results.length} recipes</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
