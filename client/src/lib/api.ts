import { getFirebaseAuth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getFirebaseAuth().currentUser?.getIdToken();

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, { ...init, headers });
}
