// This file controls the admin page (admin.html).
// It handles the form, the table, and the add / edit / delete actions.

import { getContents, createContent, updateContent, deleteContent } from "./api.js";
import { validateContent } from "./validation.js";
import {
  createAdminRow,
  showStatus,
  hideStatus,
  showToast,
  displayFieldErrors,
  clearFieldErrors,
} from "./ui.js";

const state = {
  items: [],
  editingId: null,
};

const elements = {
  form: document.getElementById("content-form"),
  formTitle: document.getElementById("form-title"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  submitBtn: document.getElementById("submit-content-btn"),
  contentId: document.getElementById("content-id"),
  contentTitle: document.getElementById("content-title"),
  contentType: document.getElementById("content-type"),
  contentYear: document.getElementById("content-year"),
  contentImage: document.getElementById("content-image"),
  imagePreview: document.getElementById("image-preview"),
  imagePreviewPlaceholder: document.getElementById("image-preview-placeholder"),
  movieDurationGroup: document.getElementById("movie-duration-group"),
  seriesSeasonsGroup: document.getElementById("series-seasons-group"),
  contentDuration: document.getElementById("content-duration"),
  contentSeasons: document.getElementById("content-seasons"),
  contentGenres: document.getElementById("content-genres"),
  contentDirectors: document.getElementById("content-directors"),
  contentCountries: document.getElementById("content-countries"),
  contentDescription: document.getElementById("content-description"),
  tableBody: document.getElementById("contents-table-body"),
  adminStatus: document.getElementById("admin-status"),
  contentsTotalBadge: document.getElementById("contents-total-badge"),
  adminSearchInput: document.getElementById("admin-search-input"),
};

// A film shows a duration field, while a series shows a seasons field.
function updateTypeVisibility() {
  const type = elements.contentType.value;

  if (type === "movie") {
    elements.movieDurationGroup.classList.remove("hidden");
    elements.seriesSeasonsGroup.classList.add("hidden");
  } else {
    elements.movieDurationGroup.classList.add("hidden");
    elements.seriesSeasonsGroup.classList.remove("hidden");
  }
}

function updateImagePreview() {
  const imageUrl = elements.contentImage.value.trim();

  if (imageUrl) {
    elements.imagePreview.src = imageUrl;
    elements.imagePreview.classList.remove("hidden");
    elements.imagePreviewPlaceholder.classList.add("hidden");
  } else {
    elements.imagePreview.src = "";
    elements.imagePreview.classList.add("hidden");
    elements.imagePreviewPlaceholder.classList.remove("hidden");
  }
}

elements.imagePreview.addEventListener("error", () => {
  elements.imagePreview.classList.add("hidden");
  elements.imagePreviewPlaceholder.classList.remove("hidden");
  elements.imagePreviewPlaceholder.textContent = "Image invalide";
});

elements.imagePreview.addEventListener("load", () => {
  elements.imagePreview.classList.remove("hidden");
  elements.imagePreviewPlaceholder.classList.add("hidden");
  elements.imagePreviewPlaceholder.textContent = "Aperçu image";
});

// Read the form and turn it into the object expected by the API.
function collectFormData() {
  const isMovie = elements.contentType.value === "movie";

  const genres = elements.contentGenres.value
    ? elements.contentGenres.value.split(",").map((genre) => genre.trim()).filter(Boolean)
    : [];

  const directors = elements.contentDirectors.value
    ? elements.contentDirectors.value.split(",").map((director) => director.trim()).filter(Boolean)
    : [];

  const countries = elements.contentCountries.value
    ? elements.contentCountries.value.split(",").map((country) => country.trim()).filter(Boolean)
    : [];

  const contentData = {
    title: elements.contentTitle.value.trim(),
    type: elements.contentType.value,
    releaseYear: Number(elements.contentYear.value),
    image: elements.contentImage.value.trim(),
    genres: genres,
    directors: directors,
    productionCountries: countries,
    description: elements.contentDescription.value.trim(),
  };

  if (isMovie) {
    contentData.duration = Number(elements.contentDuration.value) || 0;
    contentData.seasons = undefined;
  } else {
    const seasonsCount = Number(elements.contentSeasons.value) || 1;
    contentData.seasons = Array.from({ length: seasonsCount }, (_, index) => index + 1);
    contentData.duration = undefined;
  }

  return contentData;
}

function resetForm() {
  state.editingId = null;
  elements.contentId.value = "";
  elements.form.reset();
  clearFieldErrors(elements.form);
  elements.formTitle.textContent = "Ajouter un film ou une série";
  elements.submitBtn.textContent = "Ajouter le titre";
  elements.cancelEditBtn.classList.add("hidden");
  updateTypeVisibility();
  updateImagePreview();
}

function fillForm(content) {
  state.editingId = content.id;
  elements.contentId.value = content.id;
  elements.contentTitle.value = content.title || "";
  elements.contentType.value = content.type || "movie";
  updateTypeVisibility();

  elements.contentYear.value = content.releaseYear || "";
  elements.contentImage.value = content.image || "";
  updateImagePreview();

  if (content.type === "movie") {
    elements.contentDuration.value = content.duration || "";
    elements.contentSeasons.value = "";
  } else {
    elements.contentSeasons.value = content.seasons ? content.seasons.length : 1;
    elements.contentDuration.value = "";
  }

  elements.contentGenres.value = (content.genres || []).join(", ");
  elements.contentDirectors.value = (content.directors || []).join(", ");
  elements.contentCountries.value = (content.productionCountries || []).join(", ");
  elements.contentDescription.value = content.description || "";

  elements.formTitle.textContent = `Modifier : ${content.title}`;
  elements.submitBtn.textContent = "Enregistrer les modifications";
  elements.cancelEditBtn.classList.remove("hidden");
  clearFieldErrors(elements.form);

  elements.form.scrollIntoView({ behavior: "smooth" });
}

function renderTable(itemsToRender) {
  elements.contentsTotalBadge.textContent = state.items.length;

  if (itemsToRender.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-gray-500 text-sm">
          Aucun titre trouvé dans le catalogue.
        </td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = itemsToRender.map(createAdminRow).join("");
}

// ---------- Event listeners ----------

elements.contentType.addEventListener("change", updateTypeVisibility);

elements.contentImage.addEventListener("input", updateImagePreview);

elements.cancelEditBtn.addEventListener("click", resetForm);

elements.adminSearchInput.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();

  if (!query) {
    renderTable(state.items);
    return;
  }

  const filteredItems = state.items.filter((item) =>
    item.title.toLowerCase().includes(query)
  );

  renderTable(filteredItems);
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const contentData = collectFormData();

  // The form stores the duration and seasons as text, so we pass the raw
  // values to the validator as well.
  const validation = validateContent({
    ...contentData,
    duration: elements.contentDuration.value,
    seasons: elements.contentSeasons.value,
  });

  if (!validation.isValid) {
    displayFieldErrors(elements.form, validation.errors);
    return;
  }

  clearFieldErrors(elements.form);

  const submitButton = elements.submitBtn;
  submitButton.disabled = true;
  submitButton.textContent = "Enregistrement...";

  try {
    if (state.editingId) {
      const existingContent = state.items.find(
        (item) => String(item.id) === String(state.editingId)
      );

      const updatedContent = { ...existingContent, ...contentData };
      const savedContent = await updateContent(state.editingId, updatedContent);

      state.items = state.items.map((item) =>
        String(item.id) === String(state.editingId) ? savedContent : item
      );

      showToast("Titre mis à jour avec succès !");
    } else {
      const createdContent = await createContent(contentData);
      state.items.unshift(createdContent);
      showToast("Nouveau titre ajouté avec succès !");
    }

    renderTable(state.items);
    resetForm();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Erreur lors de l'enregistrement.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = state.editingId
      ? "Enregistrer les modifications"
      : "Ajouter le titre";
  }
});

elements.tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;
  const content = state.items.find((item) => String(item.id) === String(id));

  if (!content) {
    return;
  }

  if (action === "edit") {
    fillForm(content);
    return;
  }

  if (action === "delete") {
    const confirmed = confirm(`Supprimer « ${content.title} » définitivement ?`);

    if (!confirmed) {
      return;
    }

    button.disabled = true;
    button.textContent = "...";

    try {
      await deleteContent(content.id);

      state.items = state.items.filter(
        (item) => String(item.id) !== String(content.id)
      );

      renderTable(state.items);

      if (String(state.editingId) === String(content.id)) {
        resetForm();
      }

      showToast(`« ${content.title} » a été supprimé.`);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la suppression.", "error");
      button.disabled = false;
      button.textContent = "Supprimer";
    }
  }
});

// ---------- Page start ----------

async function init() {
  updateTypeVisibility();

  showStatus(elements.adminStatus, "loading", "Chargement de la liste des contenus...");
  elements.tableBody.innerHTML = "";

  try {
    state.items = await getContents();
    hideStatus(elements.adminStatus);
    renderTable(state.items);
  } catch (error) {
    console.error(error);
    showStatus(
      elements.adminStatus,
      "error",
      `Impossible de charger les données (${error.message}).`,
      init
    );
  }
}

init();
