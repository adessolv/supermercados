import { Router } from "express";
import { fetchCityByPostalCode } from "../services/geoapi.js";
import { fetchPostalCodeCoordinates } from "../services/nominatim.js";

const router = Router();

router.get("/postal/:postalCode", async (req, res) => {
  try {
    const { postalCode } = req.params;

    if (!/^\d{5}$/.test(postalCode)) {
      return res.status(400).json({ error: "Postal code must be 5 digits" });
    }

    const result = await fetchCityByPostalCode(postalCode);
    return res.json(result);
  } catch (error) {
    console.error("POSTAL CITY ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch city from GeoAPI",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/postal/:postalCode/coords", async (req, res) => {
  try {
    const { postalCode } = req.params;

    if (!/^\d{5}$/.test(postalCode)) {
      return res.status(400).json({ error: "Postal code must be 5 digits" });
    }

    const result = await fetchPostalCodeCoordinates(postalCode);

    if (!result) {
      return res.status(404).json({
        error: "Postal code coordinates not found in Spain",
      });
    }

    return res.json(result);
  } catch (error) {
    console.error("POSTAL COORDS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch postal code coordinates",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
