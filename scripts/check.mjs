const baseUrl = process.env.CHECK_URL || "http://127.0.0.1:3000";

async function check(path, predicate, label) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}`);
  const data = await response.json();
  if (!predicate(data)) throw new Error(`${label} returned unexpected payload`);
  console.log(`OK ${label}`);
}

await check("/health", (data) => data.ok === true, "health");
await check(
  "/api/storefront",
  (data) => data.settings?.siteName && data.slides?.length > 0 && data.products?.length > 0,
  "storefront api"
);

const storefrontText = await (await fetch(`${baseUrl}/api/storefront`)).text();
if (/\?{4,}|�/.test(storefrontText)) {
  throw new Error("storefront api contains likely encoding corruption");
}
console.log("OK storefront encoding");
