import { Platform } from "react-native";

import type {
    TiendeoBrandCatalogsResponse,
    TiendeoCatalogPagesResponse,
    TiendeoCatalogProductsResponse,
} from "@/types/catalog";

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://192.168.0.106:8000"
    : "http://127.0.0.1:8000";

async function handleJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json();
}

export async function getStoreCatalogs(slug: string) {
  return handleJson<TiendeoBrandCatalogsResponse>(
    `${API_BASE_URL}/catalogs/tiendeo/brand/${encodeURIComponent(slug)}`,
  );
}

export async function getCatalogProducts(id: string) {
  return handleJson<TiendeoCatalogProductsResponse>(
    `${API_BASE_URL}/catalogs/tiendeo/catalog/${encodeURIComponent(id)}`,
  );
}

export async function getCatalogPages(id: string) {
  return handleJson<TiendeoCatalogPagesResponse>(
    `${API_BASE_URL}/catalogs/tiendeo/catalog/${encodeURIComponent(id)}/pages`,
  );
}

export async function getCatalogProductsByPage(id: string, page: number) {
  return handleJson<TiendeoCatalogProductsResponse>(
    `${API_BASE_URL}/catalogs/tiendeo/catalog/${encodeURIComponent(id)}/products?page=${page}`,
  );
}
