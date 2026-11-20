// This file contains every call to the MockAPI service.
// Keeping the URL here means there is only one place to change it.

const API_URL = "https://6afaf087730c1d152f32cb93.mockapi.io/api/";

// A small helper that sends a request and returns the JSON response.
// `path` is added to the end of API_URL, for example "/contents".
async function apiRequest(path, options = {}) {
  const url = API_URL.replace(/\/+$/, "") + path;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // fetch() does not throw for HTTP errors, so we check response.ok ourselves.
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} : ${response.statusText}`);
  }

  return response.json();
}

// ---------- Films and series (contents) ----------

export function getContents() {
  return apiRequest("/contents");
}

export function getContent(id) {
  return apiRequest(`/contents/${id}`);
}

export function createContent(content) {
  return apiRequest("/contents", {
    method: "POST",
    body: JSON.stringify(content),
  });
}

export function updateContent(id, content) {
  return apiRequest(`/contents/${id}`, {
    method: "PUT",
    body: JSON.stringify(content),
  });
}

export function deleteContent(id) {
  return apiRequest(`/contents/${id}`, {
    method: "DELETE",
  });
}

// ---------- Comments ----------

export function getComments() {
  return apiRequest("/comments");
}

export function createComment(comment) {
  return apiRequest("/comments", {
    method: "POST",
    body: JSON.stringify(comment),
  });
}
