import { Router } from "express";
import {
  fetchTiendeoBrandCatalogs,
  fetchTiendeoBrandProducts,
  fetchTiendeoCatalogProducts,
} from "../services/tiendeo.js";

const router = Router();

function parsePage(value: unknown): number | null {
  if (typeof value !== "string") return null;

  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;

  return parsed;
}

router.get("/tiendeo/brand/:slug", async (req, res) => {
  try {
    const data = await fetchTiendeoBrandCatalogs(req.params.slug);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Tiendeo brand catalogs",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/tiendeo/brand/:slug/products", async (req, res) => {
  try {
    const data = await fetchTiendeoBrandProducts(req.params.slug);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Tiendeo brand products",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/tiendeo/catalog/:catalogId", async (req, res) => {
  try {
    const data = await fetchTiendeoCatalogProducts(req.params.catalogId);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Tiendeo catalog products",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/tiendeo/catalog/:catalogId/pages", async (req, res) => {
  try {
    const data = await fetchTiendeoCatalogProducts(req.params.catalogId);

    const grouped = new Map<number, number>();

    for (const product of data.products) {
      const page = Number(product.flyerPage);
      if (!Number.isFinite(page) || page < 1) continue;

      grouped.set(page, (grouped.get(page) ?? 0) + 1);
    }

    const pages = Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([page, productCount]) => ({
        page,
        productCount,
      }));

    res.json({
      catalogId: data.catalogId,
      catalogUrl: data.catalogUrl,
      pageCount: pages.length,
      totalProducts: data.products.length,
      pages,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Tiendeo catalog pages",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/tiendeo/catalog/:catalogId/products", async (req, res) => {
  try {
    const page = parsePage(req.query.page);

    if (!page) {
      return res.status(400).json({
        error: "Invalid page query parameter",
        message: "Use /products?page=NUMBER where NUMBER >= 1",
      });
    }

    const data = await fetchTiendeoCatalogProducts(req.params.catalogId);

    const products = data.products.filter(
      (product) => Number(product.flyerPage) === page,
    );

    return res.json({
      catalogId: data.catalogId,
      catalogUrl: data.catalogUrl,
      page,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch Tiendeo catalog page products",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
