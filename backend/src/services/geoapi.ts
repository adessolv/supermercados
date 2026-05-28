export async function fetchCityByPostalCode(postalCode: string) {
  const key = process.env.GEOAPI_KEY;
  const version = process.env.GEOAPI_VERSION || "2025.07";

  if (!key) {
    throw new Error("GEOAPI_KEY is missing in .env");
  }

  const url = `https://apiv1.geoapi.es/vias?CPOS=${postalCode}&type=JSON&version=${version}&key=${key}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GeoAPI error: ${response.status}`);
  }

  const json = await response.json();
  const firstItem = json?.data?.[0];

  return {
    postalCode,
    city: firstItem?.DMUN50 ?? null,
    rawCount: json?.size ?? 0,
  };
}
