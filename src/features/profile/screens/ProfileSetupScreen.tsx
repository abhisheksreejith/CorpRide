import React from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppTextField from '@/components/ui/AppTextField';
import AppButton from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';
import { useProfileViewModel } from '@/features/profile/viewmodels/useProfileViewModel';

export default function ProfileSetupScreen() {
  const { state, setField, submit, fillAddressFromLocation } = useProfileViewModel();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
        <Text style={styles.title}>Fill Your Profile</Text>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Ionicons name="person" color={colors.placeholder} size={72} />
          </View>
        </View>

        <AppTextField
          placeholder="Full Name"
          value={state.fullName}
          onChangeText={text => setField('fullName', text)}
          leftIconName="person-outline"
        />
        <AppTextField
          placeholder="Email"
          value={state.email}
          onChangeText={() => {}}
          leftIconName="mail-outline"
          editable={false}
        />
        <AppTextField
          placeholder="Phone Number"
          value={state.phone}
          onChangeText={text => setField('phone', text)}
          leftIconName="call-outline"
          keyboardType="number-pad"
        />
        <AppTextField
          placeholder="Address"
          value={state.address}
          onChangeText={text => setField('address', text)}
          leftIconName="location-outline"
          rightIconName={state.isFetchingAddress ? undefined : 'navigate-outline'}
          onPressRightIcon={() => {
            if (!state.isFetchingAddress) fillAddressFromLocation();
          }}
        />
        <AppTextField
          placeholder="Gender"
          value={state.gender}
          onChangeText={text => setField('gender', text as any)}
          leftIconName="male-female-outline"
          rightIconName="chevron-down-outline"
        />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.footer}>
        <AppButton title="Continue" onPress={submit} style={{ width: '100%' }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


