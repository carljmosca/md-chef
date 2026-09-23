export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';

export interface RecipeFrontmatter {
  title: string;
  prep_time?: string | number;
  cook_time?: string | number;
  total_time?: string | number;
  servings?: number;
  difficulty?: Difficulty | string;
  tags?: string[];
  source?: string;
  credit?: string;
  image?: string;
  description?: string;
  [key: string]: any;
}

export interface IngredientItem {
  id: string;
  raw: string;
  amount?: number;
  unit?: string;
  item: string;
  notes?: string;
  checked?: boolean;
  section?: string;
}

export interface DetectedTimer {
  totalSeconds: number;
  label: string;
}

export interface InstructionStep {
  id: string;
  stepNumber: number;
  text: string;
  section?: string;
  timers: DetectedTimer[];
  completed?: boolean;
}

export interface Recipe {
  id: string; // usually path, e.g. "Italian/chicken-marsala.md"
  path: string;
  category: string; // folder name e.g. "Italian", "Asian", "Mexican"
  filename: string; // e.g. "chicken-marsala.md"
  sha: string; // Git blob SHA
  frontmatter: RecipeFrontmatter;
  rawContent: string;
  ingredients: IngredientItem[];
  instructions: InstructionStep[];
  notes?: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export interface GitCommitInfo {
  sha: string;
  message: string;
  authorName: string;
  date: string;
}

export interface SyncStats {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  total: number;
  lastCommitSha: string;
  lastCommitMessage?: string;
  lastCommitAuthor?: string;
  lastCommitDate?: string;
  timestamp: string;
}

export interface AppSettings {
  repoOwner: string; // default "carljmosca" (or "marked-recipes")
  repoName: string; // default "recipes"
  branch: string; // default "main"
  subdirectory: string; // default ""
  githubToken?: string;
  autoSyncOnLaunch: boolean;
  theme: 'system' | 'light' | 'dark';
  keepAwakeInCookingMode: boolean;
  speechVoiceRate: number; // default 1.0
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  raw: string;
  category: 'Produce' | 'Meat & Seafood' | 'Dairy & Refrigerated' | 'Pantry & Dry Goods' | 'Spices & Seasonings' | 'Bakery' | 'Other';
  checked: boolean;
  recipeSource?: string;
  recipeId?: string;
  addedAt: string;
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  dayName: string; // "Monday", etc.
  breakfast?: string; // recipeId
  lunch?: string; // recipeId
  dinner?: string; // recipeId
  notes?: string;
}
