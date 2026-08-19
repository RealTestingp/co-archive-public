// Set at build time via Vite; baked into the JS bundle, can't change post-build.
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Talks directly to the Gateway (not via nginx proxy) to avoid stale DNS on revision changes.
// Shared fetch wrapper so components don't repeat headers/base URL logic.
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Spread after defaults so callers can override.
      ...options.headers,
    },
  });
}

// Convenience verb wrappers — post/put JSON.stringify the body for you.
export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
};

// Bypasses apiFetch — browser needs to set its own multipart Content-Type boundary.
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
