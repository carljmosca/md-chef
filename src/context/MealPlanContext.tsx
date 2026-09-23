import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MealPlanDay, Recipe } from '../types/recipe';
import { getMealPlansFromDB, saveMealPlansToDB } from '../services/storage';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDefaultWeekPlan(): MealPlanDay[] {
  return DAYS_OF_WEEK.map((dayName, idx) => ({
    date: `day-${idx}`,
    dayName,
    breakfast: undefined,
    lunch: undefined,
    dinner: undefined,
    notes: ''
  }));
}

interface MealPlanContextValue {
  mealPlans: MealPlanDay[];
  setMealForDay: (dayName: string, mealType: 'breakfast' | 'lunch' | 'dinner', recipeId?: string) => Promise<void>;
  clearDayMeal: (dayName: string, mealType: 'breakfast' | 'lunch' | 'dinner') => Promise<void>;
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
        // Ensure all 7 days exist
        const map = new Map(stored.map((p) => [p.dayName, p]));
        const merged = DAYS_OF_WEEK.map((day, idx) => {
          return (
            map.get(day) || {
              date: `day-${idx}`,
              dayName: day,
              breakfast: undefined,
              lunch: undefined,
              dinner: undefined,
              notes: ''
            }
          );
        });
        setMealPlans(merged);
      }
    });
  }, []);

  const saveAndSet = useCallback(async (plans: MealPlanDay[]) => {
    setMealPlans(plans);
    await saveMealPlansToDB(plans);
  }, []);

  const setMealForDay = async (
    dayName: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    recipeId?: string
  ) => {
    const updated = mealPlans.map((day) => {
      if (day.dayName === dayName) {
        return {
          ...day,
          [mealType]: recipeId
        };
      }
      return day;
    });
    await saveAndSet(updated);
  };

  const clearDayMeal = async (dayName: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    await setMealForDay(dayName, mealType, undefined);
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
      if (day.breakfast) plannedRecipeIds.add(day.breakfast);
      if (day.lunch) plannedRecipeIds.add(day.lunch);
      if (day.dinner) plannedRecipeIds.add(day.dinner);
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

