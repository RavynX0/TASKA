import client from "./client";

export async function getVapidPublicKey() {
  const { data } = await client.get("/push/vapid-public-key");
  return data.publicKey;
}

export async function subscribe(subscriptionJSON) {
  await client.post("/push/subscribe", subscriptionJSON);
}

export async function unsubscribe(endpoint) {
  await client.delete("/push/subscribe", { data: { endpoint } });
}
