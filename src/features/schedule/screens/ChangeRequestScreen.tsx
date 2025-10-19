import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppTextField from '@/components/ui/AppTextField';
import AppButton from '@/components/ui/AppButton';
import { useChangeRequestViewModel } from '@/features/schedule/viewmodels/useChangeRequestViewModel';
import type { DayKey } from '@/features/schedule/types';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type RouteParams = {
  weekStartISO: string;
  day: DayKey;
  current?: { time?: string; addressId?: string; addressName?: string };
};

export default function ChangeRequestScreen() {
  const route = useRoute<any>();
  const params = route.params as RouteParams;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, setNewTime, setNewAddress, submit } = useChangeRequestViewModel(params);
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const onSubmit = React.useCallback(async () => {
    const ok = await submit();
    if (ok) navigation.goBack();
  }, [submit, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Change Request • {state.day}</Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={styles.subtitle}>Week of {state.weekStartISO}</Text>
        {!state.canRequest && <Text style={styles.locked}>Allowed only 7+ days in advance</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppTextField
          label="New Pickup Time"
          placeholder="HH:mm"
          value={state.newTime}
          onChangeText={setNewTime}
          leftIconName="time-outline"
        />
        <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.9}>
          <AppTextField
            label="New Pickup Address"
            placeholder="Select Address"
            value={state.newAddress?.name ?? ''}
            onChangeText={() => {}}
            leftIconName="location-outline"
            rightIconName="chevron-down-outline"
            editable={false}
          />
        </TouchableOpacity>
        {state.oldTime || state.oldAddressName ? (
          <View style={styles.metaBox}>
            <Text style={styles.metaTitle}>Current</Text>
            <Text style={styles.metaText}>Time: {state.oldTime ?? '—'}</Text>
            <Text style={styles.metaText}>Address: {state.oldAddressName ?? '—'}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title={state.isSubmitting ? 'Submitting...' : 'Submit Change Request'} onPress={onSubmit} disabled={!state.canRequest || state.isSubmitting} style={{ width: '100%' }} />
      </View>

      <Modal transparent visible={pickerOpen} animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.modalSheet, { paddingBottom: 16 + insets.bottom }]}>
            <Pressable style={[styles.modalItem, { alignItems: 'center' }]} onPress={() => { setPickerOpen(false); navigation.navigate('SavedAddresses'); }}>
              <Text style={[styles.modalItemText, { color: colors.accent }]}>+ Add new address</Text>
            </Pressable>
            {state.addresses.map(a => (
              <Pressable key={a.id} style={styles.modalItem} onPress={() => { setNewAddress({ id: a.id, name: a.name || a.formattedAddress }); setPickerOpen(false); }}>
                <Text style={styles.modalItemText}>{a.name || a.formattedAddress}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  locked: { color: colors.accent, marginTop: 6 },
  content: { paddingHorizontal: 20, gap: 16, paddingBottom: 100, paddingTop: 8 },
  footer: { paddingHorizontal: 20 },
  metaBox: { backgroundColor: colors.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  metaTitle: { color: colors.textPrimary, fontWeight: '600', marginBottom: 6 },
  metaText: { color: colors.textSecondary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, paddingBottom: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalItem: { padding: 16 },
  modalItemText: { color: colors.textPrimary, fontSize: 16 },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});


