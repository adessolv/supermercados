import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { getBrandSlug } from "../../constants/brandSlugs";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";

type StoreItem = {
  id: string;
  name: string;
  brand?: string | null;
  address?: string | null;
  lat: number;
  lon: number;
  distance_km: number;
  source: string;
};

type LocationStatus = "idle" | "manual" | "detected" | "loading";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_RADIUS = 1000;

export default function HomeScreen() {
  type SearchSource = "gps" | "postal" | null;

  type Coords = {
    lat: number;
    lon: number;
  };

  const [currentCoords, setCurrentCoords] = useState<Coords | null>(null);
  const [postalCoords, setPostalCoords] = useState<Coords | null>(null);
  const [searchSource, setSearchSource] = useState<SearchSource>(null);
  const [postalCodeInput, setPostalCodeInput] = useState("");
  const [city, setCity] = useState("");
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("manual");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);

  const handlePostalCodeChange = (text: string) => {
    const onlyDigits = text.replace(/[^0-9]/g, "");
    setPostalCodeInput(onlyDigits);
  };

  const router = useRouter();

  const openStoreCatalogs = (store: StoreItem) => {
    const candidate = store.brand || store.name;
    const slug = getBrandSlug(candidate);

    if (!slug) {
      Alert.alert(
        "Catalogs unavailable",
        "No brand slug found for this store.",
      );
      return;
    }

    const href = `/store/${slug}` as any;
    router.push(href);
  };

  const fetchNearbyStores = async (
    lat: number,
    lon: number,
    radius = DEFAULT_RADIUS,
  ) => {
    if (!API_BASE_URL) {
      Alert.alert(
        "API URL missing",
        "Add EXPO_PUBLIC_API_BASE_URL to your .env file.",
      );
      return;
    }

    try {
      setStoresLoading(true);
      setSearchRadius(radius);

      const response = await fetch(
        `${API_BASE_URL}/stores/nearby?lat=${lat}&lon=${lon}&radius=${radius}`,
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.details || json?.error || `Backend error: ${response.status}`,
        );
      }

      setStores(json.stores ?? []);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Stores error",
        error instanceof Error
          ? error.message
          : "Could not load nearby stores.",
      );
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchCityByPostalCode = async (postalCode: string) => {
    if (!API_BASE_URL) {
      Alert.alert(
        "API URL missing",
        "Add EXPO_PUBLIC_API_BASE_URL to your .env file.",
      );
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/geo/postal/${postalCode}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.details ||
            json?.error ||
            `Geo backend error: ${response.status}`,
        );
      }

      if (json?.city) {
        setCity(json.city);
      }

      return json;
    } catch (error) {
      console.log(error);
      Alert.alert(
        "City lookup error",
        error instanceof Error ? error.message : "Could not fetch city.",
      );
      return null;
    }
  };

  const fetchCoordinatesByPostalCode = async (postalCode: string) => {
    if (!API_BASE_URL) {
      Alert.alert(
        "API URL missing",
        "Add EXPO_PUBLIC_API_BASE_URL to your .env file.",
      );
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/geo/postal/${postalCode}/coords`,
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.details ||
            json?.error ||
            `Coords backend error: ${response.status}`,
        );
      }

      return json as {
        postalCode: string;
        lat: number;
        lon: number;
        displayName?: string | null;
      };
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Postal code lookup error",
        error instanceof Error
          ? error.message
          : "Could not get coordinates for postal code.",
      );
      return null;
    }
  };

  const detectLocation = async () => {
    try {
      setLocationStatus("loading");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationStatus("manual");
        Alert.alert(
          "Location access denied",
          "Please enter your postal code manually.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      console.log("CURRENT LAT/LON:", latitude, longitude);

      const coords = { lat: latitude, lon: longitude };
      setCurrentCoords(coords);
      setSearchSource("gps");

      await fetchNearbyStores(latitude, longitude, DEFAULT_RADIUS);

      try {
        const result = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const place = result?.[0];

        if (place?.postalCode) {
          setPostalCodeInput(place.postalCode);
        }

        if (place?.city) {
          setCity(place.city.toUpperCase());
        }
      } catch (geoError) {
        console.log("Reverse geocode failed:", geoError);
      }

      setLocationStatus("detected");
    } catch (error) {
      console.log(error);
      setLocationStatus("manual");
      Alert.alert("Location error", "Could not get your current location.");
    }
  };

  const handleManualLookup = async () => {
    if (postalCodeInput.length !== 5) {
      Alert.alert("Invalid postal code", "Please enter a 5-digit postal code.");
      return;
    }

    try {
      setLookupLoading(true);
      setLocationStatus("manual");

      await fetchCityByPostalCode(postalCodeInput);
      const coords = await fetchCoordinatesByPostalCode(postalCodeInput);

      if (!coords) {
        return;
      }

      const nextPostalCoords = { lat: coords.lat, lon: coords.lon };
      setPostalCoords(nextPostalCoords);
      setSearchSource("postal");

      await fetchNearbyStores(coords.lat, coords.lon, DEFAULT_RADIUS);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleWiderSearch = async () => {
    if (storesLoading) return;

    if (searchSource === "gps" && currentCoords) {
      await fetchNearbyStores(currentCoords.lat, currentCoords.lon, 1000);
      return;
    }

    if (searchSource === "postal" && postalCoords) {
      await fetchNearbyStores(postalCoords.lat, postalCoords.lon, 1000);
      return;
    }

    Alert.alert(
      "Search wider area",
      "First detect your location or enter a postal code.",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Location first MVP</Text>
          <Text style={styles.title}>
            Find the nearest supermarkets around you.
          </Text>
          <Text style={styles.subtitle}>
            Search nearby stores using your current location or a postal code in
            Spain.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your area</Text>

          <Pressable style={styles.detectButton} onPress={detectLocation}>
            <Text style={styles.detectButtonText}>
              {locationStatus === "loading"
                ? "Detecting location..."
                : "Use my current location"}
            </Text>
          </Pressable>

          <View style={styles.postalCard}>
            <Text style={styles.label}>Postal code</Text>
            <TextInput
              value={postalCodeInput}
              onChangeText={handlePostalCodeChange}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="Enter ZIP code"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Pressable
              style={[
                styles.secondaryButton,
                lookupLoading && styles.disabledButton,
              ]}
              onPress={handleManualLookup}
              disabled={lookupLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {lookupLoading
                  ? "Searching area..."
                  : "Find stores by postal code"}
              </Text>
            </Pressable>

            <Text style={styles.label}>City</Text>
            <View style={styles.cityBox}>
              <Text style={styles.cityText}>{city}</Text>
            </View>

            <Text style={styles.helperText}>
              Search is limited to Spain and starts with a 500 meter radius.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Nearest supermarkets</Text>
            <Text style={styles.badge}>{stores.length} stores</Text>
          </View>

          <Text style={styles.helperText}>
            Current radius: {searchRadius} m
          </Text>

          {storesLoading ? (
            <Text style={styles.helperText}>Loading nearby stores...</Text>
          ) : stores.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No nearby stores loaded yet</Text>
              <Text style={styles.helperText}>
                Use your location or enter a postal code to search in a 500
                meter radius.
              </Text>
            </View>
          ) : (
            <>
              {stores.map((store, index) => (
                <Pressable
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => openStoreCatalogs(store)}
                >
                  <View style={styles.storeHeader}>
                    <View style={styles.storeInfo}>
                      <Text style={styles.storeName}>{store.name}</Text>
                      <Text style={styles.storeAddress}>
                        {store.address || "Address not available"}
                      </Text>
                    </View>

                    <View style={styles.rankBubble}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                  </View>

                  <View style={styles.storeMetaRow}>
                    <Text style={styles.distance}>
                      {store.distance_km.toFixed(2)} km
                    </Text>
                    <Text style={styles.linkText}>
                      {store.brand || "Supermarket"}
                    </Text>
                  </View>
                </Pressable>
              ))}

              <Pressable
                style={styles.outlineButton}
                onPress={handleWiderSearch}
              >
                <Text style={styles.outlineButtonText}>
                  Search wider area (1000 m)
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    gap: 24,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.primary,
    fontWeight: "700",
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  detectButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  detectButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  postalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  secondaryButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  cityBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cityText: {
    fontSize: 16,
    color: colors.text,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: colors.muted,
  },
  rankBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  storeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distance: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
  outlineButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  outlineButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
