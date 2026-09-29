import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MealPlanDay, MealType, Recipe } from '../types/recipe';
import { getMealPlansFromDB, saveMealPlansToDB } from '../services/storage';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalizeRecipeList(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    return [val.trim()];
  }
  return [];
}

function getDefaultWeekPlan(): MealPlanDay[] {
  return DAYS_OF_WEEK.map((dayName, idx) => ({
    date: `day-${idx}`,
    dayName,
    breakfast: [],
    lunch: [],
    dinner: [],
    notes: ''
  }));
}

interface MealPlanContextValue {
  mealPlans: MealPlanDay[];
  addRecipeToMeal: (dayName: string, mealType: MealType, recipeId: string) => Promise<void>;
  removeRecipeFromMeal: (dayName: string, mealType: MealType, recipeId: string, index?: number) => Promise<void>;
  setMealForDay: (dayName: string, mealType: MealType, recipeId?: string) => Promise<void>;
  clearDayMeal: (dayName: string, mealType: MealType) => Promise<void>;
  clearEntireWeek: () => Promise<void>;
  addAllMealsToShoppingList: (
    recipes: Recipe[],
    addIngredientsFn: (recipe: Recipe) => Promise<number>
  ) => Promise<number>;
}

const MealPlanContext = createContext<MealPlanContextValue | undefined>(undefined);

export const MealPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mealPlans, setMealPlans] = useState<MealPlanDay[]>(getDefaultWeekPlan());

  useEffect(() => {
    getMealPlansFromDB().then((stored) => {
      if (stored.length > 0) {
        // Ensure all 7 days exist and normalize any legacy string values to arrays
        const map = new Map(stored.map((p) => [p.dayName, p]));
        const merged = DAYS_OF_WEEK.map((day, idx) => {
          const existing = map.get(day);
          if (existing) {
            return {
              date: existing.date || `day-${idx}`,
              dayName: day,
              breakfast: normalizeRecipeList(existing.breakfast),
              lunch: normalizeRecipeList(existing.lunch),
              dinner: normalizeRecipeList(existing.dinner),
              notes: existing.notes || ''
            };
          }
          return {
            date: `day-${idx}`,
            dayName: day,
            breakfast: [],
            lunch: [],
            dinner: [],
            notes: ''
          };
        });
        setMealPlans(merged);
      }
    });
  }, []);

  const saveAndSet = useCallback(async (plans: MealPlanDay[]) => {
    setMealPlans(plans);
    await saveMealPlansToDB(plans);
  }, []);

  const addRecipeToMeal = async (
    dayName: string,
    mealType: MealType,
    recipeId: string
  ) => {
    if (!recipeId) return;
    const updated = mealPlans.map((day) => {
      if (day.dayName === dayName) {
        const currentList = day[mealType] || [];
        return {
          ...day,
          [mealType]: [...currentList, recipeId]
        };
      }
      return day;
    });
    await saveAndSet(updated);
  };

  const removeRecipeFromMeal = async (
    dayName: string,
    mealType: MealType,
    recipeId: string,
    index?: number
  ) => {
    const updated = mealPlans.map((day) => {
      if (day.dayName === dayName) {
        const currentList = day[mealType] || [];
        const nextList =
          typeof index === 'number'
            ? currentList.filter((_, i) => i !== index)
            : currentList.filter((id) => id !== recipeId);
        return {
          ...day,
          [mealType]: nextList
        };
      }
      return day;
    });
    await saveAndSet(updated);
  };

  const setMealForDay = async (
    dayName: string,
    mealType: MealType,
    recipeId?: string
  ) => {
    if (!recipeId) {
      await clearDayMeal(dayName, mealType);
    } else {
      await addRecipeToMeal(dayName, mealType, recipeId);
    }
  };

  const clearDayMeal = async (dayName: string, mealType: MealType) => {
    const updated = mealPlans.map((day) => {
      if (day.dayName === dayName) {
        return {
          ...day,
          [mealType]: []
        };
      }
      return day;
    });
    await saveAndSet(updated);
  };

  const clearEntireWeek = async () => {
    await saveAndSet(getDefaultWeekPlan());
  };

  const addAllMealsToShoppingList = async (
    recipes: Recipe[],
    addIngredientsFn: (recipe: Recipe) => Promise<number>
  ): Promise<number> => {
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const plannedRecipeIds = new Set<string>();

    mealPlans.forEach((day) => {
      (day.breakfast || []).forEach((id) => plannedRecipeIds.add(id));
      (day.lunch || []).forEach((id) => plannedRecipeIds.add(id));
      (day.dinner || []).forEach((id) => plannedRecipeIds.add(id));
    });

    let totalAdded = 0;
    for (const rId of plannedRecipeIds) {
      const rec = recipeMap.get(rId);
      if (rec) {
        const added = await addIngredientsFn(rec);
        totalAdded += added;
      }
    }
    return totalAdded;
  };

  return (
    <MealPlanContext.Provider
      value={{
        mealPlans,
        addRecipeToMeal,
        removeRecipeFromMeal,
        setMealForDay,
        clearDayMeal,
        clearEntireWeek,
        addAllMealsToShoppingList
      }}
    >
      {children}
    </MealPlanContext.Provider>
  );
};

export function useMealPlan(): MealPlanContextValue {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
}
