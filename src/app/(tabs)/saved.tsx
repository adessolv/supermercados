import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";

export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.text}>
          Use this screen later for favorites, shopping list and loyalty cards.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 10 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  text: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
