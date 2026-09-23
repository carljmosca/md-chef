import type {
  RecipeFrontmatter,
  IngredientItem,
  InstructionStep,
  DetectedTimer,
  Difficulty
} from '../types/recipe';

/**
 * Extracts YAML frontmatter and markdown body from raw file string
 */
export function extractFrontmatter(rawContent: string): {
  frontmatter: RecipeFrontmatter;
  body: string;
} {
  const trimmed = rawContent.trim();
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = trimmed.match(fmRegex);

  if (!match) {
    // If no frontmatter delimiters, fallback to parsing header # Title
    const titleMatch = trimmed.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Recipe';
    return {
      frontmatter: { title },
      body: trimmed
    };
  }

  const rawYaml = match[1];
  const body = match[2];

  const frontmatter: RecipeFrontmatter = {
    title: 'Untitled Recipe'
  };

  const lines = rawYaml.split(/\r?\n/);
  let currentKey: string | null = null;
  let isArray = false;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey && isArray) {
      arrayValues.push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    if (isArray && currentKey) {
      frontmatter[currentKey] = arrayValues;
      isArray = false;
      arrayValues = [];
      currentKey = null;
    }

    const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const val = kvMatch[2].trim();

      if (val === '') {
        currentKey = key;
        isArray = true;
        arrayValues = [];
      } else {
        // Strip quotes
        let cleanVal: any = val.replace(/^['"]|['"]$/g, '');
        // Parse numbers if applicable
        if (key === 'servings') {
          const num = parseInt(cleanVal, 10);
          cleanVal = isNaN(num) ? 4 : num;
        } else if (key === 'difficulty') {
          const d = cleanVal.toLowerCase();
          if (d.includes('easy')) cleanVal = 'Easy';
          else if (d.includes('hard') || d.includes('advanced')) cleanVal = 'Hard';
          else cleanVal = 'Medium';
        }
        frontmatter[key] = cleanVal;
      }
    }
  }

  if (isArray && currentKey) {
    frontmatter[currentKey] = arrayValues;
  }

  // Format difficulty if missing
  if (!frontmatter.difficulty) {
    frontmatter.difficulty = 'Medium' as Difficulty;
  }

  return { frontmatter, body };
}

/**
 * Detects timers mentioned in instructions text
 * Examples: "cook for 8-10 minutes", "wait 30 seconds", "bake for 1 hour", "60 - 80 minutes"
 */
export function extractTimers(text: string): DetectedTimer[] {
  const timers: DetectedTimer[] = [];
  // Regex matching patterns like "10 minutes", "8-10 mins", "30 seconds", "1 to 2 hours", "1.5 hr"
  const regex = /(\b\d+(?:[\.\/]\d+)?(?:\s*(?:-|to)\s*\d+(?:[\.\/]\d+)?)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const timeExpr = match[1];
    const unit = match[2].toLowerCase();

    // Take upper bound of range if range like 8-10
    let numeric = 0;
    if (timeExpr.includes('-') || timeExpr.includes('to')) {
      const parts = timeExpr.split(/-|to/).map(s => parseFloat(s.trim()));
      numeric = Math.max(...parts.filter(n => !isNaN(n)));
    } else {
      numeric = parseFloat(timeExpr);
    }

    if (isNaN(numeric) || numeric <= 0) continue;

    let totalSeconds = 0;
    if (unit.startsWith('sec')) {
      totalSeconds = Math.round(numeric);
    } else if (unit.startsWith('min')) {
      totalSeconds = Math.round(numeric * 60);
    } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
      totalSeconds = Math.round(numeric * 3600);
    }

    if (totalSeconds > 0 && totalSeconds <= 3600 * 24) {
      timers.push({
        totalSeconds,
        label: match[0]
      });
    }
  }

  return timers;
}

/**
 * Classifies an ingredient into a grocery store aisle category
 */
export function classifyIngredientCategory(
  item: string
): 'Produce' | 'Meat & Seafood' | 'Dairy & Refrigerated' | 'Pantry & Dry Goods' | 'Spices & Seasonings' | 'Bakery' | 'Other' {
  const lower = item.toLowerCase();

  // Meat & Seafood
  if (
    /\b(chicken|beef|pork|prosciutto|shrimp|clam|clams|bacon|turkey|steak|sausage|meat|salmon|fish|tenderloin|roast|veal|lamb)\b/.test(
      lower
    )
  ) {
    return 'Meat & Seafood';
  }

  // Dairy & Refrigerated
  if (
    /\b(butter|milk|cheese|mozzarella|parmesan|ricotta|cream|yogurt|egg|eggs|pecorino|cheddar|half and half)\b/.test(
      lower
    )
  ) {
    return 'Dairy & Refrigerated';
  }

  // Produce
  if (
    /\b(onion|shallot|garlic|mushroom|mushrooms|tomato|tomatoes|basil|thyme|rosemary|parsley|cilantro|lettuce|lemon|lime|spinach|carrot|celery|potato|potatoes|scallion|bell pepper|avocado|pea|peas|artichoke|ginger|kale)\b/.test(
      lower
    )
  ) {
    return 'Produce';
  }

  // Bakery
  if (/\b(bread|puff pastry|dough|crust|baguette|buns|tortilla|tortillas|pita)\b/.test(lower)) {
    return 'Bakery';
  }

  // Spices & Seasonings
  if (
    /\b(salt|pepper|kosher salt|black pepper|oregano|paprika|cumin|cinnamon|nutmeg|bay leaf|chili flakes|crushed red pepper|cardamom|turmeric|vanilla)\b/.test(
      lower
    )
  ) {
    return 'Spices & Seasonings';
  }

  // Pantry
  if (
    /\b(oil|olive oil|flour|sugar|pasta|linguine|spaghetti|rice|stock|broth|wine|sauce|vinegar|yeast|can |canned|beans|soy sauce|fish sauce|sesame|cornstarch|honey|baking)\b/.test(
      lower
    )
  ) {
    return 'Pantry & Dry Goods';
  }

  return 'Other';
}

/**
 * Parse ingredients and instructions sections from markdown body
 */
export function parseRecipeBody(
  body: string,
  recipeId: string
): {
  ingredients: IngredientItem[];
  instructions: InstructionStep[];
  notes?: string;
} {
  const lines = body.split(/\r?\n/);
  const ingredients: IngredientItem[] = [];
  const instructions: InstructionStep[] = [];
  let notesLines: string[] = [];

  let currentMode: 'none' | 'ingredients' | 'instructions' | 'notes' = 'none';
  let currentSection = '';
  let stepIndex = 1;
  let ingIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check header
    if (/^##\s+Ingredients/i.test(line)) {
      currentMode = 'ingredients';
      currentSection = '';
      continue;
    } else if (/^##\s+Instructions/i.test(line) || /^##\s+Directions/i.test(line) || /^##\s+Method/i.test(line)) {
      currentMode = 'instructions';
      currentSection = '';
      continue;
    } else if (/^##\s+Notes/i.test(line)) {
      currentMode = 'notes';
      continue;
    } else if (/^##\s+/i.test(line)) {
      // Another secondary section
      if (line.toLowerCase().includes('ingredient')) currentMode = 'ingredients';
      else if (line.toLowerCase().includes('instruction') || line.toLowerCase().includes('step')) currentMode = 'instructions';
      else currentMode = 'none';
      currentSection = '';
      continue;
    }

    // Check subsection headers like ### For the Dough
    if (/^###\s+(.+)$/.test(line)) {
      currentSection = line.replace(/^###\s+/, '').trim();
      continue;
    }

    if (currentMode === 'ingredients') {
      // Look for list items: - [ ] item, - item, * item
      const itemMatch = line.match(/^[-*]\s*(?:\[[ xX]?\])?\s*(.+)$/);
      if (itemMatch) {
        const rawItem = itemMatch[1].trim();
        if (rawItem.length > 0) {
          ingredients.push({
            id: `${recipeId}-ing-${ingIndex++}`,
            raw: rawItem,
            item: rawItem,
            section: currentSection || undefined,
            checked: false
          });
        }
      }
    } else if (currentMode === 'instructions') {
      // Look for: 1. [ ] text, 1. text, - [ ] text, - text
      const stepMatch = line.match(/^(?:\d+\.|\-|\*)\s*(?:\[[ xX]?\])?\s*(.+)$/);
      if (stepMatch) {
        const stepText = stepMatch[1].trim();
        if (stepText.length > 0) {
          instructions.push({
            id: `${recipeId}-step-${stepIndex}`,
            stepNumber: stepIndex++,
            text: stepText,
            section: currentSection || undefined,
            timers: extractTimers(stepText),
            completed: false
          });
        }
      }
    } else if (currentMode === 'notes') {
      if (line.length > 0) {
        notesLines.push(line);
      }
    }
  }

  return {
    ingredients,
    instructions,
    notes: notesLines.length > 0 ? notesLines.join('\n') : undefined
  };
}

/**
 * Format fractions for clean serving scaling display (e.g. 1.5 -> "1 1/2", 0.25 -> "1/4")
 */
function toFractionString(val: number): string {
  if (Math.abs(val - Math.round(val)) < 0.05) {
    return Math.round(val).toString();
  }

  const whole = Math.floor(val);
  const frac = val - whole;

  const fractions: [number, string][] = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.666, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8']
  ];

  for (const [fVal, fStr] of fractions) {
    if (Math.abs(frac - fVal) < 0.06) {
      return whole > 0 ? `${whole} ${fStr}` : fStr;
    }
  }

  return val.toFixed(1).replace(/\.0$/, '');
}

/**
 * Scales an ingredient string by a multiplier (targetServings / baseServings)
 */
export function scaleIngredientQuantity(raw: string, scaleFactor: number): string {
  if (scaleFactor === 1 || scaleFactor <= 0) return raw;

  // Match leading quantity: "3 1/2 cups", "1 (about 16-ounce)", "2 tablespoons", "1/4 cup"
  const qtyMatch = raw.match(/^((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/);
  if (!qtyMatch) return raw;

  const numPart = qtyMatch[1].trim();
  const restPart = qtyMatch[2];

  let originalQty = 0;
  if (numPart.includes('/')) {
    const spaceParts = numPart.split(/\s+/);
    if (spaceParts.length === 2) {
      const [n, d] = spaceParts[1].split('/').map(Number);
      originalQty = parseFloat(spaceParts[0]) + n / d;
    } else {
      const [n, d] = numPart.split('/').map(Number);
      originalQty = n / d;
    }
  } else {
    originalQty = parseFloat(numPart);
  }

  if (isNaN(originalQty) || originalQty <= 0) return raw;

  const scaled = originalQty * scaleFactor;
  return `${toFractionString(scaled)} ${restPart}`;
}
