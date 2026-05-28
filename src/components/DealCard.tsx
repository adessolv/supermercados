import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Deal } from "../types";

export function DealCard({ deal }: { deal: Deal }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.store}>{deal.storeName}</Text>
        <Text style={styles.discount}>{deal.discount}</Text>
      </View>
      <Text style={styles.title}>{deal.title}</Text>
      <Text style={styles.meta}>
        {deal.category} • valid until {deal.validUntil}
      </Text>
      <Text style={styles.price}>{deal.price}</Text>
    </View>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  store: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  discount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  title: { fontSize: 17, color: colors.text, fontWeight: "700" },
  meta: { fontSize: 14, color: colors.muted },
  price: { fontSize: 22, color: colors.text, fontWeight: "800" },
});
