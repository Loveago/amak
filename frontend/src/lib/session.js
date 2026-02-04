import { cookies } from "next/headers";

export function getSessionUser() {
  const cookieStore = cookies();
  const raw = cookieStore.get("user")?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse session user", error);
    return null;
  }
}
