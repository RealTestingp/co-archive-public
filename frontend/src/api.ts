export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
};

// Uploads a file as multipart/form-data. Deliberately bypasses apiFetch —
// apiFetch always sets Content-Type: application/json, which breaks a
// multipart request (the browser needs to set Content-Type itself so it
// can include the correct multipart boundary string). Do not add a
// Content-Type header to this call.
//
// NOTE (2026-07-14): `fieldName` and the response shape here are
// UNCONFIRMED. There is no UploadsController in the backend yet (checked
// services/core-api/COArchive.API/Controllers — only Appearances,
// Characters, Lookup, Persons, Productions, and ReportsQuery controllers
// exist). Update `fieldName` below, and how callers read the response, once
// the real /api/uploads/profile-image/{id} and /api/uploads/program-pdf/{id}
// endpoints exist and their contract is confirmed.
export async function uploadFile(
  path: string,
  file: File,
  fieldName: string = "file",
): Promise<Response> {
  const formData = new FormData();
  formData.append(fieldName, file);
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
}