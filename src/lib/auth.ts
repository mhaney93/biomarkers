export const AUTH_COOKIE = "biomarkers_auth";

export async function getAuthToken(password: string) {
  const data = new TextEncoder().encode(`${password}:biomarkers-auth-salt`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getExpectedToken() {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  return getAuthToken(password);
}
