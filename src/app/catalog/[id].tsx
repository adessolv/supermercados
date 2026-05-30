import { useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getCatalogProducts } from "@/lib/api";
import type {
  TiendeoCatalogPagesResponse,
  TiendeoCatalogProductsResponse,
  TiendeoProduct,
} from "@/types/catalog";

function formatPrice(price?: number | null, currency?: string | null) {
  if (price == null) return "Цена не указана";

  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "EUR",
    }).format(price);
  } catch {
    return `${price} ${currency || "EUR"}`;
  }
}

function buildPagesData(
  catalogId: string,
  catalogUrl: string,
  products: TiendeoProduct[],
): TiendeoCatalogPagesResponse {
  const grouped = new Map<number, number>();

  for (const product of products) {
    const page = Number(product.flyerPage);
    if (!Number.isFinite(page) || page < 1) continue;
    grouped.set(page, (grouped.get(page) ?? 0) + 1);
  }

  const pages = Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([page, productCount]) => ({ page, productCount }));

  return {
    catalogId,
    catalogUrl,
    pageCount: pages.length,
    totalProducts: products.length,
    pages,
  };
}

const ProductCard = memo(function ProductCard({
  item,
}: {
  item: TiendeoProduct;
}) {
  return (
    <View style={styles.productCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.imagePlaceholder]} />
      )}

      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.productPrice}>
          {formatPrice(item.price, item.currency)}
        </Text>

        {item.discount != null && (
          <Text style={styles.productDiscount}>Скидка: {item.discount}%</Text>
        )}

        <View style={styles.productMetaRow}>
          {item.flyerPage && (
            <Text style={styles.productMeta}>Стр. {item.flyerPage}</Text>
          )}
          {item.validUntil && (
            <Text style={styles.productMeta}>До: {item.validUntil}</Text>
          )}
        </View>
      </View>
    </View>
  );
});

export default function CatalogScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  const [pagesData, setPagesData] =
    useState<TiendeoCatalogPagesResponse | null>(null);
  const [productsData, setProductsData] =
    useState<TiendeoCatalogProductsResponse | null>(null);

  const [selectedPage, setSelectedPage] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      setSelectedPage(null);

      try {
        const products = await getCatalogProducts(String(id));
        if (cancelled) return;

        setProductsData(products);
        setPagesData(
          buildPagesData(
            products.catalogId,
            products.catalogUrl,
            products.products,
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load catalog",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const visibleProducts = useMemo(() => {
    const products = productsData?.products ?? [];
    if (!selectedPage) return products;

    return products.filter(
      (product) => Number(product.flyerPage) === selectedPage,
    );
  }, [productsData?.products, selectedPage]);

  const onSelectPage = useCallback((page: number | null) => {
    setSelectedPage(page);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: TiendeoProduct }) => <ProductCard item={item} />,
    [],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.helper}>Загружаю каталог…</Text>
      </View>
    );
  }

  if (error && !productsData) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Ошибка загрузки каталога</Text>
        <Text style={styles.helper}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {title || `Каталог ${id}`}
        </Text>

        <Text style={styles.subtitle}>
          Всего товаров: {productsData?.count ?? 0} · страниц с товарами:{" "}
          {pagesData?.pageCount ?? 0}
        </Text>
      </View>

      <View style={styles.pageSelectorWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageSelectorContent}
        >
          <Pressable
            onPress={() => onSelectPage(null)}
            style={[
              styles.pageChip,
              selectedPage == null && styles.pageChipActive,
            ]}
          >
            <Text
              style={[
                styles.pageChipText,
                selectedPage == null && styles.pageChipTextActive,
              ]}
            >
              Все
            </Text>
            <Text
              style={[
                styles.pageChipMeta,
                selectedPage == null && styles.pageChipTextActive,
              ]}
            >
              {productsData?.count ?? 0}
            </Text>
          </Pressable>

          {pagesData?.pages.map((pageItem) => {
            const isActive = pageItem.page === selectedPage;

            return (
              <Pressable
                key={pageItem.page}
                onPress={() => onSelectPage(pageItem.page)}
                style={[styles.pageChip, isActive && styles.pageChipActive]}
              >
                <Text
                  style={[
                    styles.pageChipText,
                    isActive && styles.pageChipTextActive,
                  ]}
                >
                  {pageItem.page}
                </Text>

                <Text
                  style={[
                    styles.pageChipMeta,
                    isActive && styles.pageChipTextActive,
                  ]}
                >
                  {pageItem.productCount}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.pageInfo}>
        <Text style={styles.pageInfoText}>
          {selectedPage ? `Страница ${selectedPage}` : "Все страницы"}
        </Text>
        <Text style={styles.pageInfoText}>
          Показано: {visibleProducts.length} из {productsData?.count ?? 0}
        </Text>
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={(item, index) =>
          `${item.name}-${item.flyerPage ?? "x"}-${index}`
        }
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.helper}>В этом каталоге товары не найдены.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  pageSelectorWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  pageSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  pageChip: {
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },
  pageChipActive: {
    backgroundColor: "#00a876",
    borderColor: "#00a876",
  },
  pageChipText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222",
  },
  pageChipMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#777",
  },
  pageChipTextActive: {
    color: "#fff",
  },
  pageInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageInfoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    overflow: "hidden",
    flexDirection: "row",
  },
  productImage: {
    width: 116,
    minHeight: 136,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  productBody: {
    flex: 1,
    padding: 14,
  },
  productName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  productPrice: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "900",
    color: "#00a876",
  },
  productDiscount: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#d64545",
  },
  productMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  productMeta: {
    fontSize: 12,
    color: "#777",
  },
  error: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  helper: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
});
