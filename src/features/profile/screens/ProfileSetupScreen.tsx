import React from 'react';
import { View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import AppTextField from '@/components/ui/AppTextField';
import AppButton from '@/components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';
import { useProfileViewModel } from '@/features/profile/viewmodels/useProfileViewModel';
import AddressPicker from '@/features/profile/components/AddressPicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

export default function ProfileSetupScreen() {
  const { state, setField, submit, fillAddressFromLocation } = useProfileViewModel();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const picked = (route.params as any)?.pickedAddress as { formattedAddress: string; latitude: number; longitude: number } | undefined;
  const [genderPickerVisible, setGenderPickerVisible] = React.useState(false);
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack();

  const onContinue = React.useCallback(async () => {
    const ok = await submit();
    if (ok) {
      navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
    }
  }, [submit, navigation]);

  React.useEffect(() => {
    if (picked) {
      setField('address', picked.formattedAddress);
      setField('latitude', picked.latitude as any);
      setField('longitude', picked.longitude as any);
    }
  }, [picked]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
        <View style={styles.headerRow}>
          {canGoBack ? (
            <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : <View style={{ width: 24 }} />}
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

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
        <TouchableOpacity activeOpacity={0.9} onPress={() => setGenderPickerVisible(true)}>
          <AppTextField
            placeholder="Gender"
            value={state.gender}
            onChangeText={() => {}}
            leftIconName="male-female-outline"
            rightIconName="chevron-down-outline"
            editable={false}
            onPressRightIcon={() => setGenderPickerVisible(true)}
          />
        </TouchableOpacity>
        <Modal transparent visible={genderPickerVisible} animationType="fade" onRequestClose={() => setGenderPickerVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setGenderPickerVisible(false)}>
            <View style={[styles.modalSheet, { paddingBottom: 16 + insets.bottom }]}>
              {['Male','Female','Other'].map(opt => (
                <Pressable key={opt} style={styles.modalItem} onPress={() => { setField('gender', opt as any); setGenderPickerVisible(false); }}>
                  <Text style={styles.modalItemText}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.footer}>
        <AppButton title="Continue" onPress={onContinue} style={{ width: '100%' }} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, paddingBottom: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalItem: { padding: 16,
    
   },
  modalItemText: { color: colors.textPrimary, fontSize: 16 },
});


