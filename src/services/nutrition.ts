import type { IngredientItem, Recipe } from '../types/recipe.ts';

export interface NutrientBreakdown {
  calories: number;
  protein: number;       // grams
  carbohydrates: number; // grams
  fat: number;           // grams
  saturatedFat: number;  // grams
  fiber: number;         // grams
  sugar: number;         // grams
  sodium: number;        // milligrams
  potassium: number;     // milligrams
  calcium: number;       // milligrams
  iron: number;          // milligrams
}

export interface IngredientNutritionMatch {
  raw: string;
  matchedName: string;
  estimatedGrams: number;
  nutrients: NutrientBreakdown;
}

export interface RecipeNutritionAnalysis {
  recipeTitle?: string;
  servings: number;
  total: NutrientBreakdown;
  perServing: NutrientBreakdown;
  percentDailyValue: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    saturatedFat: number;
    fiber: number;
    sodium: number;
    calcium: number;
    iron: number;
    potassium: number;
  };
  macroPercentages: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryHighlights: string[];
  ingredientDetails: IngredientNutritionMatch[];
}

// Reference values per 100g
interface NutritionPer100g {
  name: string;
  aliases: string[];
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  typicalPieceWeightGrams?: number;
  cupWeightGrams?: number;
}

// Built-in offline nutritional database based on USDA standard reference values
const FOOD_DATABASE: NutritionPer100g[] = [
  // Meats, Poultry & Seafood
  {
    name: 'chicken breast',
    aliases: ['chicken', 'chicken breasts', 'boneless chicken', 'chicken cutlet', 'chicken cutlets'],
    calories: 165,
    protein: 31,
    fat: 3.6,
    saturatedFat: 1.0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    potassium: 256,
    calcium: 15,
    iron: 1.0,
    typicalPieceWeightGrams: 200,
    cupWeightGrams: 140
  },
  {
    name: 'chicken thigh',
    aliases: ['chicken thighs', 'dark meat chicken'],
    calories: 209,
    protein: 26,
    fat: 10.9,
    saturatedFat: 3.0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 84,
    potassium: 239,
    calcium: 12,
    iron: 1.3,
    typicalPieceWeightGrams: 120
  },
  {
    name: 'beef tenderloin',
    aliases: ['beef', 'steak', 'tenderloin', 'beef fillet', 'filet mignon', 'ground beef'],
    calories: 250,
    protein: 26,
    fat: 15,
    saturatedFat: 6.0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 60,
    potassium: 350,
    calcium: 18,
    iron: 2.8,
    typicalPieceWeightGrams: 220
  },
  {
    name: 'prosciutto',
    aliases: ['ham', 'pancetta', 'bacon', 'speck'],
    calories: 265,
    protein: 25,
    fat: 18,
    saturatedFat: 6.5,
    carbs: 0.5,
    fiber: 0,
    sugar: 0,
    sodium: 1800,
    potassium: 320,
    calcium: 10,
    iron: 1.5,
    typicalPieceWeightGrams: 20 // slice
  },
  {
    name: 'salmon',
    aliases: ['salmon fillet', 'fish', 'trout'],
    calories: 208,
    protein: 20,
    fat: 13,
    saturatedFat: 3.1,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 59,
    potassium: 363,
    calcium: 9,
    iron: 0.5,
    typicalPieceWeightGrams: 180
  },
  {
    name: 'egg',
    aliases: ['eggs', 'egg yolk', 'egg white', 'large egg'],
    calories: 143,
    protein: 12.6,
    fat: 9.5,
    saturatedFat: 3.1,
    carbs: 0.7,
    fiber: 0,
    sugar: 0.4,
    sodium: 142,
    potassium: 138,
    calcium: 56,
    iron: 1.8,
    typicalPieceWeightGrams: 50 // 1 large egg
  },

  // Dairy & Cheeses
  {
    name: 'mozzarella cheese',
    aliases: ['mozzarella', 'fresh mozzarella', 'cheese', 'pizza cheese'],
    calories: 280,
    protein: 22,
    fat: 21,
    saturatedFat: 13,
    carbs: 2.2,
    fiber: 0,
    sugar: 1.0,
    sodium: 627,
    potassium: 76,
    calcium: 505,
    iron: 0.4,
    cupWeightGrams: 112
  },
  {
    name: 'parmesan cheese',
    aliases: ['parmesan', 'parmigiano', 'pecorino', 'grana padano'],
    calories: 431,
    protein: 38,
    fat: 29,
    saturatedFat: 17,
    carbs: 4.1,
    fiber: 0,
    sugar: 0.9,
    sodium: 1529,
    potassium: 125,
    calcium: 1184,
    iron: 0.9,
    cupWeightGrams: 100
  },
  {
    name: 'butter',
    aliases: ['unsalted butter', 'salted butter'],
    calories: 717,
    protein: 0.9,
    fat: 81,
    saturatedFat: 51,
    carbs: 0.1,
    fiber: 0,
    sugar: 0.1,
    sodium: 11,
    potassium: 24,
    calcium: 24,
    iron: 0.02,
    typicalPieceWeightGrams: 14 // tablespoon
  },
  {
    name: 'heavy cream',
    aliases: ['cream', 'whipping cream', 'double cream'],
    calories: 345,
    protein: 2.8,
    fat: 37,
    saturatedFat: 23,
    carbs: 2.7,
    fiber: 0,
    sugar: 2.9,
    sodium: 38,
    potassium: 95,
    calcium: 65,
    iron: 0.1,
    cupWeightGrams: 240
  },
  {
    name: 'milk',
    aliases: ['whole milk', '2% milk', 'skim milk'],
    calories: 61,
    protein: 3.2,
    fat: 3.3,
    saturatedFat: 1.9,
    carbs: 4.8,
    fiber: 0,
    sugar: 5.1,
    sodium: 44,
    potassium: 150,
    calcium: 120,
    iron: 0.1,
    cupWeightGrams: 245
  },

  // Oils & Condiments
  {
    name: 'olive oil',
    aliases: ['extra-virgin olive oil', 'vegetable oil', 'canola oil', 'cooking oil', 'oil'],
    calories: 884,
    protein: 0,
    fat: 100,
    saturatedFat: 14,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 2,
    potassium: 1,
    calcium: 1,
    iron: 0.6,
    typicalPieceWeightGrams: 14 // 1 tbsp
  },
  {
    name: 'dijon mustard',
    aliases: ['mustard', 'yellow mustard', 'wholegrain mustard'],
    calories: 66,
    protein: 4.4,
    fat: 4.0,
    saturatedFat: 0.2,
    carbs: 5.3,
    fiber: 3.3,
    sugar: 0.9,
    sodium: 1120,
    potassium: 152,
    calcium: 64,
    iron: 1.5,
    typicalPieceWeightGrams: 5 // 1 tsp
  },

  // Produce & Vegetables
  {
    name: 'mushrooms',
    aliases: ['cremini mushrooms', 'button mushrooms', 'portobello', 'shiitake', 'mushroom'],
    calories: 22,
    protein: 3.1,
    fat: 0.3,
    saturatedFat: 0.05,
    carbs: 3.3,
    fiber: 1.0,
    sugar: 2.0,
    sodium: 5,
    potassium: 318,
    calcium: 3,
    iron: 0.5,
    cupWeightGrams: 70
  },
  {
    name: 'onion',
    aliases: ['onions', 'yellow onion', 'red onion', 'white onion', 'shallot', 'shallots'],
    calories: 40,
    protein: 1.1,
    fat: 0.1,
    saturatedFat: 0.04,
    carbs: 9.3,
    fiber: 1.7,
    sugar: 4.2,
    sodium: 4,
    potassium: 146,
    calcium: 23,
    iron: 0.2,
    typicalPieceWeightGrams: 150,
    cupWeightGrams: 160
  },
  {
    name: 'garlic',
    aliases: ['garlic clove', 'garlic cloves', 'minced garlic'],
    calories: 149,
    protein: 6.4,
    fat: 0.5,
    saturatedFat: 0.09,
    carbs: 33,
    fiber: 2.1,
    sugar: 1.0,
    sodium: 17,
    potassium: 401,
    calcium: 181,
    iron: 1.7,
    typicalPieceWeightGrams: 4 // 1 clove
  },
  {
    name: 'tomatoes',
    aliases: ['tomato', 'crushed tomatoes', 'canned tomatoes', 'cherry tomatoes', 'san marzano tomatoes', 'tomato sauce'],
    calories: 18,
    protein: 0.9,
    fat: 0.2,
    saturatedFat: 0.03,
    carbs: 3.9,
    fiber: 1.2,
    sugar: 2.6,
    sodium: 5,
    potassium: 237,
    calcium: 10,
    iron: 0.3,
    typicalPieceWeightGrams: 125,
    cupWeightGrams: 180
  },
  {
    name: 'basil',
    aliases: ['fresh basil', 'basil leaves', 'parsley', 'fresh parsley', 'oregano', 'thyme', 'rosemary'],
    calories: 23,
    protein: 3.2,
    fat: 0.6,
    saturatedFat: 0.04,
    carbs: 2.7,
    fiber: 1.6,
    sugar: 0.3,
    sodium: 4,
    potassium: 295,
    calcium: 177,
    iron: 3.2,
    typicalPieceWeightGrams: 5,
    cupWeightGrams: 40
  },
  {
    name: 'spinach',
    aliases: ['baby spinach', 'greens', 'kale', 'arugula'],
    calories: 23,
    protein: 2.9,
    fat: 0.4,
    saturatedFat: 0.06,
    carbs: 3.6,
    fiber: 2.2,
    sugar: 0.4,
    sodium: 79,
    potassium: 558,
    calcium: 99,
    iron: 2.7,
    cupWeightGrams: 30
  },

  // Bakery, Grains & Flours
  {
    name: 'flour',
    aliases: ['all-purpose flour', 'bread flour', 'wheat flour', 'pasta'],
    calories: 364,
    protein: 10.3,
    fat: 1.0,
    saturatedFat: 0.15,
    carbs: 76.3,
    fiber: 2.7,
    sugar: 0.3,
    sodium: 2,
    potassium: 107,
    calcium: 15,
    iron: 4.6,
    cupWeightGrams: 125
  },
  {
    name: 'puff pastry',
    aliases: ['pastry dough', 'pie crust', 'dough'],
    calories: 558,
    protein: 7.2,
    fat: 38,
    saturatedFat: 9.8,
    carbs: 46,
    fiber: 1.6,
    sugar: 0.8,
    sodium: 450,
    potassium: 85,
    calcium: 12,
    iron: 2.1,
    typicalPieceWeightGrams: 250 // 1 sheet
  },
  {
    name: 'rice',
    aliases: ['white rice', 'jasmine rice', 'basmati rice', 'brown rice', 'arborio rice'],
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    saturatedFat: 0.08,
    carbs: 28,
    fiber: 0.4,
    sugar: 0.1,
    sodium: 1,
    potassium: 35,
    calcium: 10,
    iron: 0.2,
    cupWeightGrams: 185 // cooked
  },
  {
    name: 'sugar',
    aliases: ['white sugar', 'granulated sugar', 'brown sugar', 'cane sugar'],
    calories: 387,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    carbs: 100,
    fiber: 0,
    sugar: 100,
    sodium: 1,
    potassium: 2,
    calcium: 1,
    iron: 0.05,
    cupWeightGrams: 200,
    typicalPieceWeightGrams: 4 // teaspoon
  },
  {
    name: 'chocolate chips',
    aliases: ['chocolate', 'dark chocolate', 'semisweet chocolate chips', 'cocoa'],
    calories: 479,
    protein: 4.2,
    fat: 28,
    saturatedFat: 17,
    carbs: 63,
    fiber: 5.9,
    sugar: 54,
    sodium: 8,
    potassium: 360,
    calcium: 32,
    iron: 3.1,
    cupWeightGrams: 175
  },
  {
    name: 'marsala wine',
    aliases: ['wine', 'white wine', 'red wine', 'cooking wine', 'sherry'],
    calories: 85,
    protein: 0.1,
    fat: 0,
    saturatedFat: 0,
    carbs: 2.6,
    fiber: 0,
    sugar: 1.0,
    sodium: 4,
    potassium: 127,
    calcium: 10,
    iron: 0.5,
    cupWeightGrams: 240
  },
  {
    name: 'chicken broth',
    aliases: ['broth', 'beef broth', 'vegetable broth', 'stock', 'chicken stock'],
    calories: 15,
    protein: 2.5,
    fat: 0.5,
    saturatedFat: 0.1,
    carbs: 0.4,
    fiber: 0,
    sugar: 0.2,
    sodium: 350,
    potassium: 130,
    calcium: 8,
    iron: 0.3,
    cupWeightGrams: 240
  },
  {
    name: 'salt',
    aliases: ['kosher salt', 'sea salt', 'table salt'],
    calories: 0,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 38758,
    potassium: 8,
    calcium: 24,
    iron: 0.3,
    typicalPieceWeightGrams: 6 // 1 tsp
  },
  {
    name: 'black pepper',
    aliases: ['pepper', 'ground pepper', 'ground black pepper'],
    calories: 251,
    protein: 10,
    fat: 3.3,
    saturatedFat: 1.4,
    carbs: 64,
    fiber: 25,
    sugar: 0.6,
    sodium: 20,
    potassium: 1329,
    calcium: 443,
    iron: 9.7,
    typicalPieceWeightGrams: 2 // 1 tsp
  }
];

// Helper: match an ingredient name against database
function findFoodMatch(rawText: string): NutritionPer100g | null {
  const clean = rawText.toLowerCase().replace(/[^\w\s-]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  let bestMatch: NutritionPer100g | null = null;
  let bestScore = 0;

  for (const food of FOOD_DATABASE) {
    const targets = [food.name, ...food.aliases];
    for (const target of targets) {
      const targetLower = target.toLowerCase();
      
      // Exact substring match
      if (clean.includes(targetLower)) {
        const score = targetLower.length * 2;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = food;
        }
      }

      // Word-level match
      const targetWords = targetLower.split(/\s+/);
      const matchedWords = targetWords.filter(tw => words.includes(tw));
      if (matchedWords.length > 0) {
        const score = matchedWords.length * 3;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = food;
        }
      }
    }
  }

  return bestMatch;
}

// Helper: estimate grams from amount and unit
function estimateIngredientWeightGrams(
  item: { amount?: number; unit?: string; item: string; raw: string },
  food: NutritionPer100g
): number {
  const amount = item.amount || 1;
  const unit = (item.unit || '').toLowerCase().trim();

  // Explicit weight units
  if (['g', 'gram', 'grams'].includes(unit)) return amount;
  if (['kg', 'kilogram', 'kilograms'].includes(unit)) return amount * 1000;
  if (['oz', 'ounce', 'ounces'].includes(unit)) return amount * 28.35;
  if (['lb', 'lbs', 'pound', 'pounds'].includes(unit)) return amount * 453.6;

  // Volume units
  if (['cup', 'cups'].includes(unit)) {
    return amount * (food.cupWeightGrams || 150);
  }
  if (['tbsp', 'tablespoon', 'tablespoons', 'tbs'].includes(unit)) {
    return amount * (food.cupWeightGrams ? food.cupWeightGrams / 16 : 14);
  }
  if (['tsp', 'teaspoon', 'teaspoons'].includes(unit)) {
    return amount * (food.cupWeightGrams ? food.cupWeightGrams / 48 : 5);
  }
  if (['ml', 'milliliter', 'milliliters'].includes(unit)) {
    return amount * 1.0;
  }
  if (['l', 'liter', 'liters'].includes(unit)) {
    return amount * 1000;
  }
  if (['pinch', 'dash'].includes(unit)) {
    return 0.5;
  }
  if (['clove', 'cloves'].includes(unit)) {
    return amount * 4;
  }
  if (['slice', 'slices'].includes(unit)) {
    return amount * (food.typicalPieceWeightGrams || 25);
  }
  if (['can', 'cans'].includes(unit)) {
    return amount * 400; // standard 14oz can ~400g
  }
  if (['sheet', 'sheets'].includes(unit)) {
    return amount * (food.typicalPieceWeightGrams || 240);
  }

  // Count/pieces without unit or "piece"
  if (!unit || ['piece', 'pieces', 'large', 'medium', 'small'].includes(unit)) {
    if (food.typicalPieceWeightGrams) {
      return amount * food.typicalPieceWeightGrams;
    }
  }

  // Default fallback estimation
  return amount * 60;
}

/**
 * Calculates nutritional values for a list of ingredients
 */
export function computeNutritionForIngredients(
  ingredients: Array<IngredientItem | { raw: string; amount?: number; unit?: string; item: string }>,
  servings = 4
): RecipeNutritionAnalysis {
  const safeServings = Math.max(1, servings);

  const emptyNutrients = (): NutrientBreakdown => ({
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    saturatedFat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    potassium: 0,
    calcium: 0,
    iron: 0
  });

  const total = emptyNutrients();
  const ingredientDetails: IngredientNutritionMatch[] = [];

  for (const ing of ingredients) {
    const textToMatch = ing.item || ing.raw;
    const food = findFoodMatch(textToMatch);

    if (food) {
      const grams = estimateIngredientWeightGrams(ing, food);
      const ratio = grams / 100;

      const itemNutrients: NutrientBreakdown = {
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbohydrates: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10,
        saturatedFat: Math.round(food.saturatedFat * ratio * 10) / 10,
        fiber: Math.round(food.fiber * ratio * 10) / 10,
        sugar: Math.round(food.sugar * ratio * 10) / 10,
        sodium: Math.round(food.sodium * ratio),
        potassium: Math.round(food.potassium * ratio),
        calcium: Math.round(food.calcium * ratio),
        iron: Math.round(food.iron * ratio * 10) / 10
      };

      total.calories += itemNutrients.calories;
      total.protein += itemNutrients.protein;
      total.carbohydrates += itemNutrients.carbohydrates;
      total.fat += itemNutrients.fat;
      total.saturatedFat += itemNutrients.saturatedFat;
      total.fiber += itemNutrients.fiber;
      total.sugar += itemNutrients.sugar;
      total.sodium += itemNutrients.sodium;
      total.potassium += itemNutrients.potassium;
      total.calcium += itemNutrients.calcium;
      total.iron += itemNutrients.iron;

      ingredientDetails.push({
        raw: ing.raw,
        matchedName: food.name,
        estimatedGrams: Math.round(grams),
        nutrients: itemNutrients
      });
    } else {
      // Unmatched ingredient - record 0 values
      ingredientDetails.push({
        raw: ing.raw,
        matchedName: 'General Ingredient',
        estimatedGrams: 0,
        nutrients: emptyNutrients()
      });
    }
  }

  // Round total values
  total.calories = Math.round(total.calories);
  total.protein = Math.round(total.protein * 10) / 10;
  total.carbohydrates = Math.round(total.carbohydrates * 10) / 10;
  total.fat = Math.round(total.fat * 10) / 10;
  total.saturatedFat = Math.round(total.saturatedFat * 10) / 10;
  total.fiber = Math.round(total.fiber * 10) / 10;
  total.sugar = Math.round(total.sugar * 10) / 10;
  total.sodium = Math.round(total.sodium);
  total.potassium = Math.round(total.potassium);
  total.calcium = Math.round(total.calcium);
  total.iron = Math.round(total.iron * 10) / 10;

  // Per serving calculation
  const perServing: NutrientBreakdown = {
    calories: Math.round(total.calories / safeServings),
    protein: Math.round((total.protein / safeServings) * 10) / 10,
    carbohydrates: Math.round((total.carbohydrates / safeServings) * 10) / 10,
    fat: Math.round((total.fat / safeServings) * 10) / 10,
    saturatedFat: Math.round((total.saturatedFat / safeServings) * 10) / 10,
    fiber: Math.round((total.fiber / safeServings) * 10) / 10,
    sugar: Math.round((total.sugar / safeServings) * 10) / 10,
    sodium: Math.round(total.sodium / safeServings),
    potassium: Math.round(total.potassium / safeServings),
    calcium: Math.round(total.calcium / safeServings),
    iron: Math.round((total.iron / safeServings) * 10) / 10
  };

  // Percent Daily Value (% DV based on standard 2000 kcal diet)
  const percentDailyValue = {
    calories: Math.round((perServing.calories / 2000) * 100),
    protein: Math.round((perServing.protein / 50) * 100),
    carbohydrates: Math.round((perServing.carbohydrates / 275) * 100),
    fat: Math.round((perServing.fat / 78) * 100),
    saturatedFat: Math.round((perServing.saturatedFat / 20) * 100),
    fiber: Math.round((perServing.fiber / 28) * 100),
    sodium: Math.round((perServing.sodium / 2300) * 100),
    calcium: Math.round((perServing.calcium / 1300) * 100),
    iron: Math.round((perServing.iron / 18) * 100),
    potassium: Math.round((perServing.potassium / 4700) * 100)
  };

  // Macro Energy Percentages (4 kcal/g protein, 4 kcal/g carb, 9 kcal/g fat)
  const totalMacroCalories = (perServing.protein * 4) + (perServing.carbohydrates * 4) + (perServing.fat * 9);
  const macroPercentages = totalMacroCalories > 0 ? {
    protein: Math.round(((perServing.protein * 4) / totalMacroCalories) * 100),
    carbs: Math.round(((perServing.carbohydrates * 4) / totalMacroCalories) * 100),
    fat: Math.round(((perServing.fat * 9) / totalMacroCalories) * 100)
  } : { protein: 0, carbs: 0, fat: 0 };

  // Dietary highlights
  const dietaryHighlights: string[] = [];
  if (perServing.protein >= 25) dietaryHighlights.push('High Protein');
  if (perServing.carbohydrates <= 15) dietaryHighlights.push('Low Carb');
  if (perServing.fiber >= 5) dietaryHighlights.push('Good Source of Fiber');
  if (perServing.sodium <= 140) dietaryHighlights.push('Low Sodium');
  if (perServing.calories < 400 && perServing.protein > 20) dietaryHighlights.push('Lean & Light');
  if (macroPercentages.fat >= 60 && macroPercentages.carbs <= 10) dietaryHighlights.push('Keto Friendly');

  return {
    servings: safeServings,
    total,
    perServing,
    percentDailyValue,
    macroPercentages,
    dietaryHighlights,
    ingredientDetails
  };
}

/**
 * Calculates nutritional values for an entire Recipe object
 */
export function analyzeRecipeNutrition(recipe: Recipe, customServings?: number): RecipeNutritionAnalysis {
  const servings = customServings || recipe.frontmatter.servings || 4;
  const analysis = computeNutritionForIngredients(recipe.ingredients, servings);
  analysis.recipeTitle = recipe.frontmatter.title;
  return analysis;
}
