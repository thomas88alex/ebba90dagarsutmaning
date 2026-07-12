export type RecipeCategory =
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Snack"
  | "Smoothie"
  | "Dessert";

export type RecipeDifficulty = "Easy" | "Medium" | "Advanced";

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MacroTarget {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  image: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: RecipeDifficulty;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fibre: number;
  ingredients: Ingredient[];
  instructions: string[];
  notes?: string[];
  macroTarget: MacroTarget;
}
