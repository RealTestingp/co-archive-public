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
// Confirmed against UploadsController.cs (Dylan): field name "file" matches
// the IFormFile parameter name, endpoints are POST /api/uploads/
// profile-image/{personId} and POST /api/uploads/program-pdf/{productionId},
// response is { url }. The backend already persists the URL to the DB on
// success, so callers can just refetch rather than parse the response body.
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