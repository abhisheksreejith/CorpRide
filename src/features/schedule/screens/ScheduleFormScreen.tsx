import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppTextField from '@/components/ui/AppTextField';
import AppButton from '@/components/ui/AppButton';
import { useScheduleFormViewModel } from '@/features/schedule/viewmodels/useScheduleFormViewModel';
import type { DayKey } from '@/features/schedule/types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

const DAYS: DayKey[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// locations are chosen from saved addresses via dropdown

export default function ScheduleFormScreen() {
  const { state, setDay, submit, nextMonday, deadlineDate } = useScheduleFormViewModel();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pickerFor, setPickerFor] = React.useState<{ day: DayKey; type: 'pickup' | 'drop' } | null>(null);

  const onSubmit = React.useCallback(async () => {
    const ok = await submit();
    if (ok) {
      // Ensure Home tabs resubscribe/refetch by resetting to HomeTabs > Schedule
      navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
    }
  }, [submit, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.header}> 
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Next Week Schedule</Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={styles.subtitle}>Week of {state.weekStartISO} • Deadline {deadlineDate.toLocaleString()}</Text>
        {state.locked && <Text style={styles.locked}>Locked after deadline</Text>}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {DAYS.map((d) => (
          <View key={d} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{d}</Text>
            <AppTextField
              placeholder="Pickup HH:mm"
              value={state.schedule[d].pickup?.time ?? ''}
              onChangeText={(t) => setDay(d, 'pickup', t, state.addresses.find(a => a.id === state.schedule[d].pickup?.addressId) ? { id: state.schedule[d].pickup?.addressId!, name: state.schedule[d].pickup?.addressName || '' } : undefined)}
              leftIconName="time-outline"
              editable={!state.locked}
            />
            <TouchableOpacity onPress={() => setPickerFor({ day: d, type: 'pickup' })} activeOpacity={0.9}>
              <AppTextField
                placeholder="Pickup Address"
                value={state.schedule[d].pickup?.addressName ?? ''}
                onChangeText={() => {}}
                leftIconName="location-outline"
                rightIconName="chevron-down-outline"
                editable={false}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPickerFor({ day: d, type: 'drop' })} activeOpacity={0.9}>
              <AppTextField
                placeholder="Drop Address"
                value={state.schedule[d].drop?.addressName ?? ''}
                onChangeText={() => {}}
                leftIconName="location-outline"
                rightIconName="chevron-down-outline"
                editable={false}
              />
            </TouchableOpacity>
            {/* Drop removed */}
          </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <AppButton title={state.isSubmitting ? 'Submitting...' : 'Submit Schedule'} onPress={onSubmit} disabled={state.locked || state.isSubmitting} style={{ width: '100%' }} />
      </View>

      <Modal transparent visible={!!pickerFor} animationType="fade" onRequestClose={() => setPickerFor(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerFor(null)}>
          <View style={[styles.modalSheet, { paddingBottom: 16 + insets.bottom }]}>
            <Pressable style={[styles.modalItem, { alignItems: 'center' }]} onPress={() => { setPickerFor(null); navigation.navigate('SavedAddresses'); }}>
              <Text style={[styles.modalItemText, { color: colors.accent }]}>+ Add new address</Text>
            </Pressable>
            {state.addresses.map(a => (
              <Pressable key={a.id} style={styles.modalItem} onPress={() => {
                if (!pickerFor) return;
                if (pickerFor.type === 'pickup') {
                  setDay(pickerFor.day, 'pickup', (state.schedule[pickerFor.day].pickup?.time ?? ''), { id: a.id, name: a.name || a.formattedAddress });
                } else {
                  // store only drop address
                  state.schedule[pickerFor.day].drop = { addressId: a.id, addressName: a.name || a.formattedAddress } as any;
                }
                setPickerFor(null);
              }}>
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
  dayRow: { gap: 8 },
  dayLabel: { color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  footer: { paddingHorizontal: 20, },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, paddingBottom: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalItem: { padding: 16, },
  modalItemText: { color: colors.textPrimary, fontSize: 16 },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});


