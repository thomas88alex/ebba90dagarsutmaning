import type { Recipe, RecipeCategory } from "../../types/recipe";

interface RecipeSidebarProps {
  recipes: Recipe[];
  activeRecipeId: string;
  searchValue: string;
  selectedCategory: RecipeCategory | "All";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: RecipeCategory | "All") => void;
  onRecipeSelect: (recipeId: string) => void;
}

const categoryOptions: Array<RecipeCategory | "All"> = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Smoothie",
  "Dessert",
];

export function RecipeSidebar({
  recipes,
  activeRecipeId,
  searchValue,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onRecipeSelect,
}: RecipeSidebarProps) {
  return (
    <aside className="recipes-sidebar" aria-label="Recipe navigation">
      <h2>Recipe Library</h2>

      <label htmlFor="recipe-search" className="sidebar-label">
        Search recipes
      </label>
      <input
        id="recipe-search"
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by recipe name"
      />

      <div className="category-filters" role="group" aria-label="Filter by category">
        {categoryOptions.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? "chip chip-active" : "chip"}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <ul className="recipe-list" aria-label="Available recipes">
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <li key={recipe.id}>
              <button
                type="button"
                className={
                  activeRecipeId === recipe.id
                    ? "recipe-list-item recipe-list-item-active"
                    : "recipe-list-item"
                }
                onClick={() => onRecipeSelect(recipe.id)}
              >
                <span className="recipe-list-emoji" aria-hidden="true">
                  {recipe.category === "Breakfast" && "Sun"}
                  {recipe.category === "Lunch" && "Bowl"}
                  {recipe.category === "Dinner" && "Moon"}
                  {recipe.category === "Snack" && "Leaf"}
                  {recipe.category === "Smoothie" && "Blend"}
                  {recipe.category === "Dessert" && "Sweet"}
                </span>
                <span>
                  <strong>{recipe.title}</strong>
                  <small>{recipe.category}</small>
                </span>
              </button>
            </li>
          ))
        ) : (
          <li className="recipe-empty">No recipes matched your search.</li>
        )}
      </ul>
    </aside>
  );
}
