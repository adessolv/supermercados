const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

type ReverseAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  residential?: string;
  house_number?: string;
  hamlet?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

type ReverseResult = {
  display_name?: string;
  name?: string;
  address?: ReverseAddress;
};

function compactAddress(address?: ReverseAddress): string | null {
  if (!address) return null;

  const street =
    address.road ||
    address.residential ||
    address.pedestrian ||
    address.footway ||
    address.path;

  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.city_district ||
    address.suburb ||
    address.quarter ||
    address.neighbourhood ||
    address.hamlet;

  const strictParts = [
    street,
    address.house_number,
    address.postcode,
    locality,
  ].filter(Boolean);

  if (strictParts.length > 0) {
    return strictParts.join(", ");
  }

  const softParts = [
    street,
    address.suburb,
    address.city_district,
    address.city || address.town || address.village,
    address.postcode,
  ].filter(Boolean);

  if (softParts.length > 0) {
    return softParts.join(", ");
  }

  return null;
}

export async function reverseGeocodeAddress(
  lat: number,
  lon: number,
): Promise<string | null> {
  const url =
    `${NOMINATIM_REVERSE_URL}?` +
    new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      zoom: "19",
      addressdetails: "1",
      "accept-language": "es",
    }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "supermercados-backend/1.0 (local dev contact: local-app)",
      Referer: "http://localhost:8000/",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Nominatim reverse error: ${response.status}${
        text ? ` - ${text.slice(0, 300)}` : ""
      }`,
    );
  }

  const json = (await response.json()) as ReverseResult;

  const shortAddress = compactAddress(json.address);
  if (shortAddress) {
    return shortAddress;
  }

  if (json.display_name) {
    return json.display_name;
  }

  if (json.name) {
    return json.name;
  }

  return null;
}
