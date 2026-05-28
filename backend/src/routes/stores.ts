import { Router } from "express";
import { reverseGeocodeAddress } from "../services/nominatimReverse.js";
import { fetchNearbySupermarkets } from "../services/overpass.js";
import { haversineKm } from "../utils/distance.js";

const router = Router();

const reverseAddressCache = new Map<string, string>();

router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radius = Number(req.query.radius || 500);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: "lat and lon are required numbers",
      });
    }

    const stores = await fetchNearbySupermarkets(lat, lon, radius);

    const withDistance = stores
      .map((store) => ({
        ...store,
        distance_km: haversineKm(lat, lon, store.lat, store.lon),
        source: "openstreetmap",
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    const normalized = await Promise.all(
      withDistance.map(async (store, index) => {
        let resolvedAddress = store.address;

        if (!resolvedAddress && index < 10) {
          const cacheKey = `${store.lat},${store.lon}`;

          if (reverseAddressCache.has(cacheKey)) {
            resolvedAddress = reverseAddressCache.get(cacheKey) ?? null;
            console.log(
              `[reverse-cache-hit] ${store.name} (${cacheKey}) -> ${resolvedAddress}`,
            );
          } else {
            try {
              const reverseResult = await reverseGeocodeAddress(
                store.lat,
                store.lon,
              );

              console.log(
                `[reverse-result] ${store.name} (${cacheKey}) -> ${reverseResult}`,
              );

              if (reverseResult) {
                resolvedAddress = reverseResult;
                reverseAddressCache.set(cacheKey, reverseResult);
              }
            } catch (reverseError) {
              console.error(
                `[reverse-error] ${store.name} (${cacheKey})`,
                reverseError,
              );
            }
          }
        }

        return {
          ...store,
          address: resolvedAddress,
        };
      }),
    );

    return res.json({
      count: normalized.length,
      stores: normalized,
    });
  } catch (error) {
    console.error("NEARBY STORES ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch nearby supermarkets",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
