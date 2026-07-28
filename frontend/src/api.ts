/* api.ts
   Every call to the backend goes through here.

   - BASE_URL comes from VITE_API_BASE_URL, which the Dockerfile passes in as a
     build argument. It is compiled into the bundle, not read at runtime, so
     changing the backend address means rebuilding the image.
   - Falls back to localhost:5000 so the app runs against a local backend in dev.
   - Having one wrapper means the base URL and the default headers live in a
     single place instead of being repeated in every page.
*/
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    // Spread options.headers last so a caller can override the defaults.
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/* Thin helpers so pages write api.get("/api/persons") instead of building a
   fetch config every time. Note these return the raw Response, so the caller
   still has to check res.ok and call res.json() itself. */
export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
};

/* Uploads a file as multipart/form-data. Deliberately does not use apiFetch.

   apiFetch always sets Content-Type: application/json. For a multipart request
   that is wrong twice over. It mislabels the body, and it overwrites the header
   the browser would have written itself, which is the one carrying the boundary
   string. The boundary is what tells the server where each part of the body
   starts and ends, so without it the upload arrives unreadable.

   The fix is to set no Content-Type at all and let the browser generate it.
   Do not add a Content-Type header to this call. */
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