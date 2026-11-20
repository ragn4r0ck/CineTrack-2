// This file groups everything we save in the browser's localStorage.
// localStorage only stores text, so objects are converted with JSON.

const FAVORITES_KEY = "cinetrack_favorites";
const PSEUDO_KEY = "cinetrack_pseudo";

// ---------- Favorites ----------

export function getFavorites() {
  try {
    const savedValue = localStorage.getItem(FAVORITES_KEY);
    return savedValue ? JSON.parse(savedValue) : [];
  } catch (error) {
    console.error("Impossible de lire les favoris :", error);
    return [];
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Impossible d'enregistrer les favoris :", error);
  }
}

export function addFavorite(item) {
  const favorites = getFavorites();
  const alreadySaved = favorites.some(
    (favorite) => String(favorite.id) === String(item.id)
  );

  if (!alreadySaved) {
    favorites.push(item);
    saveFavorites(favorites);
  }

  return favorites;
}

export function removeFavorite(id) {
  const favorites = getFavorites();
  const remainingFavorites = favorites.filter(
    (favorite) => String(favorite.id) !== String(id)
  );

  saveFavorites(remainingFavorites);
  return remainingFavorites;
}

export function isFavorite(id) {
  const favorites = getFavorites();
  return favorites.some((favorite) => String(favorite.id) === String(id));
}

// ---------- User nickname ----------

export function getPseudo() {
  return localStorage.getItem(PSEUDO_KEY) || "";
}

export function savePseudo(pseudo) {
  localStorage.setItem(PSEUDO_KEY, pseudo.trim());
}
