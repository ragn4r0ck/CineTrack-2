// These functions check form values before they are sent to the API.
// Each one returns { isValid, errors } where `errors` is an object
// containing one message per invalid field.

export function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

export function validateContent(data) {
  const errors = {};
  const currentYear = new Date().getFullYear();

  if (!data.title || !data.title.trim()) {
    errors.title = "Le titre est obligatoire.";
  }

  if (!data.type || (data.type !== "movie" && data.type !== "series")) {
    errors.type = "Veuillez sélectionner un type valide.";
  }

  const year = Number(data.releaseYear);
  if (!data.releaseYear || isNaN(year) || year < 1900 || year > currentYear) {
    errors.releaseYear = `L'année doit être comprise entre 1900 et ${currentYear}.`;
  }

  if (!data.image || !isValidUrl(data.image.trim())) {
    errors.image = "Veuillez saisir une URL d'image valide (http:// ou https://).";
  }

  // A film needs a duration, while a series needs a number of seasons.
  if (data.type === "movie") {
    const duration = Number(data.duration);
    if (!data.duration || isNaN(duration) || duration <= 0) {
      errors.duration = "La durée doit être un nombre positif (en minutes).";
    }
  } else if (data.type === "series") {
    const seasons = Number(data.seasons);
    if (!data.seasons || isNaN(seasons) || seasons <= 0) {
      errors.seasons = "Le nombre de saisons doit être au moins 1.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateComment(data) {
  const errors = {};

  if (!data.author || !data.author.trim()) {
    errors.author = "Le nom ou pseudo est obligatoire.";
  }

  if (!data.text || !data.text.trim()) {
    errors.text = "Le message du commentaire est obligatoire.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
