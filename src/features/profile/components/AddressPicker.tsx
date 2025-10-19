import React from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, StyleSheet as RNStyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';
import { colors } from '@/theme/colors';

type Props = {
  initialText?: string | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  onChange: (val: { formattedAddress: string; latitude: number; longitude: number; placeId?: string }) => void;
  fullHeight?: boolean;
};

type Prediction = { description: string; place_id: string };

export default function AddressPicker({ initialText, latitude, longitude, onChange, fullHeight }: Props) {
  const [region, setRegion] = React.useState<any>(() => {
    if (latitude != null && longitude != null) {
      return { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    }
    return undefined;
  });

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      console.log('GOOGLE_MAPS_API_KEY', GOOGLE_MAPS_API_KEY);
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address,geometry&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== 'OK') {
        console.warn('Places details status', json.status, json.error_message);
        return undefined;
      }
      const result = json.result;
      const lat = result?.geometry?.location?.lat;
      const lng = result?.geometry?.location?.lng;
      const formatted = result?.formatted_address;
      if (lat == null || lng == null || !formatted) return undefined;
      return { latitude: lat, longitude: lng, formattedAddress: formatted };
    } catch (e) {
      console.warn('Places details fetch error', e);
      return undefined;
    }
  };

  const [query, setQuery] = React.useState(initialText ?? '');
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (region) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Fallback to a default region (central coordinates)
          setRegion({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      } catch {
        setRegion({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      }
    })();
  }, [region]);

  React.useEffect(() => {
    if (!isEditing || !query || query.length < 2) {
      setPredictions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status !== 'OK') {
          setPredictions([]);
        } else {
          setPredictions((json.predictions || []).map((p: any) => ({ description: p.description, place_id: p.place_id })));
        }
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, isEditing]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Try Google Geocoding API first
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      let formatted = json?.results?.[0]?.formatted_address as string | undefined;
      if (formatted) return formatted;
      // Fallback to Expo Location reverse geocode
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const p = results?.[0];
      formatted = [p?.name, p?.street, p?.postalCode, p?.city || p?.subregion, p?.region, p?.country]
        .filter(Boolean)
        .join(', ');
      return formatted || undefined;
    } catch {
      return undefined;
    }
  };

  return (
    <View style={[styles.container, fullHeight && { flex: 1 }]}>
      <View style={fullHeight ? styles.mapWrapFull : styles.mapWrapSmall}>
        <MapView
          style={RNStyleSheet.absoluteFillObject}
          initialRegion={region}
          region={region}
          onPress={async (e) => {
            const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
            setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
            const formatted = await reverseGeocode(lat, lng);
            const display = formatted ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onChange({ formattedAddress: display, latitude: lat, longitude: lng });
            setQuery(display);
            setPredictions([]);
            setIsEditing(false);
          }}
        >
          {region && (
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
          )}
        </MapView>
      </View>

      {/* Floating search bar */}
      <View style={styles.searchOverlay}>
        <TextInput
          style={styles.input}
          placeholder="Search address"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={(t) => { setIsEditing(true); setQuery(t); }}
          onFocus={() => setIsEditing(true)}
        />
      </View>

      {/* Floating predictions under search */}
      {!!predictions.length && (
        <View style={styles.predictionOverlay}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={async () => {
                  const details = await fetchPlaceDetails(item.place_id);
                  if (details) {
                    onChange({ formattedAddress: details.formattedAddress, latitude: details.latitude, longitude: details.longitude, placeId: item.place_id });
                    setIsEditing(false);
                    setQuery(details.formattedAddress);
                    setPredictions([]);
                    setRegion({ latitude: details.latitude, longitude: details.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                  }
                }}
                style={styles.predictionItem}
              >
                <Text style={{ color: colors.textPrimary }}>{item.description}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  predictionList: { maxHeight: 200, backgroundColor: colors.card, borderRadius: 8 },
  predictionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  map: { height: "100%", borderRadius: 12 },
  mapFull: { flex: 1 },
  mapWrapFull: { flex: 1 },
  mapWrapSmall: { height: "100%", borderRadius: 12, overflow: 'hidden' },
  searchOverlay: { position: 'absolute', left: 8, right: 8, top: 8 },
  predictionOverlay: { position: 'absolute', left: 16, right: 16, top: 72, maxHeight: 240, borderRadius: 8, overflow: 'hidden' },
});


