import { getContents } from "./api.js";
import { createCard, showStatus, hideStatus } from "./ui.js";

const state = {
  allTitles: [],
  searchQuery: "",
  currentType: "all",
  currentPage: 1,
  itemsPerPage: 8,
};

const elements = {
  grid: document.getElementById("items-grid"),
  statusMessage: document.getElementById("status-message"),
  searchInput: document.getElementById("search-input"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  paginationContainer: document.getElementById("pagination-container"),
  paginationButtons: document.getElementById("pagination-buttons"),
  currentPageNum: document.getElementById("current-page-num"),
  totalPagesNum: document.getElementById("total-pages-num"),
};

function debounce(func, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

function filterBySearch(items, query) {
  if (!query) return items;
  const clean = query.trim().toLowerCase();
  return items.filter((item) => item.title.toLowerCase().includes(clean));
}

function filterByType(items, type) {
  if (type === "all") return items;
  return items.filter((item) => item.type === type);
}

function paginate(items, page, perPage = 8) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

function updateView() {
  let filtered = filterBySearch(state.allTitles, state.searchQuery);
  filtered = filterByType(filtered, state.currentType);

  const total = filtered.length;

  if (total === 0) {
    elements.grid.innerHTML = "";
    elements.paginationContainer.classList.add("hidden");
    showStatus(elements.statusMessage, "empty", "Aucun résultat trouvé pour votre recherche.");
    return;
  }

  hideStatus(elements.statusMessage);

  const totalPages = Math.ceil(total / state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages || 1;
  }

  const itemsToShow = paginate(filtered, state.currentPage, state.itemsPerPage);

  elements.grid.innerHTML = itemsToShow
    .map((item) => createCard(item, false, 0, 0))
    .join("");

  renderPagination(state.currentPage, totalPages);
}

function renderPagination(currentPage, totalPages) {
  elements.currentPageNum.textContent = currentPage;
  elements.totalPagesNum.textContent = totalPages || 1;

  if (totalPages <= 1) {
    elements.paginationContainer.classList.add("hidden");
    return;
  }
  elements.paginationContainer.classList.remove("hidden");

  let html = `
    <button
      data-page="${currentPage - 1}"
      class="pagination-btn px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded disabled:opacity-40"
      ${currentPage === 1 ? "disabled" : ""}
    >
      Précédent
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    const isCurrent = i === currentPage;
    html += `
      <button
        data-page="${i}"
        class="pagination-btn w-6 h-6 text-xs rounded ${
          isCurrent
            ? "bg-red-600 text-white font-bold"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }"
      >
        ${i}
      </button>
    `;
  }

  html += `
    <button
      data-page="${currentPage + 1}"
      class="pagination-btn px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded disabled:opacity-40"
      ${currentPage === totalPages ? "disabled" : ""}
    >
      Suivant
    </button>
  `;

  elements.paginationButtons.innerHTML = html;
}

elements.searchInput.addEventListener(
  "input",
  debounce((e) => {
    state.searchQuery = e.target.value;
    state.currentPage = 1;
    updateView();
  }, 300)
);

elements.filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    elements.filterButtons.forEach((b) => {
      b.className =
        "filter-btn px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium";
    });
    btn.className = "filter-btn px-3 py-1 text-sm rounded bg-red-600 text-white font-medium";

    state.currentType = btn.dataset.type;
    state.currentPage = 1;
    updateView();
  });
});

elements.paginationButtons.addEventListener("click", (e) => {
  const btn = e.target.closest(".pagination-btn");
  if (!btn || btn.disabled) return;

  const page = parseInt(btn.dataset.page, 10);
  if (!isNaN(page) && page !== state.currentPage) {
    state.currentPage = page;
    updateView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

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
