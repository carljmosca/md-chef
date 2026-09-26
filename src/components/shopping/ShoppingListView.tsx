import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Copy,
  Share2,
  CheckCheck,
  Lightbulb,
  ExternalLink,
  X
} from 'lucide-react';
import { useShopping } from '../../context/ShoppingContext';
import { ShoppingItem } from '../../types/recipe';
import { formatForGoogleKeep, openGoogleKeep } from '../../services/shoppingFormat';

const AISLES: ShoppingItem['category'][] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Refrigerated',
  'Pantry & Dry Goods',
  'Spices & Seasonings',
  'Bakery',
  'Other'
];

const AISLE_ICONS: Record<ShoppingItem['category'], string> = {
  Produce: '🥬',
  'Meat & Seafood': '🥩',
  'Dairy & Refrigerated': '🧀',
  'Pantry & Dry Goods': '🥫',
  'Spices & Seasonings': '🧂',
  Bakery: '🥖',
  Other: '📦'
};

export const ShoppingListView: React.FC = () => {
  const {
    items,
    addItem,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
    getFormattedText,
    checkedCount,
    totalCount
  } = useShopping();

  const [newItemName, setNewItemName] = useState('');
  const [selectedAisle, setSelectedAisle] = useState<ShoppingItem['category']>('Produce');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const [isKeepModalOpen, setIsKeepModalOpen] = useState(false);
  const [keepUncheckedOnly, setKeepUncheckedOnly] = useState(true);
  const [keepIncludeCategories, setKeepIncludeCategories] = useState(false);

  const keepPreviewText = useMemo(() => {
    return formatForGoogleKeep(items, {
      uncheckedOnly: keepUncheckedOnly,
      includeCategories: keepIncludeCategories
    });
  }, [items, keepUncheckedOnly, keepIncludeCategories]);

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addItem(newItemName, selectedAisle);
    setNewItemName('');
  };

  const handleCopyText = () => {
    const text = getFormattedText();
    navigator.clipboard.writeText(text);
    setCopiedNotice('Shopping list copied to clipboard!');
    setTimeout(() => setCopiedNotice(null), 2500);
  };

  const handleShare = async () => {
    const text = getFormattedText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'MD-Chef Grocery List',
          text
        });
        return;
      } catch {
        // Fallback
      }
    }
    handleCopyText();
  };

  const handleCopyAndOpenKeep = () => {
    if (!keepPreviewText) return;
    navigator.clipboard.writeText(keepPreviewText);
    setCopiedNotice('✓ Checklist copied! Opening Google Keep...');
    setTimeout(() => setCopiedNotice(null), 3000);
    openGoogleKeep();
  };

  const handleCopyKeepText = () => {
    if (!keepPreviewText) return;
    navigator.clipboard.writeText(keepPreviewText);
    setCopiedNotice('✓ Google Keep checklist copied to clipboard!');
    setTimeout(() => setCopiedNotice(null), 2500);
  };

  const handleShareToKeep = async () => {
    if (!keepPreviewText) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Grocery List',
          text: keepPreviewText
        });
        return;
      } catch {
        // Fallback
      }
    }
    handleCopyAndOpenKeep();
  };

  // Group items by aisle
  const groupedItems = AISLES.map((aisle) => ({
    aisle,
    items: items.filter((it) => it.category === aisle)
  })).filter((group) => group.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-600" />
            <span>Grocery Shopping List</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            {totalCount === 0
              ? 'No items in list'
              : `${checkedCount} of ${totalCount} items completed`}
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKeepModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-semibold shadow-xs transition-colors"
              title="Add or copy to Google Keep"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Google Keep</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 text-xs font-semibold shadow-xs transition-colors"
              title="Share or Copy List"
            >
              <Share2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Share</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 text-xs font-semibold shadow-xs transition-colors"
              title="Copy formatted text"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            {checkedCount > 0 && (
              <button
                onClick={clearChecked}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 text-xs font-medium transition-colors"
                title="Clear Checked"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Clear Checked</span>
              </button>
            )}

            <button
              onClick={clearAll}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear entire list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {copiedNotice && (
        <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl text-center shadow-lg animate-in fade-in">
          {copiedNotice}
        </div>
      )}

      {/* Add Custom Item Input */}
      <form
        onSubmit={handleAddNewItem}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-2"
      >
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add grocery item (e.g. olive oil, 2 lemons, milk)..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
        />

        <select
          value={selectedAisle}
          onChange={(e) => setSelectedAisle(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs focus:outline-none"
        >
          {AISLES.map((a) => (
            <option key={a} value={a}>
              {AISLE_ICONS[a]} {a}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Grouped Aisle Lists */}
      {groupedItems.length > 0 ? (
        <div className="space-y-4">
          {groupedItems.map(({ aisle, items: aisleItems }) => (
            <div
              key={aisle}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>{AISLE_ICONS[aisle]}</span>
                  <span>{aisle}</span>
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {aisleItems.length}
                </span>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
                {aisleItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="py-2.5 px-1 flex items-center justify-between group cursor-pointer hover:bg-stone-50/60 dark:hover:bg-stone-800/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          item.checked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-stone-300 dark:border-stone-600 group-hover:border-stone-400'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <span
                          className={`text-sm leading-snug transition-all ${
                            item.checked
                              ? 'text-stone-400 dark:text-stone-500 line-through'
                              : 'text-stone-800 dark:text-stone-200 font-medium'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.recipeSource && (
                          <span className="text-[10px] text-stone-400 block">
                            from {item.recipeSource}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="p-1 rounded-md text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Shopping List Card */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
            Shopping list is empty
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Open any recipe or your weekly meal plan and click "Add to List" to automatically collect
            scaled ingredients organized by aisle!
          </p>
        </div>
      )}

      {/* Google Keep Modal */}
      {isKeepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                    Export to Google Keep
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Copy and paste as an interactive checklist note
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsKeepModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation & Workflow */}
            <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-3.5 space-y-1.5">
              <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span>💡 Quick 2-Step Workflow:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-stone-300">
                <li>Click <strong>"Copy & Open Google Keep"</strong> below.</li>
                <li>In Google Keep, click the <strong>New list (checkbox symbol)</strong>, then paste (<kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] font-mono">Cmd+V</kbd> / <kbd className="px-1 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] font-mono">Ctrl+V</kbd>). Each line turns into an interactive checkable item!</li>
              </ol>
            </div>

            {/* Formatting Options */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Items to Include
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKeepUncheckedOnly(true)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      keepUncheckedOnly
                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Unchecked Only ({totalCount - checkedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeepUncheckedOnly(false)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      !keepUncheckedOnly
                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    All Items ({totalCount})
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Format Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKeepIncludeCategories(false)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      !keepIncludeCategories
                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Checklist lines (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeepIncludeCategories(true)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      keepIncludeCategories
                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Grouped by Aisle
                  </button>
                </div>
              </div>
            </div>

            {/* Text Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold">Text Preview:</span>
                <button
                  type="button"
                  onClick={handleCopyKeepText}
                  className="hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy text</span>
                </button>
              </div>
              <pre className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono text-stone-700 dark:text-stone-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {keepPreviewText || '(No items match criteria)'}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyAndOpenKeep}
                disabled={!keepPreviewText}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lightbulb className="w-4 h-4 fill-stone-950" />
                <span>Copy & Open Google Keep</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {typeof navigator !== 'undefined' && !!navigator.share && (
                <button
                  type="button"
                  onClick={handleShareToKeep}
                  disabled={!keepPreviewText}
                  className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Share directly via mobile share sheet"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
