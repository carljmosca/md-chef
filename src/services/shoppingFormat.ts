import type { ShoppingItem } from '../types/recipe';

export interface KeepFormatOptions {
  uncheckedOnly?: boolean;
  includeCategories?: boolean;
  title?: string;
}

export const GOOGLE_KEEP_URL = 'https://keep.google.com/';

/**
 * Formats shopping list items specifically for pasting into Google Keep.
 * When pasting into Google Keep list notes, individual newline-separated lines
 * automatically become interactive checklist items.
 */
export function formatForGoogleKeep(
  items: ShoppingItem[],
  options: KeepFormatOptions = {}
): string {
  const {
    uncheckedOnly = true,
    includeCategories = false,
    title = 'Grocery Shopping List'
  } = options;

  const candidateItems = uncheckedOnly
    ? items.filter((it) => !it.checked)
    : items;

  if (candidateItems.length === 0) {
    return '';
  }

  if (!includeCategories) {
    // Clean one-item-per-line list: best for Google Keep checklist conversion
    return candidateItems.map((it) => it.name.trim()).join('\n');
  }

  // Group by category/aisle
  const categories: Record<string, ShoppingItem[]> = {};
  for (const item of candidateItems) {
    const cat = item.category || 'Other';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(item);
  }

  let result = `🛒 ${title}\n\n`;
  for (const [category, catItems] of Object.entries(categories)) {
    result += `[${category.toUpperCase()}]\n`;
    for (const it of catItems) {
      result += `${it.name.trim()}\n`;
    }
    result += '\n';
  }

  return result.trim();
}

/**
 * Opens Google Keep in a new browser tab
 */
export function openGoogleKeep(): void {
  if (typeof window !== 'undefined') {
    window.open(GOOGLE_KEEP_URL, '_blank', 'noopener,noreferrer');
  }
}
