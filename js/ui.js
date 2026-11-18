export function renderStars(rating = 0) {
  const rounded = Math.round(rating);
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      starsHtml += '<span class="text-yellow-400">★</span>';
    } else {
      starsHtml += '<span class="text-gray-600">★</span>';
    }
  }
  return starsHtml;
}

export function createCard(item, isFavorite = false, rating = 0, ratingCount = 0) {
  const isMovie = item.type === "movie";
  const typeText = isMovie ? "Film" : "Série";
  const ratingDisplay =
    ratingCount > 0
      ? `<span class="flex items-center gap-1 text-xs text-yellow-400"><span>★</span><span>${rating.toFixed(1)}</span> <span class="text-gray-400">(${ratingCount})</span></span>`
      : `<span class="text-xs text-gray-500">Non noté</span>`;

  return `
    <div data-id="${item.id}" class="movie-card bg-gray-800 border border-gray-700 rounded overflow-hidden cursor-pointer hover:border-gray-500 flex flex-col justify-between transition">
      <div>
        <div class="relative bg-gray-900 aspect-[2/3] w-full">
          <img 
            src="${item.image}" 
            alt="${item.title}" 
            class="w-full h-full object-cover"
            onerror="this.src='https://via.placeholder.com/300x450?text=Image+Indisponible'"
          />
          <button 
            data-id="${item.id}" 
            class="favorite-toggle-btn absolute top-2 right-2 bg-gray-900/80 hover:bg-black rounded-full w-8 h-8 flex items-center justify-center text-sm"
            title="${isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}"
          >
            <span class="${isFavorite ? "text-red-500" : "text-gray-400"}">♥</span>
          </button>
        </div>

        <div class="p-3">
          <h3 class="font-bold text-sm text-white line-clamp-1">${item.title}</h3>
          <p class="text-xs text-gray-400 mt-1">${typeText} • ${item.releaseYear}</p>
        </div>
      </div>
      <div class="px-3 pb-3 pt-1 border-t border-gray-700/50 flex items-center justify-between">
        ${ratingDisplay}
      </div>
    </div>
  `;
}

export function createFavoriteItem(item) {
  const isMovie = item.type === "movie";
  const typeText = isMovie ? "Film" : "Série";

  return `
    <div class="flex items-center justify-between bg-gray-900 p-2 rounded border border-gray-700 text-xs">
      <div class="flex items-center gap-2 overflow-hidden mr-2">
        <img src="${item.image}" alt="${item.title}" class="w-8 h-10 object-cover rounded shrink-0">
        <div class="truncate">
          <p class="font-medium text-white truncate">${item.title}</p>
          <p class="text-gray-400 text-[11px]">${typeText} (${item.releaseYear})</p>
        </div>
      </div>
      <button data-remove-id="${item.id}" class="remove-favorite-btn text-gray-400 hover:text-red-400 px-1 font-bold">
        ✕
      </button>
    </div>
  `;
}

export function createAdminRow(item) {
  const isMovie = item.type === "movie";
  const typeBadge = isMovie
    ? '<span class="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-700">Film</span>'
    : '<span class="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-700">Série</span>';

  const extraInfo = isMovie
    ? `${item.duration || 0} min`
    : `${item.seasons ? item.seasons.length : 0} saison(s)`;

  return `
    <tr data-id="${item.id}" class="border-b border-gray-700 hover:bg-gray-800/60 transition">
      <td class="p-3">
        <img 
          src="${item.image}" 
          alt="${item.title}" 
          class="w-12 h-16 object-cover rounded bg-gray-900 border border-gray-700"
          onerror="this.src='https://via.placeholder.com/100x150?text=N/A'"
        />
      </td>
      <td class="p-3">
        <div class="font-bold text-white text-sm">${item.title}</div>
        <div class="text-xs text-gray-400 mt-0.5">${(item.genres || []).join(", ") || "Aucun genre"}</div>
        <div class="text-[11px] text-gray-500 mt-0.5">${extraInfo}</div>
      </td>
      <td class="p-3 text-sm">
        ${typeBadge}
      </td>
      <td class="p-3 text-sm text-gray-300">
        ${item.releaseYear}
      </td>
      <td class="p-3 text-right">
        <div class="flex items-center justify-end gap-2">
          <button 
            data-action="edit" 
            data-id="${item.id}" 
            class="edit-btn bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded transition"
          >
            Modifier
          </button>
          <button 
            data-action="delete" 
            data-id="${item.id}" 
            class="delete-btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded transition"
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  `;
}

export function createCommentItem(comment) {
  const dateFormatted = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const stars = comment.rating ? renderStars(Number(comment.rating)) : "";

  return `
    <div class="bg-gray-900/80 border border-gray-700 rounded p-3 text-xs space-y-1.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-bold text-white">${comment.author}</span>
          ${stars ? `<span class="text-xs">${stars}</span>` : ""}
        </div>
        <span class="text-gray-500 text-[11px]">${dateFormatted}</span>
      </div>
      <p class="text-gray-300 leading-relaxed break-words">${comment.text}</p>
    </div>
  `;
}

export function showStatus(element, type, message = "", onRetry = null) {
  element.classList.remove("hidden");

  if (type === "loading") {
    element.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
        <div class="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm">${message || "Chargement..."}</span>
      </div>
    `;
  } else if (type === "error") {
    element.innerHTML = `
      <div class="p-4 bg-red-900/30 border border-red-800 rounded inline-block text-center max-w-md mx-auto my-6">
        <p class="text-sm text-red-300 mb-3">${message || "Une erreur est survenue."}</p>
        ${
          onRetry
            ? '<button id="retry-btn" class="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-1.5 rounded">Réessayer</button>'
            : ""
        }
      </div>
    `;

    if (onRetry) {
      const btn = element.querySelector("#retry-btn");
      if (btn) btn.addEventListener("click", onRetry);
    }
  } else if (type === "empty") {
    element.innerHTML = `
      <div class="py-10 text-center text-gray-400 text-sm">
        ${message || "Aucun résultat trouvé."}
      </div>
    `;
  }
}

export function hideStatus(element) {
  element.classList.add("hidden");
  element.innerHTML = "";
}

export function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-red-600" : "bg-gray-800";
  toast.className = `${bg} text-white text-xs px-4 py-2.5 rounded shadow-lg flex items-center gap-2 pointer-events-auto transition-opacity duration-300`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function displayFieldErrors(form, errors) {
  const errorElements = form.querySelectorAll("[data-error-for]");
  errorElements.forEach((el) => {
    const fieldName = el.getAttribute("data-error-for");
    if (errors[fieldName]) {
      el.textContent = errors[fieldName];
      el.classList.remove("hidden");
    } else {
      el.textContent = "";
      el.classList.add("hidden");
    }
  });
}

export function clearFieldErrors(form) {
  const errorElements = form.querySelectorAll("[data-error-for]");
  errorElements.forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
}
