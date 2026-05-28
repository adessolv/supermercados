import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getStoreCatalogs } from "@/lib/api";
import type {
  TiendeoBrandCatalogsResponse,
  TiendeoCatalog,
} from "@/types/catalog";

export default function StoreScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [data, setData] = useState<TiendeoBrandCatalogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    getStoreCatalogs(String(slug))
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load catalogs"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.helper}>Загружаю каталоги…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Ошибка загрузки каталогов</Text>
        <Text style={styles.helper}>{error}</Text>
      </View>
    );
  }

  const openCatalog = (item: TiendeoCatalog) => {
    const title = encodeURIComponent(item.title || `Каталог ${item.id}`);
    router.push(`/catalog/${item.id}?title=${title}` as any);
  };

  const renderItem = ({ item }: { item: TiendeoCatalog }) => {
    const previewImage = item.products?.[0]?.image ?? null;

    return (
      <Pressable style={styles.card} onPress={() => openCatalog(item)}>
        <View style={styles.coverWrap}>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.coverPlaceholderText}>Каталог</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || `Каталог ${item.id}`}
          </Text>

          <Text style={styles.cardMeta}>ID: {item.id}</Text>

          <Text style={styles.openText}>Открыть каталог</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Каталоги магазина: {data.brandSlug}</Text>
      <Text style={styles.subtitle}>Найдено: {data.count}</Text>

      <FlatList
        data={data.catalogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingTop: 18,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  coverWrap: {
    backgroundColor: "#f1f1f1",
  },
  cover: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderText: {
    fontSize: 16,
    color: "#777",
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  openText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a7",
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
