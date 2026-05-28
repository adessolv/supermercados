import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { weeklyDeals } from "../../data/mockData";
import { colors } from "../../theme/colors";

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Search offers</Text>
        <Text style={styles.subtitle}>
          Search by product, store, category or brand.
        </Text>

        <TextInput
          placeholder="Milk, shampoo, olive oil…"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Suggested results</Text>
          <Text style={styles.resultsCount}>{weeklyDeals.length} offers</Text>
        </View>

        {weeklyDeals.map((item) => (
          <View key={item.id} style={styles.resultCard}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultMeta}>
              {item.storeName} • {item.price} • {item.discount}
            </Text>
            <Text style={styles.resultDescription}>
              Category: {item.category}. Valid until {item.validUntil}.
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  resultsCount: { fontSize: 14, color: colors.muted },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  resultTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  resultMeta: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  resultDescription: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
