export type TiendeoProduct = {
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

export type TiendeoCatalog = {
  id: string;
  title: string;
  url: string;
  productCount?: number;
  products?: TiendeoProduct[];
};

export type TiendeoBrandCatalogsResponse = {
  brandSlug: string;
  brandUrl: string;
  count: number;
  catalogs: TiendeoCatalog[];
};

export type TiendeoCatalogProductsResponse = {
  catalogId: string;
  catalogUrl: string;
  count: number;
  products: TiendeoProduct[];
};

export type TiendeoCatalogPagesResponse = {
  catalogId: string;
  catalogUrl: string;
  pageCount: number;
  totalProducts: number;
  pages: {
    page: number;
    productCount: number;
  }[];
};
