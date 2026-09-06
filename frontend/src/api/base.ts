const API_BASE: string | undefined = import.meta.env?.VITE_API_URL;

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  if (API_BASE === undefined) throw new Error('API is not configured')

  const response = await fetch(`${API_BASE}${path}`, options)
  if (!response.ok) throw new Error('Request failed')
  return response
}
