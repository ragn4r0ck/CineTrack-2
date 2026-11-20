import {
  getContents,
  createContent,
  updateContent,
  deleteContent,
} from "./api.js";
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
  const url = elements.contentImage.value.trim();
  if (url) {
    elements.imagePreview.src = url;
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

function getFormData() {
  const isMovie = elements.contentType.value === "movie";
  const genresArray = elements.contentGenres.value
    ? elements.contentGenres.value.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
  const directorsArray = elements.contentDirectors.value
    ? elements.contentDirectors.value.split(",").map((d) => d.trim()).filter(Boolean)
    : [];
  const countriesArray = elements.contentCountries.value
    ? elements.contentCountries.value.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const data = {
    title: elements.contentTitle.value.trim(),
    type: elements.contentType.value,
    releaseYear: Number(elements.contentYear.value),
    image: elements.contentImage.value.trim(),
    genres: genresArray,
    directors: directorsArray,
    productionCountries: countriesArray,
    description: elements.contentDescription.value.trim(),
  };

  if (isMovie) {
    data.duration = Number(elements.contentDuration.value) || 0;
    data.seasons = undefined;
  } else {
    const seasonsCount = Number(elements.contentSeasons.value) || 1;
    data.seasons = Array.from({ length: seasonsCount }, (_, i) => i + 1);
    data.duration = undefined;
  }

  return data;
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

function fillFormForEdit(item) {
  state.editingId = item.id;
  elements.contentId.value = item.id;
  elements.contentTitle.value = item.title || "";
  elements.contentType.value = item.type || "movie";
  updateTypeVisibility();

  elements.contentYear.value = item.releaseYear || "";
  elements.contentImage.value = item.image || "";
  updateImagePreview();

  if (item.type === "movie") {
    elements.contentDuration.value = item.duration || "";
    elements.contentSeasons.value = "";
  } else {
    elements.contentSeasons.value = item.seasons ? item.seasons.length : 1;
    elements.contentDuration.value = "";
  }

  elements.contentGenres.value = (item.genres || []).join(", ");
  elements.contentDirectors.value = (item.directors || []).join(", ");
  elements.contentCountries.value = (item.productionCountries || []).join(", ");
  elements.contentDescription.value = item.description || "";

  elements.formTitle.textContent = `Modifier : ${item.title}`;
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

elements.contentType.addEventListener("change", updateTypeVisibility);

elements.contentImage.addEventListener("input", updateImagePreview);

elements.cancelEditBtn.addEventListener("click", resetForm);

elements.adminSearchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();
  if (!query) {
    renderTable(state.items);
    return;
  }
  const filtered = state.items.filter((item) =>
    item.title.toLowerCase().includes(query)
  );
  renderTable(filtered);
});

elements.form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = getFormData();
  const validation = validateContent({
    ...formData,
    duration: elements.contentDuration.value,
    seasons: elements.contentSeasons.value,
  });

  if (!validation.isValid) {
    displayFieldErrors(elements.form, validation.errors);
    return;
  }
  clearFieldErrors(elements.form);

  elements.submitBtn.disabled = true;
  const originalText = elements.submitBtn.textContent;
  elements.submitBtn.textContent = "Enregistrement...";

  try {
    if (state.editingId) {
      const existing = state.items.find(
        (i) => String(i.id) === String(state.editingId)
      );
      const payload = { ...existing, ...formData };
      const updated = await updateContent(state.editingId, payload);

      state.items = state.items.map((i) =>
        String(i.id) === String(state.editingId) ? updated : i
      );
      showToast("Titre mis à jour avec succès !");
    } else {
      const created = await createContent(formData);
      state.items.unshift(created);
      showToast("Nouveau titre ajouté avec succès !");
    }

    renderTable(state.items);
    resetForm();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Erreur lors de l'enregistrement.", "error");
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = originalText;
  }
});

elements.tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const item = state.items.find((i) => String(i.id) === String(id));
  if (!item) return;

  if (action === "edit") {
    fillFormForEdit(item);
  } else if (action === "delete") {
    if (!confirm(`Supprimer « ${item.title} » définitivement ?`)) {
      return;
    }

    btn.disabled = true;
    btn.textContent = "...";

    try {
      await deleteContent(item.id);
      state.items = state.items.filter((i) => String(i.id) !== String(item.id));
      renderTable(state.items);

      if (String(state.editingId) === String(item.id)) {
        resetForm();
      }

      showToast(`« ${item.title} » a été supprimé.`);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la suppression.", "error");
      btn.disabled = false;
      btn.textContent = "Supprimer";
    }
  }
});

async function init() {
  updateTypeVisibility();
  showStatus(elements.adminStatus, "loading", "Chargement de la liste des contenus...");
  elements.tableBody.innerHTML = "";

  try {
    state.items = await getContents();
    hideStatus(elements.adminStatus);
    renderTable(state.items);
  } catch (err) {
    console.error(err);
    showStatus(
      elements.adminStatus,
      "error",
      `Impossible de charger les données (${err.message}). Vérifiez votre endpoint MockAPI dans js/api.js.`,
      init
    );
  }
}

init();
