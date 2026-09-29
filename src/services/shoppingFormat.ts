import type { ShoppingItem } from '../types/recipe';

export interface KeepFormatOptions {
  uncheckedOnly?: boolean;
  includeCategories?: boolean;
  title?: string;
}

export interface KeepBatch {
  batchIndex: number;
  totalBatches: number;
  label: string;
  itemsCount: number;
  text: string;
}

export const GOOGLE_KEEP_URL = 'https://keep.google.com/';
export const DEFAULT_KEEP_BATCH_SIZE = 50;

export function formatForGoogleKeepHtml(text: string): string {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]!);
  const parts: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      parts.push(`<ul>${listItems.join('')}</ul>`);
      listItems = [];
    }
  };

  for (const sourceLine of text.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) {
      flushList();
    } else if (line.startsWith('🛒 ') || line.startsWith('📌 ') || /^\[.+\]$/.test(line)) {
      flushList();
      parts.push(`<p><strong>${escapeHtml(line)}</strong></p>`);
    } else {
      listItems.push(`<li>${escapeHtml(line)}</li>`);
    }
  }
  flushList();

  return parts.join('');
}

export async function copyForGoogleKeep(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([formatForGoogleKeepHtml(text)], { type: 'text/html' })
          })
        ]);
        return;
      } catch {
        // Fall back to plain text
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to execCommand below
    }
  }

  if (typeof document !== 'undefined') {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    if (success) return;
  }

  throw new Error('Clipboard access is unavailable');
}

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

  let result = `📌 🛒 ${title}\n\n`;
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
 * Splits items into batches suitable for Google Keep notes.
 * If total items <= maxItemsPerBatch, returns a single batch.
 */
export function splitIntoKeepBatches(
  items: ShoppingItem[],
  options: KeepFormatOptions & { maxItemsPerBatch?: number } = {}
): KeepBatch[] {
  const {
    uncheckedOnly = true,
    includeCategories = false,
    title = 'Grocery Shopping List',
    maxItemsPerBatch = DEFAULT_KEEP_BATCH_SIZE
  } = options;

  const candidateItems = uncheckedOnly
    ? items.filter((it) => !it.checked)
    : items;

  if (candidateItems.length === 0) {
    return [];
  }

  const batchSize = Math.max(1, maxItemsPerBatch);
  const totalBatches = Math.ceil(candidateItems.length / batchSize);
  const batches: KeepBatch[] = [];

  for (let i = 0; i < totalBatches; i++) {
    const batchItems = candidateItems.slice(i * batchSize, (i + 1) * batchSize);
    const batchTitle =
      totalBatches > 1 ? `${title} (Part ${i + 1} of ${totalBatches})` : title;

    const text = formatForGoogleKeep(batchItems, {
      uncheckedOnly: false, // already filtered
      includeCategories,
      title: batchTitle
    });

    batches.push({
      batchIndex: i,
      totalBatches,
      label: totalBatches > 1 ? `Batch ${i + 1} of ${totalBatches}` : 'All Items',
      itemsCount: batchItems.length,
      text
    });
  }

  return batches;
}

/**
 * Opens Google Keep in a new browser tab
 */
export function openGoogleKeep(): void {
  if (typeof window !== 'undefined') {
    window.open(GOOGLE_KEEP_URL, '_blank', 'noopener,noreferrer');
  }
}
