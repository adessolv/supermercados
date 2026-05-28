export async function fetchPostalCodeCoordinates(postalCode: string) {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      postalcode: postalCode,
      country: "Spain",
      countrycodes: "es",
      format: "jsonv2",
      limit: "1",
      addressdetails: "1",
    }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "supermercados-backend/1.0 (local dev contact: local-app)",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Nominatim error: ${response.status}${text ? ` - ${text.slice(0, 300)}` : ""}`,
    );
  }

  const json = await response.json();
  const first = json?.[0];

  if (!first) {
    return null;
  }

  return {
    postalCode,
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name ?? null,
  };
}
