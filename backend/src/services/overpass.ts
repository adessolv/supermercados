const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export type RawStore = {
  id: string;
  name: string;
  brand?: string | null;
  address?: string | null;
  lat: number;
  lon: number;
};

export async function fetchNearbySupermarkets(
  lat: number,
  lon: number,
  radius = 1000,
): Promise<RawStore[]> {
  const query = `
[out:json][timeout:15];
(
  nwr["shop"="supermarket"](around:${radius},${lat},${lon});
);
out center tags;
`.trim();

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain; charset=utf-8",
      "User-Agent": "supermercados-backend/1.0 (local dev contact: local-app)",
      Referer: "http://localhost:8000/",
    },
    body: query,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Overpass error: ${response.status}${text ? ` - ${text.slice(0, 300)}` : ""}`,
    );
  }

  const json = await response.json();
  const elements = json?.elements ?? [];

  return elements
    .map((item: any) => {
      const tags = item.tags ?? {};
      const itemLat = item.lat ?? item.center?.lat;
      const itemLon = item.lon ?? item.center?.lon;

      if (itemLat == null || itemLon == null) return null;

      const addressParts = [
        tags["addr:street"],
        tags["addr:housenumber"],
        tags["addr:postcode"],
        tags["addr:city"],
      ].filter(Boolean);

      return {
        id: `${item.type}:${item.id}`,
        name: tags.name || tags.brand || "Supermarket",
        brand: tags.brand || null,
        address: addressParts.length ? addressParts.join(", ") : null,
        lat: itemLat,
        lon: itemLon,
      };
    })
    .filter(Boolean) as RawStore[];
}
