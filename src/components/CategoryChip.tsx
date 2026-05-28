import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export function CategoryChip({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  icon: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
});
