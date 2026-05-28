import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Store } from "../types";

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link href="/store" asChild>
      <Pressable style={styles.card}>
        <View>
          <Text style={styles.name}>{store.name}</Text>
          <Text style={styles.meta}>
            {store.city} • {store.distance}
          </Text>
        </View>
        <Text style={styles.description}>{store.description}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  meta: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  description: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
