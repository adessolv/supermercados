export type Deal = {
  id: string;
  title: string;
  storeId: string;
  storeName: string;
  category: string;
  price: string;
  discount: string;
  validUntil: string;
};

export type Store = {
  id: string;
  name: string;
  city: string;
  distance: string;
  description: string;
};
