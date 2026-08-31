import client from "./client";

export async function register({ name, email, password }) {
  const { data } = await client.post("/auth/register", { name, email, password });
  return data; // { status: "verification_required", email, expiresInMinutes }
}

export async function verifyEmail({ email, code }) {
  const { data } = await client.post("/auth/verify-email", { email, code });
  return data; // { user, token }
}

export async function resendVerification(email) {
  const { data } = await client.post("/auth/resend-verification", { email });
  return data;
}

export async function login({ email, password }) {
  const { data } = await client.post("/auth/login", { email, password });
  return data;
}

export async function getCurrentUser() {
  const { data } = await client.get("/auth/me");
  return data;
}

export async function updateNotificationPreferences(patch) {
  const { data } = await client.patch("/auth/preferences", patch);
  return data.user;
}
