import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { stores, weeklyDeals } from "../data/mockData";
import { colors } from "../theme/colors";

const store = stores[0];
const deals = weeklyDeals.filter((item) => item.storeId === store.id);

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.meta}>
            {store.distance} • {store.city}
          </Text>
          <Text style={styles.description}>{store.description}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Open hours</Text>
            <Text style={styles.infoValue}>09:00 – 21:30</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Loyalty</Text>
            <Text style={styles.infoValue}>Card connected</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active brochures and deals</Text>
          {deals.map((deal) => (
            <View key={deal.id} style={styles.dealRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{deal.discount}</Text>
              </View>
              <View style={styles.dealContent}>
                <Text style={styles.dealTitle}>{deal.title}</Text>
                <Text style={styles.dealMeta}>
                  {deal.price} • until {deal.validUntil}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 18, paddingBottom: 32 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  meta: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  infoGrid: { flexDirection: "row", gap: 12 },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  dealRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  badgeText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  dealContent: { flex: 1, gap: 4 },
  dealTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  dealMeta: { color: colors.muted, fontSize: 14 },
});
