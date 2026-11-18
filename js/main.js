import { getContents } from "./api.js";
import { createCard, showStatus, hideStatus } from "./ui.js";

const state = {
  allTitles: [],
};

const elements = {
  grid: document.getElementById("items-grid"),
  statusMessage: document.getElementById("status-message"),
  paginationContainer: document.getElementById("pagination-container"),
};

function updateView() {
  if (state.allTitles.length === 0) {
    elements.grid.innerHTML = "";
    elements.paginationContainer.classList.add("hidden");
    showStatus(elements.statusMessage, "empty", "Aucun résultat trouvé.");
    return;
  }

  hideStatus(elements.statusMessage);

  elements.grid.innerHTML = state.allTitles
    .map((item) => createCard(item, false, 0, 0))
    .join("");
}

async function init() {
  showStatus(elements.statusMessage, "loading", "Chargement des titres...");
  elements.grid.innerHTML = "";
  elements.paginationContainer.classList.add("hidden");

  try {
    state.allTitles = await getContents();
    updateView();
  } catch (err) {
    console.error(err);
    showStatus(
      elements.statusMessage,
      "error",
      `Erreur lors du chargement des données (${err.message}). Vérifiez votre endpoint MockAPI.`,
      init
    );
  }
}

init();
