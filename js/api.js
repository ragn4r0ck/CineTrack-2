const DEFAULT_URL = "https://6afaf087730c1d152f32cb94.mockapi.io/api/";
const BASE_URL = DEFAULT_URL;

export async function request(path, options = {}) {
  const url = BASE_URL.replace(/\/+$/, "") + path;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Erreur ${res.status} : ${res.statusText}`);
  }

  return res.json();
}

export const getContents = () => request("/contents");

export const getContent = (id) => request(`/contents/${id}`);

export const createContent = (data) =>
  request("/contents", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateContent = (id, data) =>
  request(`/contents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteContent = (id) =>
  request(`/contents/${id}`, {
    method: "DELETE",
  });

export const getComments = () => request("/comments");

export const createComment = (data) =>
  request("/comments", {
    method: "POST",
    body: JSON.stringify(data),
  });
