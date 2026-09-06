const API_BASE: string | undefined = import.meta.env?.VITE_API_URL;

export function apiUrl(path: string): string | null {
  return API_BASE === undefined ? null : `${API_BASE}${path}`;
}
