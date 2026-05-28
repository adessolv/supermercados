import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export default function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1800);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🛒</Text>
        </View>
        <Text style={styles.title}>SmartOffers</Text>
        <Text style={styles.subtitle}>
          Nearby supermarkets, offers and brochures in one place.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    maxWidth: 280,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
});
