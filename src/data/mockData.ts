import { Deal, Store } from "../types";

export const categories = [
  { id: "1", label: "Groceries", icon: "🛒" },
  { id: "2", label: "Beauty", icon: "✨" },
  { id: "3", label: "Home", icon: "🏠" },
  { id: "4", label: "Electronics", icon: "🔌" },
  { id: "5", label: "Baby", icon: "🧸" },
];

export const stores: Store[] = [
  {
    id: "mercadona",
    name: "Mercadona",
    city: "Gijón",
    distance: "0.8 km",
    description: "Fresh food, household basics and weekly discounts near you.",
  },
  {
    id: "carrefour",
    name: "Carrefour",
    city: "Gijón",
    distance: "1.6 km",
    description:
      "Brochures, flash deals and branded products for family shopping.",
  },
];

export const weeklyDeals: Deal[] = [
  {
    id: "d1",
    title: "Olive oil 1L",
    storeId: "mercadona",
    storeName: "Mercadona",
    category: "Groceries",
    price: "€6.45",
    discount: "-18%",
    validUntil: "29 May",
  },
  {
    id: "d2",
    title: "Family shampoo pack",
    storeId: "carrefour",
    storeName: "Carrefour",
    category: "Beauty",
    price: "€4.99",
    discount: "2x1",
    validUntil: "31 May",
  },
  {
    id: "d3",
    title: "Laundry capsules 40 pcs",
    storeId: "mercadona",
    storeName: "Mercadona",
    category: "Home",
    price: "€7.80",
    discount: "-12%",
    validUntil: "27 May",
  },
];
