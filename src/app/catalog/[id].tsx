import { useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
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

import { getCatalogPages, getCatalogProductsByPage } from "@/lib/api";
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

        {item.validUntil && (
          <Text style={styles.productMeta}>До: {item.validUntil}</Text>
        )}
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

  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPageProducts = useCallback(
    async (catalogId: string, page: number) => {
      setLoadingProducts(true);

      try {
        const result = await getCatalogProductsByPage(catalogId, page);
        setProductsData(result);
        setSelectedPage(page);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load page products",
        );
      } finally {
        setLoadingProducts(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadInitial() {
      setLoadingPages(true);
      setError(null);

      try {
        const pages = await getCatalogPages(String(id));
        if (cancelled) return;

        setPagesData(pages);

        const firstPage = pages.pages[0]?.page ?? null;
        if (firstPage) {
          await loadPageProducts(String(id), firstPage);
        } else {
          setProductsData({
            catalogId: String(id),
            catalogUrl: "",
            count: 0,
            products: [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load catalog",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPages(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [id, loadPageProducts]);

  const onSelectPage = useCallback(
    (page: number) => {
      if (!id || page === selectedPage) return;
      loadPageProducts(String(id), page);
    },
    [id, selectedPage, loadPageProducts],
  );

  const renderProduct = useCallback(
    ({ item }: { item: TiendeoProduct }) => <ProductCard item={item} />,
    [],
  );

  if (loadingPages) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.helper}>Загружаю каталог…</Text>
      </View>
    );
  }

  if (error && !pagesData) {
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
          Страниц с товарами: {pagesData?.pageCount ?? 0}
        </Text>
      </View>

      <View style={styles.pageSelectorWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageSelectorContent}
        >
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
        <Text style={styles.pageInfoText}>Страница {selectedPage ?? "-"}</Text>
        <Text style={styles.pageInfoText}>
          Товаров: {productsData?.count ?? 0}
        </Text>
      </View>

      {loadingProducts ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.helper}>Загружаю товары страницы…</Text>
        </View>
      ) : (
        <FlatList
          data={productsData?.products ?? []}
          keyExtractor={(item, index) =>
            `${item.name}-${item.flyerPage ?? "x"}-${index}`
          }
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.helper}>
                На этой странице товары не найдены.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  pageSelectorWrap: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },
  pageSelectorContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  pageChip: {
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  pageChipActive: {
    backgroundColor: "#0a7",
  },
  pageChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  pageChipMeta: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    minHeight: 92,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#efefef",
    marginRight: 10,
  },
  imagePlaceholder: {
    backgroundColor: "#efefef",
  },
  productBody: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a7",
    marginBottom: 3,
  },
  productDiscount: {
    fontSize: 12,
    color: "#d14",
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 11,
    color: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  error: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  helper: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
  },
});
