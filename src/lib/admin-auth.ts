import { cookies } from "next/headers";

// A single shared internal login for the one person (the app owner) who
// uses /admin — not a per-account credential system, so a fixed
// username/password is an intentional simplification, not an oversight.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

const COOKIE_NAME = "admin_session";
const COOKIE_VALUE = "ok";

export function checkAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
