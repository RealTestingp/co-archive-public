// BASE_URL is set at BUILD time via Vite's environment variable system.
// In Docker, this comes from a --build-arg passed to `docker build`, which
// gets baked into the compiled JS bundle. Not something that can be changed
// after the image is built.
//
// This value is the Gateway's real URL. The Frontend calls the Gateway
// directly from the browser, rather than going through a relative path
// proxied by nginx. --------- We originally used an nginx proxy for this,
// but it proved unreliable in Azure Container Apps: nginx resolves a hostname
// to an IP once at container startup and doesn't recheck DNS afterward.
// So, if the Gateway's address changed (new revision, scaling event),
// requests would start silently failing. Calling the Gateway's URL
// directly from the browser removes that unreliable middle hop.
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Shared fetch wrapper used by every API call in the app, eliminating the need to
// repeat the logic in every component that needs to talk to the backend.
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    // Spread options.headers last so a caller can override the defaults.
    headers: {
      "Content-Type": "application/json",
      // Spread options.headers AFTER the default above, so a caller can
      // still override Content-Type (or add extra headers) if a specific
      // request ever needs something other than plain JSON.
      ...options.headers,
    },
  });
}

// Small convenience wrapper around apiFetch for each HTTP verb, so
// components can write api.get("/api/persons") instead of repeating
// the method/headers/stringify boilerplate every time.
// post/put also handle JSON.stringify-ing the body here, so callers
// just pass a plain object.
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
