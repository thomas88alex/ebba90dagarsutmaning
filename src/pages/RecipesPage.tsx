import { useMemo, useState } from "react";
import { RecipeDetail } from "../components/recipes/RecipeDetail";
import { RecipeSidebar } from "../components/recipes/RecipeSidebar";
import { sampleRecipes } from "../data/recipes";
import type { RecipeCategory } from "../types/recipe";

export function RecipesPage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "All">("All");
  const [activeRecipeId, setActiveRecipeId] = useState(sampleRecipes[0]?.id ?? "");

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return sampleRecipes.filter((recipe) => {
      const byCategory = selectedCategory === "All" || recipe.category === selectedCategory;
      const bySearch =
        normalizedSearch.length === 0 ||
        recipe.title.toLowerCase().includes(normalizedSearch);

      return byCategory && bySearch;
    });
  }, [searchValue, selectedCategory]);

  const activeRecipe =
    filteredRecipes.find((recipe) => recipe.id === activeRecipeId) ?? filteredRecipes[0] ?? null;

  function handleCategoryChange(category: RecipeCategory | "All") {
    setSelectedCategory(category);
  }

  function handleRecipeSelect(recipeId: string) {
    setActiveRecipeId(recipeId);
  }

  return (
    <section className="recipes-page">
      <RecipeSidebar
        recipes={filteredRecipes}
        activeRecipeId={activeRecipe?.id ?? ""}
        searchValue={searchValue}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchValue}
        onCategoryChange={handleCategoryChange}
        onRecipeSelect={handleRecipeSelect}
      />

      <div className="recipes-content">
        {activeRecipe ? (
          <RecipeDetail recipe={activeRecipe} />
        ) : (
          <article className="placeholder-card">
            <h2>No recipes found</h2>
            <p>Try changing your filters or search phrase.</p>
          </article>
        )}
      </div>
    </section>
  );
}
