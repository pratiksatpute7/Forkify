import Search from "./models/Search";
import { elements, renderLoader, clearLoader } from "./views/base";
import * as searchView from "./views/searchView";
import Recipe from "./models/Recipe";
import List from "./models/List";
import * as listView from "./views/listView";
import * as recipeView from "./views/recipeView";
import Likes from "./models/Likes";
import * as likesView from "./views/likesView";

/* Globle state of the app
-- Search Object
-- Current recepie object
-- Shopping list object
-- Liked recipes
*/
const state = {};

//SEARCH CONTROLLER

const controlSearch = async () => {
  //1) Get the query from the view
  //const query = document.querySelector(".search__field").value;
  const query = searchView.getInput();
  //const query = "pizza";

  if (query) {
    //2) new search Object
    state.search = new Search(query);

    //3) Prepare UI for result
    searchView.clearInput();
    searchView.clearResult();
    renderLoader(elements.searchRes);
    try {
      //4)  Search for recipe
      await state.search.getResult();
      clearLoader();

      //5) Render Result on UI
      //console.log(state.search.result);
      searchView.renderResult(state.search.result);
    } catch (error) {
      alert("error prossing");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", (el) => {
  el.preventDefault();
  controlSearch();
});

//TESTING

elements.searchResPages.addEventListener("click", (event) => {
  //console.log(event.target);
  const btn = event.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    //console.log(goToPage);
    searchView.clearResult();
    searchView.renderResult(state.search.result, goToPage);
  }
});

//RECIPE CONTROLLER
const controlRecipe = async () => {
  //get the id from url
  let id = window.location.hash;
  id = parseInt(id.slice(1, id.length));
  if (id) {
    //Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    //highlight selected
    if (state.search) searchView.highlightSelected(id);
    //create new Recipe object
    state.recipe = new Recipe(id);

    try {
      //get recipe and parse the Ingredients
      await state.recipe.getRecipe();

      state.recipe.parseIngredients();

      //Calculate serving
      state.recipe.calcServings();

      //Calculate time
      state.recipe.calcTime();

      clearLoader();

      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert("Error Prossing1");
    }
  }
};
// state.likes = new Likes();
// likesView.toggleLikeMenu(state.likes.getNumLikes());
// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);
["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

// Handle delete and update list item events

elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  // Handle the delete button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    // Delete from state
    state.list.deleteItem(id);

    // Delete from UI
    listView.deleteItem(id);

    // Handle the count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

//handelling recipe control
elements.recipe.addEventListener("click", (e) => {
  if (event.target.matches(".btn-decrease,.btn-decrease *")) {
    //Decrease is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (event.target.matches(".btn-increase,.btn-increase *")) {
    //increase is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    // Add ingredients to shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    // Like controller
    controlLike();
  }
  //console.log(state.recipe);
});

// LIST CONTROLLER
const controlList = () => {
  // Create a new list IF there in none yet
  if (!state.list) state.list = new List();

  // Add each ingredient to the list and UI
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

/**
 * LIKE CONTROLLER
 */
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // User has NOT yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // Toggle the like button
    likesView.toggleLikeBtn(true);

    // Add like to UI list
    likesView.renderLike(newLike);

    // User HAS liked current recipe
  } else {
    // Remove like from the state
    state.likes.deleteLike(currentID);

    // Toggle the like button
    likesView.toggleLikeBtn(false);

    // Remove like from UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};
// Restore liked recipes on page load
window.addEventListener("load", () => {
  state.likes = new Likes();

  // Restore likes
  state.likes.readStorage();

  // Toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  // Render the existing likes
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});
