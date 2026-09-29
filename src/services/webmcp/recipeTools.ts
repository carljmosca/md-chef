import { webMCPRegistry } from './registry.ts';
import type { WebMCPTool } from './types.ts';
import type { Recipe, ShoppingItem } from '../../types/recipe.ts';
import { computeNutritionForIngredients, analyzeRecipeNutrition } from '../nutrition.ts';
import { classifyIngredientCategory } from '../markdownParser.ts';
import {
  getAllRecipesFromDB,
  getShoppingListFromDB,
  saveShoppingListToDB,
  getMealPlansFromDB,
  saveMealPlansToDB
} from '../storage.ts';

export interface WebMCPToolsOptions {
  getRecipes?: () => Recipe[];
  addIngredientsFromRecipe?: (recipe: Recipe, servings?: number) => Promise<any> | any;
  addCustomShoppingItem?: (item: any) => Promise<any> | any;
  setMealForDay?: (day: string, mealType: 'breakfast' | 'lunch' | 'dinner', recipeId?: string) => Promise<any> | any;
}

export function registerAllWebMCPTools(options: WebMCPToolsOptions = {}): WebMCPTool[] {
  // Helper to resolve recipe collection
  const getRecipeList = async (): Promise<Recipe[]> => {
    if (options.getRecipes) {
      const list = options.getRecipes();
      if (list && list.length > 0) return list;
    }
    return await getAllRecipesFromDB();
  };

  // Helper to find recipe by id or title
  const findRecipe = async (idOrTitle: string): Promise<Recipe | null> => {
    const recipes = await getRecipeList();
    const query = idOrTitle.trim().toLowerCase();
    return recipes.find(r =>
      r.id.toLowerCase() === query ||
      r.path.toLowerCase() === query ||
      r.frontmatter.title.toLowerCase() === query ||
      r.frontmatter.title.toLowerCase().includes(query)
    ) || null;
  };

  const tools: WebMCPTool[] = [
    // 1. search_recipes
    {
      name: 'search_recipes',
      description: 'Search recipes in MD-Chef by keyword, cuisine/category, difficulty, max cook time, tags, or required ingredients.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free-text search query (matches title, description, tags, ingredients)'
          },
          category: {
            type: 'string',
            description: 'Filter by cuisine or category (e.g., Italian, Asian, Beef, Pasta, Desserts)'
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
            description: 'Filter by difficulty level'
          },
          maxCookTimeMinutes: {
            type: 'number',
            description: 'Maximum cooking or preparation time in minutes'
          },
          requiredIngredient: {
            type: 'string',
            description: 'Ingredient that must be in the recipe (e.g. chicken, garlic, tomatoes)'
          }
        }
      },
      execute: async (input) => {
        const recipes = await getRecipeList();
        const q = (input.query || '').trim().toLowerCase();
        const cat = (input.category || '').trim().toLowerCase();
        const diff = (input.difficulty || '').trim().toLowerCase();
        const reqIng = (input.requiredIngredient || '').trim().toLowerCase();

        const filtered = recipes.filter(r => {
          if (cat && r.category.toLowerCase() !== cat) return false;
          if (diff && (r.frontmatter.difficulty || '').toLowerCase() !== diff) return false;

          if (reqIng) {
            const hasIng = r.ingredients.some(ing =>
              ing.raw.toLowerCase().includes(reqIng) || ing.item.toLowerCase().includes(reqIng)
            );
            if (!hasIng) return false;
          }

          if (q) {
            const titleMatch = r.frontmatter.title.toLowerCase().includes(q);
            const descMatch = (r.frontmatter.description || '').toLowerCase().includes(q);
            const tagMatch = r.frontmatter.tags?.some(t => t.toLowerCase().includes(q));
            const ingMatch = r.ingredients.some(ing => ing.raw.toLowerCase().includes(q));
            if (!titleMatch && !descMatch && !tagMatch && !ingMatch) return false;
          }

          return true;
        });

        return {
          totalMatches: filtered.length,
          recipes: filtered.map(r => ({
            id: r.id,
            title: r.frontmatter.title,
            category: r.category,
            difficulty: r.frontmatter.difficulty || 'Medium',
            prepTime: r.frontmatter.prep_time || 'N/A',
            cookTime: r.frontmatter.cook_time || 'N/A',
            servings: r.frontmatter.servings || 4,
            tags: r.frontmatter.tags || [],
            description: r.frontmatter.description || '',
            ingredientsCount: r.ingredients.length,
            stepsCount: r.instructions.length
          }))
        };
      }
    },

    // 2. get_recipe_details
    {
      name: 'get_recipe_details',
      description: 'Get full recipe details including scaled ingredients, step-by-step instructions, notes, and attribution.',
      inputSchema: {
        type: 'object',
        properties: {
          recipeIdOrTitle: {
            type: 'string',
            description: 'The recipe ID or title (e.g. "margherita-pizza" or "Chicken Marsala")'
          },
          servings: {
            type: 'number',
            description: 'Optional custom serving count to scale ingredients'
          }
        },
        required: ['recipeIdOrTitle']
      },
      execute: async (input) => {
        const recipe = await findRecipe(input.recipeIdOrTitle);
        if (!recipe) {
          throw new Error(`Recipe "${input.recipeIdOrTitle}" not found`);
        }

        const baseServings = recipe.frontmatter.servings || 4;
        const targetServings = input.servings ? Math.max(1, input.servings) : baseServings;
        const scaleFactor = targetServings / baseServings;

        const scaledIngredients = recipe.ingredients.map(ing => ({
          ...ing,
          amount: ing.amount ? Math.round(ing.amount * scaleFactor * 100) / 100 : undefined
        }));

        return {
          id: recipe.id,
          title: recipe.frontmatter.title,
          category: recipe.category,
          difficulty: recipe.frontmatter.difficulty || 'Medium',
          servings: targetServings,
          baseServings,
          prepTime: recipe.frontmatter.prep_time,
          cookTime: recipe.frontmatter.cook_time,
          credit: recipe.frontmatter.credit,
          source: recipe.frontmatter.source,
          description: recipe.frontmatter.description,
          tags: recipe.frontmatter.tags,
          ingredients: scaledIngredients.map(ing => ({
            raw: ing.raw,
            item: ing.item,
            amount: ing.amount,
            unit: ing.unit,
            aisle: ing.section || classifyIngredientCategory(ing.item || ing.raw)
          })),
          instructions: recipe.instructions.map(inst => ({
            step: inst.stepNumber,
            text: inst.text,
            timers: inst.timers.map(t => `${t.label} (${t.totalSeconds}s)`)
          })),
          notes: recipe.notes || []
        };
      }
    },

    // 3. get_random_recipe
    {
      name: 'get_random_recipe',
      description: 'Get a randomized dinner recipe or culinary inspiration, optionally filtered by category or difficulty.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional cuisine category (e.g. Italian, Asian, Beef)'
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
            description: 'Optional difficulty'
          }
        }
      },
      execute: async (input) => {
        const recipes = await getRecipeList();
        let pool = recipes;

        if (input.category) {
          const cat = input.category.toLowerCase();
          pool = pool.filter(r => r.category.toLowerCase() === cat);
        }
        if (input.difficulty) {
          const diff = input.difficulty.toLowerCase();
          pool = pool.filter(r => (r.frontmatter.difficulty || '').toLowerCase() === diff);
        }

        if (pool.length === 0) {
          throw new Error('No recipes found matching the random criteria');
        }

        const picked = pool[Math.floor(Math.random() * pool.length)];
        return {
          id: picked.id,
          title: picked.frontmatter.title,
          category: picked.category,
          difficulty: picked.frontmatter.difficulty,
          prepTime: picked.frontmatter.prep_time,
          cookTime: picked.frontmatter.cook_time,
          description: picked.frontmatter.description,
          servings: picked.frontmatter.servings || 4,
          ingredientsSummary: picked.ingredients.slice(0, 5).map(i => i.item).join(', ')
        };
      }
    },

    // 4. list_categories
    {
      name: 'list_categories',
      description: 'List all available recipe categories/cuisines and the count of recipes in each.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        const recipes = await getRecipeList();
        const counts: Record<string, number> = {};
        for (const r of recipes) {
          counts[r.category] = (counts[r.category] || 0) + 1;
        }
        return {
          totalRecipes: recipes.length,
          categories: Object.entries(counts).map(([category, count]) => ({ category, count }))
        };
      }
    },

    // 5. add_to_shopping_list
    {
      name: 'add_to_shopping_list',
      description: 'Add ingredients from a recipe or custom items into MD-Chef\'s aisle-categorized shopping list.',
      inputSchema: {
        type: 'object',
        properties: {
          recipeTitleOrId: {
            type: 'string',
            description: 'Recipe to add all ingredients from'
          },
          servings: {
            type: 'number',
            description: 'Servings to scale the ingredients for'
          },
          customItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string' },
                amount: { type: 'number' },
                unit: { type: 'string' },
                category: { type: 'string' }
              },
              required: ['item']
            },
            description: 'Custom items to add'
          }
        }
      },
      execute: async (input) => {
        let addedCount = 0;
        let recipeName = '';

        if (input.recipeTitleOrId) {
          const recipe = await findRecipe(input.recipeTitleOrId);
          if (!recipe) {
            throw new Error(`Recipe "${input.recipeTitleOrId}" not found`);
          }
          recipeName = recipe.frontmatter.title;

          if (options.addIngredientsFromRecipe) {
            await options.addIngredientsFromRecipe(recipe, input.servings);
            addedCount += recipe.ingredients.length;
          } else {
            // Standalone storage update
            const currentItems = await getShoppingListFromDB();
            const baseServings = recipe.frontmatter.servings || 4;
            const targetServings = input.servings || baseServings;
            const factor = targetServings / baseServings;

            const newItems: ShoppingItem[] = recipe.ingredients.map(ing => ({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: ing.item || ing.raw,
              amount: ing.amount ? ing.amount * factor : undefined,
              unit: ing.unit,
              raw: ing.raw,
              category: classifyIngredientCategory(ing.item || ing.raw),
              checked: false,
              recipeSource: recipe.frontmatter.title,
              addedAt: new Date().toISOString()
            }));

            await saveShoppingListToDB([...currentItems, ...newItems]);
            addedCount += newItems.length;
          }
        }

        if (input.customItems && input.customItems.length > 0) {
          for (const item of input.customItems) {
            if (options.addCustomShoppingItem) {
              await options.addCustomShoppingItem(item);
            } else {
              const currentItems = await getShoppingListFromDB();
              currentItems.push({
                id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: item.item,
                amount: item.amount,
                unit: item.unit,
                raw: item.item,
                category: item.category || classifyIngredientCategory(item.item),
                checked: false,
                addedAt: new Date().toISOString()
              });
              await saveShoppingListToDB(currentItems);
            }
            addedCount++;
          }
        }

        const updated = await getShoppingListFromDB();
        return {
          success: true,
          addedCount,
          recipeName: recipeName || undefined,
          totalShoppingItems: updated.length
        };
      }
    },

    // 6. get_shopping_list
    {
      name: 'get_shopping_list',
      description: 'Get the current grocery shopping list items categorized by supermarket aisle.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        const items = await getShoppingListFromDB();
        const byCategory: Record<string, any[]> = {};

        for (const item of items) {
          const cat = item.category || 'Other';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push({
            id: item.id,
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            checked: item.checked,
            recipeSource: item.recipeSource
          });
        }

        const checkedCount = items.filter(i => i.checked).length;
        return {
          totalCount: items.length,
          checkedCount,
          remainingCount: items.length - checkedCount,
          aisles: byCategory
        };
      }
    },

    // 7. clear_completed_shopping
    {
      name: 'clear_completed_shopping',
      description: 'Clear all checked off/purchased items from the shopping list.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        const items = await getShoppingListFromDB();
        const remaining = items.filter(i => !i.checked);
        const removedCount = items.length - remaining.length;
        await saveShoppingListToDB(remaining);
        return {
          success: true,
          removedCount,
          remainingCount: remaining.length
        };
      }
    },

    // 8. compute_nutrition
    {
      name: 'compute_nutrition',
      description: 'Compute comprehensive nutritional analysis (calories, protein, carbs, fat, fiber, sodium, % Daily Value) from any list of ingredients.',
      inputSchema: {
        type: 'object',
        properties: {
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: { type: 'string', description: 'Ingredient name (e.g. "chicken breast", "olive oil")' },
                amount: { type: 'number', description: 'Quantity (e.g. 2, 0.5)' },
                unit: { type: 'string', description: 'Unit (e.g. "tbsp", "cups", "grams", "pieces")' },
                raw: { type: 'string', description: 'Full text line (e.g. "2 tbsp olive oil")' }
              },
              required: ['item']
            },
            description: 'List of ingredients with quantities and units'
          },
          servings: {
            type: 'number',
            description: 'Number of servings to divide into (default: 4)'
          }
        },
        required: ['ingredients']
      },
      execute: async (input) => {
        const servings = input.servings || 4;
        const normalized = (input.ingredients || []).map((ing: any) => ({
          raw: ing.raw || `${ing.amount || ''} ${ing.unit || ''} ${ing.item}`.trim(),
          item: ing.item,
          amount: ing.amount,
          unit: ing.unit
        }));

        const result = computeNutritionForIngredients(normalized, servings);
        return {
          servings: result.servings,
          perServing: result.perServing,
          total: result.total,
          percentDailyValue: result.percentDailyValue,
          macroPercentages: result.macroPercentages,
          dietaryHighlights: result.dietaryHighlights,
          ingredientMatches: result.ingredientDetails.map(d => ({
            ingredient: d.raw,
            matchedFood: d.matchedName,
            estimatedGrams: d.estimatedGrams,
            calories: d.nutrients.calories,
            protein: d.nutrients.protein,
            carbs: d.nutrients.carbohydrates,
            fat: d.nutrients.fat
          }))
        };
      }
    },

    // 9. analyze_recipe_nutrition
    {
      name: 'analyze_recipe_nutrition',
      description: 'Analyze complete nutritional facts for any existing recipe in the MD-Chef recipe library.',
      inputSchema: {
        type: 'object',
        properties: {
          recipeIdOrTitle: {
            type: 'string',
            description: 'Recipe ID or title to analyze (e.g. "Beef Wellington", "margherita-pizza")'
          },
          servings: {
            type: 'number',
            description: 'Optional custom serving count'
          }
        },
        required: ['recipeIdOrTitle']
      },
      execute: async (input) => {
        const recipe = await findRecipe(input.recipeIdOrTitle);
        if (!recipe) {
          throw new Error(`Recipe "${input.recipeIdOrTitle}" not found`);
        }

        const analysis = analyzeRecipeNutrition(recipe, input.servings);
        return {
          recipeTitle: recipe.frontmatter.title,
          servings: analysis.servings,
          perServing: analysis.perServing,
          total: analysis.total,
          percentDailyValue: analysis.percentDailyValue,
          macroPercentages: analysis.macroPercentages,
          dietaryHighlights: analysis.dietaryHighlights
        };
      }
    },

    // 10. get_meal_plan
    {
      name: 'get_meal_plan',
      description: 'Get the 7-day meal plan schedule from Monday to Sunday.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        const days = await getMealPlansFromDB();
        const recipes = await getRecipeList();
        const recipeMap = new Map(recipes.map(r => [r.id, r]));

        const formattedDays = (days || []).map(d => {
          const resolveIds = (ids: string[] = []) =>
            ids.map(id => {
              const found = recipeMap.get(id);
              return {
                id,
                title: found ? found.frontmatter.title : id,
                category: found ? found.category : undefined
              };
            });

          return {
            day: d.dayName,
            date: d.date,
            breakfast: resolveIds(d.breakfast),
            lunch: resolveIds(d.lunch),
            dinner: resolveIds(d.dinner)
          };
        });

        return {
          days: formattedDays
        };
      }
    },

    // 11. schedule_meal
    {
      name: 'schedule_meal',
      description: 'Assign a recipe to a specific day of the week in the meal planner calendar.',
      inputSchema: {
        type: 'object',
        properties: {
          day: {
            type: 'string',
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            description: 'Day of the week'
          },
          recipeTitleOrId: {
            type: 'string',
            description: 'Recipe ID or title to schedule'
          }
        },
        required: ['day', 'recipeTitleOrId']
      },
      execute: async (input) => {
        const recipe = await findRecipe(input.recipeTitleOrId);
        if (!recipe) {
          throw new Error(`Recipe "${input.recipeTitleOrId}" not found`);
        }

        if (options.setMealForDay) {
          await options.setMealForDay(input.day, 'dinner', recipe.id);
        } else {
          const days = await getMealPlansFromDB();
          const targetDay = days.find(d => d.dayName.toLowerCase() === input.day.toLowerCase());
          if (targetDay) {
            targetDay.dinner = [recipe.id];
            await saveMealPlansToDB(days);
          }
        }

        return {
          success: true,
          day: input.day,
          scheduledRecipe: recipe.frontmatter.title
        };
      }
    }
  ];

  // Register all tools into the WebMCP registry
  for (const tool of tools) {
    webMCPRegistry.registerTool(tool);
  }

  return tools;
}
