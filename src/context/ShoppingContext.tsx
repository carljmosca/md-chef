import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ShoppingItem, Recipe } from '../types/recipe';
import { getShoppingListFromDB, saveShoppingListToDB } from '../services/storage';
import { classifyIngredientCategory, scaleIngredientQuantity } from '../services/markdownParser';

interface ShoppingContextValue {
  items: ShoppingItem[];
  addItem: (name: string, category?: ShoppingItem['category']) => Promise<void>;
  addIngredientsFromRecipe: (recipe: Recipe, scaleFactor?: number, selectedIngIds?: string[]) => Promise<number>;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  clearAll: () => Promise<void>;
  getFormattedText: () => string;
  checkedCount: number;
  totalCount: number;
}

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    getShoppingListFromDB().then((stored) => setItems(stored));
  }, []);

  const saveAndSet = useCallback(async (newItems: ShoppingItem[]) => {
    setItems(newItems);
    await saveShoppingListToDB(newItems);
  }, []);

  const addItem = async (name: string, category?: ShoppingItem['category']) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const cat = category || classifyIngredientCategory(trimmed);
    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      raw: trimmed,
      category: cat,
      checked: false,
      addedAt: new Date().toISOString()
    };

    await saveAndSet([newItem, ...items]);
  };

  const addIngredientsFromRecipe = async (
    recipe: Recipe,
    scaleFactor: number = 1,
    selectedIngIds?: string[]
  ): Promise<number> => {
    const candidateIngs = selectedIngIds
      ? recipe.ingredients.filter((ing) => selectedIngIds.includes(ing.id))
      : recipe.ingredients;

    if (candidateIngs.length === 0) return 0;

    const newItems: ShoppingItem[] = candidateIngs.map((ing) => {
      const scaledRaw = scaleIngredientQuantity(ing.raw, scaleFactor);
      return {
        id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name: scaledRaw,
        raw: scaledRaw,
        category: classifyIngredientCategory(ing.raw),
        checked: false,
        recipeSource: recipe.frontmatter.title,
        recipeId: recipe.id,
        addedAt: new Date().toISOString()
      };
    });

    await saveAndSet([...newItems, ...items]);
    return newItems.length;
  };

  const toggleItem = async (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    await saveAndSet(updated);
  };

  const removeItem = async (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    await saveAndSet(updated);
  };

  const clearChecked = async () => {
    const updated = items.filter((item) => !item.checked);
    await saveAndSet(updated);
  };

  const clearAll = async () => {
    await saveAndSet([]);
  };

  const getFormattedText = (): string => {
    if (items.length === 0) return 'Shopping list is empty.';

    const categories: Record<string, ShoppingItem[]> = {};
    for (const item of items) {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    }

    let text = '🛒 MD-Chef Grocery Shopping List\n\n';
    for (const [cat, catItems] of Object.entries(categories)) {
      text += `--- ${cat.toUpperCase()} ---\n`;
      for (const it of catItems) {
        text += `${it.checked ? '✓ [Done]' : '☐'} ${it.name}${it.recipeSource ? ` (${it.recipeSource})` : ''}\n`;
      }
      text += '\n';
    }

    return text.trim();
  };

  const checkedCount = items.filter((it) => it.checked).length;
  const totalCount = items.length;

  return (
    <ShoppingContext.Provider
      value={{
        items,
        addItem,
        addIngredientsFromRecipe,
        toggleItem,
        removeItem,
        clearChecked,
        clearAll,
        getFormattedText,
        checkedCount,
        totalCount
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
};

export function useShopping(): ShoppingContextValue {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
}

