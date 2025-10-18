import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppTextField from '@/components/ui/AppTextField';
import AppButton from '@/components/ui/AppButton';
import { useScheduleFormViewModel } from '@/features/schedule/viewmodels/useScheduleFormViewModel';
import type { DayKey, LocationType } from '@/features/schedule/types';

const DAYS: DayKey[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const LOCATIONS: LocationType[] = ['Home', 'Office'];

export default function ScheduleFormScreen() {
  const { state, setDay, submit, nextMonday, deadlineDate } = useScheduleFormViewModel();

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.header}> 
        <Text style={styles.title}>Next Week Schedule</Text>
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
              onChangeText={(t) => setDay(d, 'pickup', t, state.schedule[d].pickup?.location ?? 'Home')}
              leftIconName="time-outline"
              editable={!state.locked}
            />
            <AppTextField
              placeholder="Pickup Location (Home/Office)"
              value={state.schedule[d].pickup?.location ?? ''}
              onChangeText={(t) => setDay(d, 'pickup', state.schedule[d].pickup?.time ?? '', (t === 'Office' ? 'Office' : 'Home'))}
              leftIconName="location-outline"
              editable={!state.locked}
            />
            <AppTextField
              placeholder="Drop HH:mm"
              value={state.schedule[d].drop?.time ?? ''}
              onChangeText={(t) => setDay(d, 'drop', t, state.schedule[d].drop?.location ?? 'Home')}
              leftIconName="time-outline"
              editable={!state.locked}
            />
            <AppTextField
              placeholder="Drop Location (Home/Office)"
              value={state.schedule[d].drop?.location ?? ''}
              onChangeText={(t) => setDay(d, 'drop', state.schedule[d].drop?.time ?? '', (t === 'Office' ? 'Office' : 'Home'))}
              leftIconName="location-outline"
              editable={!state.locked}
            />
          </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <AppButton title={state.isSubmitting ? 'Submitting...' : 'Submit Schedule'} onPress={submit} disabled={state.locked || state.isSubmitting} style={{ width: '100%' }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  locked: { color: colors.accent, marginTop: 6 },
  content: { paddingHorizontal: 20, gap: 16, paddingBottom: 100, paddingTop: 8 },
  dayRow: { gap: 8 },
  dayLabel: { color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  footer: { paddingHorizontal: 20, paddingBottom: 16 },
});


