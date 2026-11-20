const FAVORITES_KEY = "cinetrack_favorites";
const PSEUDO_KEY = "cinetrack_pseudo";

export function getFavorites() {
  try {
    const rawData = localStorage.getItem(FAVORITES_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error(error);
  }
}

export function addFavorite(item) {
  const favorites = getFavorites();
  const exists = favorites.some((fav) => String(fav.id) === String(item.id));
  if (!exists) {
    favorites.push(item);
    saveFavorites(favorites);
  }
  return favorites;
}

export function removeFavorite(id) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((fav) => String(fav.id) !== String(id));
  saveFavorites(updatedFavorites);
  return updatedFavorites;
}

export function isFavorite(id) {
  const favorites = getFavorites();
  return favorites.some((fav) => String(fav.id) === String(id));
}

export function getPseudo() {
  return localStorage.getItem(PSEUDO_KEY) || "";
}

export function savePseudo(pseudo) {
  localStorage.setItem(PSEUDO_KEY, pseudo.trim());
}
