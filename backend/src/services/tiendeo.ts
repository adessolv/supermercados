type TiendeoCatalog = {
  id: string;
  title: string;
  url: string;
};

type TiendeoProduct = {
  name: string;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
  validUntil?: string | null;
  availability?: string | null;
  sellerName?: string | null;
  sellerUrl?: string | null;
  flyerPage?: string | null;
  discount?: number | null;
};

const TIENDEO_BASE_URL = "https://www.tiendeo.com";

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${TIENDEO_BASE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

async function fetchHtml(url: string): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "supermercados-backend/1.0",
      Referer: "http://localhost:8000/",
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`Tiendeo error: ${response.status}`);
  }

  return response.text();
}

function decodeHtml(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractCatalogLinks(html: string): TiendeoCatalog[] {
  const catalogs = new Map<string, TiendeoCatalog>();
  const anchorRegex = /href="(\/Catalogos\/(\d+))"[^>]*>(.*?)<\/a>/gims;

  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const relativeUrl = match[1];
    const id = match[2];
    const rawInner = match[3] || "";

    const title =
      decodeHtml(rawInner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")) ||
      `Catálogo ${id}`;

    if (!catalogs.has(id)) {
      catalogs.set(id, {
        id,
        title,
        url: absoluteUrl(relativeUrl),
      });
    }
  }

  return Array.from(catalogs.values());
}

function extractCatalogLinksFromAnySource(html: string): TiendeoCatalog[] {
  const fromAnchors = extractCatalogLinks(html);
  if (fromAnchors.length > 0) return fromAnchors;

  const catalogs = new Map<string, TiendeoCatalog>();
  const regex = /\/Catalogos\/(\d+)/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const id = match[1];

    if (!catalogs.has(id)) {
      catalogs.set(id, {
        id,
        title: `Catálogo ${id}`,
        url: `${TIENDEO_BASE_URL}/Catalogos/${id}`,
      });
    }
  }

  return Array.from(catalogs.values());
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gim;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      blocks.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  return blocks;
}

function flattenJsonLd(input: unknown): any[] {
  if (Array.isArray(input)) {
    return input.flatMap(flattenJsonLd);
  }

  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;

    if (Array.isArray(obj["@graph"])) {
      return flattenJsonLd(obj["@graph"]);
    }

    return [obj];
  }

  return [];
}

function extractNextData(html: string): any | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i,
  );

  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function parsePrice(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeJsonLdProduct(item: any): TiendeoProduct | null {
  if (!item) return null;

  const offers = item.offers ?? item.offer ?? {};
  const seller = offers.seller ?? item.seller ?? {};
  const rawPrice = offers.price ?? item.price ?? null;

  const name =
    item.name || item.title || item.productName || item.description || null;

  if (!name || typeof name !== "string") return null;

  return {
    name: name.trim(),
    image: item.image || item.imageUrl || item.img || null,
    price: parsePrice(rawPrice),
    currency:
      offers.priceCurrency || item.currency || item.currencyCode || "EUR",
    validUntil: offers.priceValidUntil || item.validUntil || null,
    availability: offers.availability || item.availability || null,
    sellerName: seller.name || item.sellerName || item.brand || null,
    sellerUrl: seller.url || item.sellerUrl || item.brandUrl || null,
    flyerPage: null,
    discount: null,
  };
}

function extractProductsFromJsonLd(html: string): TiendeoProduct[] {
  const blocks = extractJsonLdBlocks(html);

  const products = blocks
    .flatMap(flattenJsonLd)
    .filter((item) => item?.["@type"] === "Product")
    .map(normalizeJsonLdProduct)
    .filter(Boolean) as TiendeoProduct[];

  return dedupeProducts(products);
}

function collectCropItemsDeep(
  input: unknown,
  results: any[] = [],
  seen = new WeakSet<object>(),
): any[] {
  if (!input || typeof input !== "object") return results;
  if (seen.has(input as object)) return results;
  seen.add(input as object);

  if (Array.isArray(input)) {
    for (const item of input) {
      collectCropItemsDeep(item, results, seen);
    }
    return results;
  }

  const obj = input as Record<string, unknown>;

  const isCropLike =
    obj.type === "crop" &&
    typeof obj.title === "string" &&
    (!!obj.flyer_id || (obj.flyer && typeof obj.flyer === "object")) &&
    (typeof obj.image === "string" ||
      typeof (obj.settings as any)?.image_url === "string");

  if (isCropLike) {
    results.push(obj);
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      collectCropItemsDeep(value, results, seen);
    }
  }

  return results;
}

function normalizeCropItem(item: any): TiendeoProduct | null {
  if (!item || item.type !== "crop") return null;

  const title = item.title;
  if (!title || typeof title !== "string") return null;

  const settings = item.settings ?? {};
  const price =
    parsePrice(settings.price_extended?.digits) ??
    parsePrice(settings.price) ??
    parsePrice(settings.starting_price?.digits);

  const currency =
    settings.price_extended?.currency_code ||
    settings.starting_price?.currency_code ||
    "EUR";

  const image = item.image || settings.image_url || null;

  const sellerName = item.retailerName || settings.brand || null;

  const validUntil = item.flyer?.end_date || null;

  const flyerPage = settings.flyer_page || null;
  const discount =
    (typeof item.discount === "number" ? item.discount : null) ??
    (settings.sale
      ? -Math.abs(parseInt(String(settings.sale).replace(/[^0-9-]/g, "")) || 0)
      : null);

  return {
    name: title.trim(),
    image,
    price,
    currency,
    validUntil,
    availability: null,
    sellerName,
    sellerUrl: null,
    flyerPage,
    discount: typeof discount === "number" ? discount : null,
  };
}

function dedupeProducts(products: TiendeoProduct[]): TiendeoProduct[] {
  const seen = new Set<string>();
  const result: TiendeoProduct[] = [];

  for (const product of products) {
    const key = [
      (product.name || "").toLowerCase().trim(),
      product.price ?? "",
      (product.image || "").trim(),
    ].join("|");

    if (!product.name || seen.has(key)) continue;
    seen.add(key);
    result.push(product);
  }

  return result;
}

function extractProductsFromNextData(html: string): TiendeoProduct[] {
  const nextData = extractNextData(html);
  if (!nextData) return [];

  const cropItems = collectCropItemsDeep(nextData);

  const products = cropItems
    .map(normalizeCropItem)
    .filter(Boolean) as TiendeoProduct[];

  return dedupeProducts(products);
}

function slugToBrandName(slug: string): string {
  return slug.replace(/[-_]+/g, " ").trim().toLowerCase();
}

function productBelongsToBrand(product: TiendeoProduct, slug: string): boolean {
  const normalizedSlug = slug.toLowerCase();
  const normalizedBrand = slugToBrandName(slug);

  const sellerName = (product.sellerName || "").trim().toLowerCase();
  const sellerUrl = (product.sellerUrl || "").trim().toLowerCase();

  if (sellerUrl.includes(`/folletos-catalogos/${normalizedSlug}`)) {
    return true;
  }

  if (sellerUrl.includes(`/${normalizedSlug}`)) {
    return true;
  }

  if (sellerName.includes(normalizedBrand)) {
    return true;
  }

  if (
    normalizedBrand.includes(" ") &&
    sellerName.includes(normalizedBrand.replace(/\s+/g, ""))
  ) {
    return true;
  }

  return false;
}

async function catalogBelongsToBrand(
  catalogId: string,
  slug: string,
): Promise<boolean> {
  try {
    const data = await fetchTiendeoCatalogProducts(catalogId);

    if (data.products.length === 0) {
      return false;
    }

    return data.products.some((product) =>
      productBelongsToBrand(product, slug),
    );
  } catch {
    return false;
  }
}

function chooseBestProducts(
  nextDataProducts: TiendeoProduct[],
  jsonLdProducts: TiendeoProduct[],
): TiendeoProduct[] {
  const nextWithPrice = nextDataProducts.filter((p) => p.price != null).length;
  const jsonLdWithPrice = jsonLdProducts.filter((p) => p.price != null).length;

  if (nextWithPrice > 0 && nextWithPrice >= jsonLdWithPrice) {
    return nextDataProducts;
  }

  if (jsonLdProducts.length > 0) {
    return jsonLdProducts;
  }

  return nextDataProducts;
}

export async function fetchTiendeoBrandCatalogs(slug: string) {
  const url = `${TIENDEO_BASE_URL}/Folletos-Catalogos/${encodeURIComponent(slug)}`;
  const html = await fetchHtml(url);

  if (!html) {
    return {
      brandSlug: slug,
      brandUrl: url,
      count: 0,
      catalogs: [],
    };
  }

  const candidates = extractCatalogLinksFromAnySource(html);

  if (candidates.length === 0) {
    return {
      brandSlug: slug,
      brandUrl: url,
      count: 0,
      catalogs: [],
    };
  }

  const checks = await Promise.all(
    candidates.map(async (catalog) => {
      const belongs = await catalogBelongsToBrand(catalog.id, slug);
      return belongs ? catalog : null;
    }),
  );

  const filtered = checks.filter(Boolean) as TiendeoCatalog[];
  const catalogs = filtered.length > 0 ? filtered : candidates.slice(0, 3);

  return {
    brandSlug: slug,
    brandUrl: url,
    count: catalogs.length,
    catalogs,
  };
}

export async function fetchTiendeoCatalogProducts(catalogId: string) {
  const url = `${TIENDEO_BASE_URL}/Catalogos/${encodeURIComponent(catalogId)}`;
  const html = await fetchHtml(url);

  if (!html) {
    return {
      catalogId,
      catalogUrl: url,
      count: 0,
      products: [],
    };
  }

  const nextDataProducts = extractProductsFromNextData(html);
  const jsonLdProducts = extractProductsFromJsonLd(html);
  const products = chooseBestProducts(nextDataProducts, jsonLdProducts);

  return {
    catalogId,
    catalogUrl: url,
    count: products.length,
    products,
  };
}

export async function fetchTiendeoBrandProducts(slug: string) {
  const brandData = await fetchTiendeoBrandCatalogs(slug);

  const catalogsWithProducts = await Promise.all(
    brandData.catalogs.map(async (catalog) => {
      try {
        const data = await fetchTiendeoCatalogProducts(catalog.id);

        const filteredProducts = data.products.filter((product) =>
          productBelongsToBrand(product, slug),
        );

        const products =
          filteredProducts.length > 0 ? filteredProducts : data.products;

        return {
          ...catalog,
          productCount: products.length,
          products,
        };
      } catch (error) {
        return {
          ...catalog,
          productCount: 0,
          products: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  return {
    brandSlug: slug,
    brandUrl: brandData.brandUrl,
    catalogCount: catalogsWithProducts.length,
    catalogs: catalogsWithProducts,
  };
}
