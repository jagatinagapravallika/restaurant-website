// ====== DOM ======
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const randomBtn   = document.getElementById("randomBtn");
const resultsEl   = document.getElementById("results");
const statusEl    = document.getElementById("statusArea");
const cardTpl     = document.getElementById("cardTemplate");

// Modal
const modal       = document.getElementById("modal");
const modalBody   = document.getElementById("modalBody");
const modalClose  = document.getElementById("modalClose");
const modalBackdrop = document.getElementById("modalBackdrop");

// ====== API BASES ======
const API_BASE = "https://www.themealdb.com/api/json/v1/1";
const SEARCH_URL = (q) => `${API_BASE}/search.php?s=${encodeURIComponent(q)}`;
const LOOKUP_URL = (id) => `${API_BASE}/lookup.php?i=${encodeURIComponent(id)}`;
const RANDOM_URL = `${API_BASE}/random.php`;

// ====== Helpers ======
const setStatus = (msg = "") => statusEl.textContent = msg;

const showLoader = () => {
  setStatus(""); // clear text
    resultsEl.innerHTML = `<div class="loader" aria-label="Loading"></div>`;
};

const clearResults = () => resultsEl.innerHTML = "";

function renderMeals(meals) {
    clearResults();
    if (!meals || meals.length === 0) {
    setStatus("No results found. Try another search term.");
    return;
}
    const frag = document.createDocumentFragment();
    meals.forEach(meal => {
    const node = cardTpl.content.cloneNode(true);
    const img = node.querySelector(".card__image");
    const title = node.querySelector(".card__title");
    const meta = node.querySelector(".card__meta");
    const btn = node.querySelector(".card__btn");
    const article = node.querySelector(".card");

    img.src = meal.strMealThumb;
    img.alt = meal.strMeal;
    title.textContent = meal.strMeal;
    meta.textContent = `${meal.strCategory ?? "Unknown"} • ${meal.strArea ?? "N/A"}`;
    btn.dataset.id = meal.idMeal;
    article.dataset.id = meal.idMeal;

    frag.appendChild(node);
});
resultsEl.appendChild(frag);
setStatus(`Showing ${meals.length} result${meals.length > 1 ? "s" : ""}.`);
}

function getIngredientsList(meal) {
const items = [];
for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const mea = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
    const clean = [ing.trim(), mea && mea.trim() ? ` – ${mea.trim()}` : ""].join("");
    items.push(clean);
    }
}
return items;
}

function openModalWithMeal(meal) {
const ingredients = getIngredientsList(meal)
    .map(s => `<li>${s}</li>`).join("");

const ytLink = meal.strYoutube ? `<a class="link" href="${meal.strYoutube}" target="_blank" rel="noopener">▶️ Watch on YouTube</a>` : "";

modalBody.innerHTML = `
    <div class="recipe">
    <div>
        <img class="recipe__img" src="${meal.strMealThumb}" alt="${meal.strMeal}"/>
    </div>
    <div>
        <h2 class="recipe__title">${meal.strMeal}</h2>
        <div class="badges">
        <span class="badge">Category: ${meal.strCategory ?? "N/A"}</span>
        <span class="badge">Cuisine: ${meal.strArea ?? "N/A"}</span>
        ${meal.strTags ? `<span class="badge">Tags: ${meal.strTags}</span>` : ""}
        </div>

        <h3 class="section-title">Ingredients</h3>
        <ul class="ingredients">${ingredients || "<li>Not available</li>"}</ul>

        <h3 class="section-title">Instructions</h3>
        <p>${meal.strInstructions ?? "Not available."}</p>

        <div class="cta">
        ${ytLink}
        ${meal.strSource ? `<a class="ghost" href="${meal.strSource}" target="_blank" rel="noopener">🔗 Source</a>` : ""}
        </div>
    </div>
    </div>
`;

modal.classList.remove("hidden");
modal.setAttribute("aria-hidden", "false");
}

function closeModal(){
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modalBody.innerHTML = "";
}

// ====== Fetchers ======
async function searchMeals(query){
    if (!query || !query.trim()){
    setStatus("Please type something to search.");
    return;
}
showLoader();
try{
    const res = await fetch(SEARCH_URL(query.trim()));
    if(!res.ok) throw new Error("Network error");
    const data = await res.json();
    renderMeals(data.meals || []);
}catch(err){
    clearResults();
    setStatus("Failed to fetch recipes. Please try again.");
    console.error(err);
}
}

async function openDetailsById(id){
try{
    const res = await fetch(LOOKUP_URL(id));
    if(!res.ok) throw new Error("Network error");
    const data = await res.json();
    if (!data.meals || !data.meals[0]) {
    setStatus("Could not load that recipe.");
    return;
    }
    openModalWithMeal(data.meals[0]);
}catch(err){
    setStatus("Failed to load recipe details.");
    console.error(err);
}
}

async function surpriseMe(){
showLoader();
try{
    const res = await fetch(RANDOM_URL);
    if(!res.ok) throw new Error("Network error");
    const data = await res.json();
    renderMeals(data.meals || []);
}catch(err){
    clearResults();
    setStatus("Failed to fetch a random recipe.");
    console.error(err);
}
}

// ====== Events ======
searchBtn.addEventListener("click", () => searchMeals(searchInput.value));
randomBtn.addEventListener("click", surpriseMe);
searchInput.addEventListener("keydown", (e) => {
if (e.key === "Enter") searchMeals(searchInput.value);
});

// open details (event delegation for all cards)
resultsEl.addEventListener("click", (e) => {
const btn = e.target.closest(".card__btn, .card");
if (!btn) return;
const id = btn.dataset.id || btn.closest(".card")?.dataset.id;
if (id) openDetailsById(id);
});

// modal closing
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

// Initial state (optional): show random picks so page isn't empty
surpriseMe();

