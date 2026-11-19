import { getContents, getComments, createComment } from "./api.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getPseudo,
  savePseudo,
  getApiUrl,
  saveApiUrl,
} from "./storage.js";
import { validateComment } from "./validation.js";
import {
  createCard,
  createFavoriteItem,
  createCommentItem,
  renderStars,
  showStatus,
  hideStatus,
  showToast,
  displayFieldErrors,
  clearFieldErrors,
} from "./ui.js";

const state = {
  allTitles: [],
  allComments: [],
  searchQuery: "",
  currentType: "all",
  currentPage: 1,
  itemsPerPage: 8,
  activeItem: null,
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
  favoritesSidebar: document.getElementById("favorites-sidebar"),
  favoritesList: document.getElementById("favorites-list"),
  toggleFavoritesBtn: document.getElementById("toggle-favorites-btn"),
  toggleFavoritesBtnMobile: document.getElementById("toggle-favorites-btn-mobile"),
  closeSidebarBtn: document.getElementById("close-sidebar-btn"),
  sidebarOverlay: document.getElementById("sidebar-overlay"),
  mobileFavCount: document.getElementById("mobile-fav-count"),
  tabletFavCount: document.getElementById("tablet-fav-count"),
  configEndpointBtn: document.getElementById("config-endpoint-btn"),
  modal: document.getElementById("detail-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalImage: document.getElementById("modal-image"),
  modalType: document.getElementById("modal-type"),
  modalYear: document.getElementById("modal-year"),
  modalDurationLabel: document.getElementById("modal-duration-label"),
  modalDuration: document.getElementById("modal-duration"),
  modalGenres: document.getElementById("modal-genres"),
  modalDirectors: document.getElementById("modal-directors"),
  modalCountries: document.getElementById("modal-countries"),
  modalDescription: document.getElementById("modal-description"),
  modalRatingBadge: document.getElementById("modal-rating-badge"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  commentsList: document.getElementById("comments-list"),
  commentsCountBadge: document.getElementById("comments-count-badge"),
  commentForm: document.getElementById("comment-form"),
  commentAuthor: document.getElementById("comment-author"),
  commentText: document.getElementById("comment-text"),
  starPicker: document.getElementById("star-picker"),
  commentRatingValue: document.getElementById("comment-rating-value"),
};

function debounce(func, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

function getItemRating(contentId) {
  const itemComments = state.allComments.filter(
    (c) => String(c.contentId) === String(contentId)
  );
  const notes = itemComments.filter((c) => c.rating);
  const avg = notes.length
    ? notes.reduce((sum, c) => sum + Number(c.rating), 0) / notes.length
    : 0;
  return {
    avg,
    count: notes.length,
    totalComments: itemComments.length,
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
    .map((item) => {
      const isFav = isFavorite(item.id);
      const ratingInfo = getItemRating(item.id);
      return createCard(item, isFav, ratingInfo.avg, ratingInfo.count);
    })
    .join("");

  attachCardEvents();
  renderPagination(state.currentPage, totalPages);
}

function attachCardEvents() {
  const favBtns = elements.grid.querySelectorAll(".favorite-toggle-btn");
  favBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleFavorite(id);
    });
  });
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    removeFavorite(id);
    showToast("Retiré des favoris");
  } else {
    const item = state.allTitles.find((t) => String(t.id) === String(id));
    if (item) {
      addFavorite(item);
      showToast("Ajouté aux favoris");
    }
  }

  renderFavoritesView();
  updateView();
}

function renderFavoritesView() {
  const favorites = getFavorites();
  const count = favorites.length;

  if (elements.mobileFavCount) elements.mobileFavCount.textContent = count;
  if (elements.tabletFavCount) elements.tabletFavCount.textContent = count;

  if (count === 0) {
    elements.favoritesList.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Aucun favori pour le moment.</p>';
    return;
  }

  elements.favoritesList.innerHTML = favorites.map(createFavoriteItem).join("");
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

function setStarRating(rating) {
  elements.commentRatingValue.value = rating;
  const stars = elements.starPicker.querySelectorAll(".star");
  stars.forEach((star) => {
    const val = Number(star.dataset.star);
    if (val <= rating) {
      star.className = "star text-yellow-400";
    } else {
      star.className = "star text-gray-600";
    }
  });
}

function openModal(item) {
  state.activeItem = item;
  const isMovie = item.type === "movie";

  elements.modalTitle.textContent = item.title;
  elements.modalImage.src = item.image;
  elements.modalImage.alt = item.title;
  elements.modalType.textContent = isMovie ? "Film" : "Série";
  elements.modalYear.textContent = item.releaseYear;
  elements.modalDurationLabel.textContent = isMovie ? "Durée :" : "Saisons :";
  elements.modalDuration.textContent = isMovie
    ? `${item.duration || 0} min`
    : `${item.seasons ? item.seasons.length : 0} saison(s)`;
  elements.modalGenres.textContent = (item.genres || []).join(", ") || "N/A";
  elements.modalDirectors.textContent = (item.directors || []).join(", ") || "Inconnu";
  elements.modalCountries.textContent = (item.productionCountries || []).join(", ") || "Inconnu";
  elements.modalDescription.textContent = item.description || "Aucune description fournie.";

  elements.commentAuthor.value = getPseudo();
  setStarRating(5);
  clearFieldErrors(elements.commentForm);
  elements.commentText.value = "";

  renderModalComments();
  elements.modal.classList.remove("hidden");
}

function closeModal() {
  elements.modal.classList.add("hidden");
  state.activeItem = null;
}

function renderModalComments() {
  if (!state.activeItem) return;

  const itemComments = state.allComments.filter(
    (c) => String(c.contentId) === String(state.activeItem.id)
  );

  elements.commentsCountBadge.textContent = itemComments.length;

  const ratingInfo = getItemRating(state.activeItem.id);
  if (ratingInfo.count > 0) {
    elements.modalRatingBadge.innerHTML = `
      <span class="text-yellow-400">${renderStars(ratingInfo.avg)}</span>
      <span class="text-xs font-bold text-white">${ratingInfo.avg.toFixed(1)} / 5</span>
      <span class="text-xs text-gray-400">(${ratingInfo.count} avis)</span>
    `;
  } else {
    elements.modalRatingBadge.innerHTML = '<span class="text-xs text-gray-400">Aucune note pour le moment</span>';
  }

  if (itemComments.length === 0) {
    elements.commentsList.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Aucun commentaire pour ce titre. Soyez le premier à donner votre avis !</p>';
    return;
  }

  elements.commentsList.innerHTML = itemComments.map(createCommentItem).join("");
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

elements.grid.addEventListener("click", (e) => {
  const card = e.target.closest(".movie-card");
  if (!card) return;

  const id = card.dataset.id;
  const item = state.allTitles.find((t) => String(t.id) === String(id));
  if (item) {
    openModal(item);
  }
});

elements.favoritesList.addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-favorite-btn");
  if (!btn) return;

  const id = btn.dataset.removeId;
  removeFavorite(id);
  renderFavoritesView();
  updateView();
});

elements.starPicker.addEventListener("click", (e) => {
  const star = e.target.closest(".star");
  if (!star) return;
  const val = Number(star.dataset.star);
  setStarRating(val);
});

elements.commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.activeItem) return;

  const author = elements.commentAuthor.value;
  const text = elements.commentText.value;
  const rating = Number(elements.commentRatingValue.value);

  const validation = validateComment({ author, text });
  if (!validation.isValid) {
    displayFieldErrors(elements.commentForm, validation.errors);
    return;
  }
  clearFieldErrors(elements.commentForm);

  savePseudo(author);

  const submitBtn = document.getElementById("submit-comment-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Publication...";

  try {
    const newCommentPayload = {
      contentId: String(state.activeItem.id),
      author: author.trim(),
      text: text.trim(),
      rating: rating,
      createdAt: new Date().toISOString(),
    };

    const savedComment = await createComment(newCommentPayload);
    state.allComments.unshift(savedComment);

    elements.commentText.value = "";
    renderModalComments();
    updateView();
    showToast("Avis publié avec succès !");
  } catch (error) {
    console.error(error);
    showToast("Impossible d'ajouter le commentaire.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Publier l'avis";
  }
});

elements.modal.addEventListener("click", (e) => {
  if (e.target === elements.modal || e.target.closest("#close-modal-btn")) {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

function toggleMobileSidebar(open) {
  if (open) {
    elements.favoritesSidebar.classList.remove("translate-x-full");
    elements.sidebarOverlay.classList.remove("hidden");
  } else {
    elements.favoritesSidebar.classList.add("translate-x-full");
    elements.sidebarOverlay.classList.add("hidden");
  }
}

if (elements.toggleFavoritesBtn) {
  elements.toggleFavoritesBtn.addEventListener("click", () => toggleMobileSidebar(true));
}
if (elements.toggleFavoritesBtnMobile) {
  elements.toggleFavoritesBtnMobile.addEventListener("click", () => toggleMobileSidebar(true));
}
if (elements.closeSidebarBtn) {
  elements.closeSidebarBtn.addEventListener("click", () => toggleMobileSidebar(false));
}
if (elements.sidebarOverlay) {
  elements.sidebarOverlay.addEventListener("click", () => toggleMobileSidebar(false));
}

if (elements.configEndpointBtn) {
  elements.configEndpointBtn.addEventListener("click", () => {
    const current = getApiUrl() || "https://VOTRE-ID.mockapi.io/api/v1";
    const next = prompt("Entrez l'URL de votre MockAPI (ex: https://6737....mockapi.io/api/v1) :", current);
    if (next !== null && next.trim()) {
      saveApiUrl(next.trim());
      window.location.reload();
    }
  });
}

async function init() {
  renderFavoritesView();

  showStatus(elements.statusMessage, "loading", "Chargement des titres et des commentaires...");
  elements.grid.innerHTML = "";
  elements.paginationContainer.classList.add("hidden");

  try {
    const [titles, comments] = await Promise.all([
      getContents(),
      getComments().catch(() => []),
    ]);

    state.allTitles = titles;
    state.allComments = comments;
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
