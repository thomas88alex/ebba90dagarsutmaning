import type { Recipe } from "../../types/recipe";

interface RecipeDetailProps {
  recipe: Recipe;
}

function formatDifference(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function getToleranceClass(target: number, actual: number): string {
  const ratio = target === 0 ? 1 : Math.abs(actual - target) / target;
  return ratio <= 0.1 ? "difference-good" : "difference-neutral";
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  const macroDifference = {
    calories: recipe.calories - recipe.macroTarget.calories,
    protein: recipe.protein - recipe.macroTarget.protein,
    carbohydrates: recipe.carbohydrates - recipe.macroTarget.carbohydrates,
    fat: recipe.fat - recipe.macroTarget.fat,
  };

  return (
    <article className="recipe-detail">
      <header className="recipe-header-card">
        <img src={recipe.image} alt={recipe.title} loading="lazy" />
        <div>
          <p className="eyebrow">{recipe.category}</p>
          <h1>{recipe.title}</h1>
          <div className="recipe-meta-grid">
            <p>Prep: {recipe.prepTime} min</p>
            <p>Cook: {recipe.cookTime} min</p>
            <p>Total: {totalTime} min</p>
            <p>Servings: {recipe.servings}</p>
            <p>Difficulty: {recipe.difficulty}</p>
          </div>
        </div>
      </header>

      <section className="card">
        <h2>Nutrition Overview (Per Serving)</h2>
        <div className="nutrition-grid">
          <div>
            <p className="nutri-value">{recipe.calories} kcal</p>
            <p>Calories</p>
          </div>
          <div>
            <p className="nutri-value">{recipe.protein} g</p>
            <p>Protein</p>
          </div>
          <div>
            <p className="nutri-value">{recipe.carbohydrates} g</p>
            <p>Carbohydrates</p>
          </div>
          <div>
            <p className="nutri-value">{recipe.fat} g</p>
            <p>Fat</p>
          </div>
          <div>
            <p className="nutri-value">{recipe.fibre} g</p>
            <p>Fibre</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Ingredients</h2>
        <ul className="ingredients-list">
          {recipe.ingredients.map((ingredient) => (
            <li key={`${ingredient.name}-${ingredient.amount}`}>
              <span>{ingredient.name}</span>
              <span>
                {ingredient.amount} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Cooking Instructions</h2>
        <ol className="instructions-list">
          {recipe.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      {recipe.notes && recipe.notes.length > 0 ? (
        <section className="card">
          <h2>Recipe Notes</h2>
          <ul className="notes-list">
            {recipe.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Macro Target Comparison</h2>
        <div className="macro-table">
          <div className="macro-row macro-head">
            <span>Metric</span>
            <span>Target</span>
            <span>Recipe</span>
            <span>Difference</span>
          </div>
          <div className="macro-row">
            <span>Calories</span>
            <span>{recipe.macroTarget.calories}</span>
            <span>{recipe.calories}</span>
            <span
              className={getToleranceClass(recipe.macroTarget.calories, recipe.calories)}
            >
              {formatDifference(macroDifference.calories)}
            </span>
          </div>
          <div className="macro-row">
            <span>Protein</span>
            <span>{recipe.macroTarget.protein} g</span>
            <span>{recipe.protein} g</span>
            <span
              className={getToleranceClass(recipe.macroTarget.protein, recipe.protein)}
            >
              {formatDifference(macroDifference.protein)}
            </span>
          </div>
          <div className="macro-row">
            <span>Carbohydrates</span>
            <span>{recipe.macroTarget.carbohydrates} g</span>
            <span>{recipe.carbohydrates} g</span>
            <span
              className={getToleranceClass(
                recipe.macroTarget.carbohydrates,
                recipe.carbohydrates,
              )}
            >
              {formatDifference(macroDifference.carbohydrates)}
            </span>
          </div>
          <div className="macro-row">
            <span>Fat</span>
            <span>{recipe.macroTarget.fat} g</span>
            <span>{recipe.fat} g</span>
            <span className={getToleranceClass(recipe.macroTarget.fat, recipe.fat)}>
              {formatDifference(macroDifference.fat)}
            </span>
          </div>
        </div>
      </section>
    </article>
  );
}
