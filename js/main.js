// This file controls the catalog page (index.html).

import { getContents, getComments, createComment } from "./api.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getPseudo,
  savePseudo,
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

// Data that can change while the page is open.
const state = {
  allTitles: [],
  allComments: [],
  searchQuery: "",
  currentType: "all",
  currentPage: 1,
  itemsPerPage: 8,
  activeItem: null,
};

// We look up each HTML element once and reuse it afterwards.
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

// Wait a short moment after the user stops typing before searching.
function debounce(callback, delay = 300) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

// Calculate the average rating for one film or series.
function getItemRating(contentId) {
  const commentsForItem = state.allComments.filter(
    (comment) => String(comment.contentId) === String(contentId)
  );
  const ratings = commentsForItem.filter((comment) => comment.rating);

  let total = 0;
  ratings.forEach((comment) => {
    total += Number(comment.rating);
  });

  const average = ratings.length > 0 ? total / ratings.length : 0;

  return {
    average,
    count: ratings.length,
  };
}

function filterBySearch(titles, query) {
  if (!query) {
    return titles;
  }

  const searchTerm = query.trim().toLowerCase();
  return titles.filter((title) => title.title.toLowerCase().includes(searchTerm));
}

function filterByType(titles, type) {
  if (type === "all") {
    return titles;
  }

  return titles.filter((title) => title.type === type);
}

function paginate(titles, page, perPage = 8) {
  const startIndex = (page - 1) * perPage;
  return titles.slice(startIndex, startIndex + perPage);
}

// Rebuild the catalog grid and pagination after a change.
function updateView() {
  let visibleTitles = filterBySearch(state.allTitles, state.searchQuery);
  visibleTitles = filterByType(visibleTitles, state.currentType);

  const totalTitles = visibleTitles.length;

  if (totalTitles === 0) {
    elements.grid.innerHTML = "";
    elements.paginationContainer.classList.add("hidden");
    showStatus(elements.statusMessage, "empty", "Aucun résultat trouvé pour votre recherche.");
    return;
  }

  hideStatus(elements.statusMessage);

  const totalPages = Math.ceil(totalTitles / state.itemsPerPage);

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages || 1;
  }

  const titlesForPage = paginate(visibleTitles, state.currentPage, state.itemsPerPage);

  elements.grid.innerHTML = titlesForPage
    .map((content) => {
      const favorite = isFavorite(content.id);
      const rating = getItemRating(content.id);
      return createCard(content, favorite, rating.average, rating.count);
    })
    .join("");

  attachCardEvents();
  renderPagination(state.currentPage, totalPages);
}

// The heart button is inside the card, so it needs its own click handler.
function attachCardEvents() {
  const favoriteButtons = elements.grid.querySelectorAll(".favorite-toggle-btn");

  favoriteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(button.dataset.id);
    });
  });
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    removeFavorite(id);
    showToast("Retiré des favoris");
  } else {
    const content = state.allTitles.find((title) => String(title.id) === String(id));

    if (content) {
      addFavorite(content);
      showToast("Ajouté aux favoris");
    }
  }

  renderFavoritesView();
  updateView();
}

function renderFavoritesView() {
  const favorites = getFavorites();
  const count = favorites.length;

  if (elements.mobileFavCount) {
    elements.mobileFavCount.textContent = count;
  }

  if (elements.tabletFavCount) {
    elements.tabletFavCount.textContent = count;
  }

  if (count === 0) {
    elements.favoritesList.innerHTML =
      '<p class="text-xs text-gray-500 text-center py-4">Aucun favori pour le moment.</p>';
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

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const isCurrentPage = pageNumber === currentPage;

    html += `
      <button
        data-page="${pageNumber}"
        class="pagination-btn w-6 h-6 text-xs rounded ${
          isCurrentPage
            ? "bg-red-600 text-white font-bold"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }"
      >
        ${pageNumber}
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
    const starValue = Number(star.dataset.star);

    if (starValue <= rating) {
      star.className = "star text-yellow-400";
    } else {
      star.className = "star text-gray-600";
    }
  });
}

function openModal(content) {
  state.activeItem = content;
  const isMovie = content.type === "movie";

  elements.modalTitle.textContent = content.title;
  elements.modalImage.src = content.image;
  elements.modalImage.alt = content.title;
  elements.modalType.textContent = isMovie ? "Film" : "Série";
  elements.modalYear.textContent = content.releaseYear;
  elements.modalDurationLabel.textContent = isMovie ? "Durée :" : "Saisons :";
  elements.modalDuration.textContent = isMovie
    ? `${content.duration || 0} min`
    : `${content.seasons ? content.seasons.length : 0} saison(s)`;
  elements.modalGenres.textContent = (content.genres || []).join(", ") || "N/A";
  elements.modalDirectors.textContent = (content.directors || []).join(", ") || "Inconnu";
  elements.modalCountries.textContent =
    (content.productionCountries || []).join(", ") || "Inconnu";
  elements.modalDescription.textContent =
    content.description || "Aucune description fournie.";

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
  if (!state.activeItem) {
    return;
  }

  const commentsForItem = state.allComments.filter(
    (comment) => String(comment.contentId) === String(state.activeItem.id)
  );

  elements.commentsCountBadge.textContent = commentsForItem.length;

  const rating = getItemRating(state.activeItem.id);

  if (rating.count > 0) {
    elements.modalRatingBadge.innerHTML = `
      <span class="text-yellow-400">${renderStars(rating.average)}</span>
      <span class="text-xs font-bold text-white">${rating.average.toFixed(1)} / 5</span>
      <span class="text-xs text-gray-400">(${rating.count} avis)</span>
    `;
  } else {
    elements.modalRatingBadge.innerHTML =
      '<span class="text-xs text-gray-400">Aucune note pour le moment</span>';
  }

  if (commentsForItem.length === 0) {
    elements.commentsList.innerHTML =
      '<p class="text-xs text-gray-500 text-center py-4">Aucun commentaire pour ce titre. Soyez le premier à donner votre avis !</p>';
    return;
  }

  elements.commentsList.innerHTML = commentsForItem.map(createCommentItem).join("");
}

// ---------- Event listeners ----------

elements.searchInput.addEventListener(
  "input",
  debounce((event) => {
    state.searchQuery = event.target.value;
    state.currentPage = 1;
    updateView();
  }, 300)
);

elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.filterButtons.forEach((otherButton) => {
      otherButton.className =
        "filter-btn px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium";
    });

    button.className = "filter-btn px-3 py-1 text-sm rounded bg-red-600 text-white font-medium";

    state.currentType = button.dataset.type;
    state.currentPage = 1;
    updateView();
  });
});

elements.paginationButtons.addEventListener("click", (event) => {
  const button = event.target.closest(".pagination-btn");

  if (!button || button.disabled) {
    return;
  }

  const page = parseInt(button.dataset.page, 10);

  if (!isNaN(page) && page !== state.currentPage) {
    state.currentPage = page;
    updateView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

elements.grid.addEventListener("click", (event) => {
  const card = event.target.closest(".movie-card");

  if (!card) {
    return;
  }

  const content = state.allTitles.find(
    (title) => String(title.id) === String(card.dataset.id)
  );

  if (content) {
    openModal(content);
  }
});

elements.favoritesList.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-favorite-btn");

  if (!button) {
    return;
  }

  removeFavorite(button.dataset.removeId);
  renderFavoritesView();
  updateView();
});

elements.starPicker.addEventListener("click", (event) => {
  const star = event.target.closest(".star");

  if (!star) {
    return;
  }

  setStarRating(Number(star.dataset.star));
});

elements.commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.activeItem) {
    return;
  }

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

  const submitButton = document.getElementById("submit-comment-btn");
  submitButton.disabled = true;
  submitButton.textContent = "Publication...";

  try {
    const commentData = {
      contentId: String(state.activeItem.id),
      author: author.trim(),
      text: text.trim(),
      rating: rating,
      createdAt: new Date().toISOString(),
    };

    const createdComment = await createComment(commentData);
    state.allComments.unshift(createdComment);

    elements.commentText.value = "";
    renderModalComments();
    updateView();
    showToast("Avis publié avec succès !");
  } catch (error) {
    console.error(error);
    showToast("Impossible d'ajouter le commentaire.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Publier l'avis";
  }
});

elements.modal.addEventListener("click", (event) => {
  if (event.target === elements.modal || event.target.closest("#close-modal-btn")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
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
  elements.toggleFavoritesBtnMobile.addEventListener("click", () =>
    toggleMobileSidebar(true)
  );
}

if (elements.closeSidebarBtn) {
  elements.closeSidebarBtn.addEventListener("click", () => toggleMobileSidebar(false));
}

if (elements.sidebarOverlay) {
  elements.sidebarOverlay.addEventListener("click", () => toggleMobileSidebar(false));
}

// ---------- Page start ----------

async function init() {
  renderFavoritesView();

  showStatus(elements.statusMessage, "loading", "Chargement des titres et des commentaires...");
  elements.grid.innerHTML = "";
  elements.paginationContainer.classList.add("hidden");

  try {
    // Load both lists at the same time to save time.
    const [titles, comments] = await Promise.all([
      getContents(),
      getComments().catch(() => []),
    ]);

    state.allTitles = titles;
    state.allComments = comments;
    updateView();
  } catch (error) {
    console.error(error);
    showStatus(
      elements.statusMessage,
      "error",
      `Erreur lors du chargement des données (${error.message}).`,
      init
    );
  }
}

init();
