import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileOverviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    setEmail(user.email ?? '');
    const unsub = firestore().collection('users').doc(user.uid).onSnapshot(d => {
      const data = d.data() as any;
      setName(data?.fullName ?? '');
      setPhone(data?.phone ?? '');
    });
    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={colors.placeholder} />
        </View>
        <Text style={styles.name}>{name || '—'}</Text>
        <Text style={styles.phone}>{phone || '—'}</Text>
      </View>

      <View style={styles.divider} />

      <ListRow icon="create-outline" title="Edit Profile" onPress={() => navigation.navigate('ProfileSetup')} />
      <ListRow icon="location-outline" title="Address" onPress={() => navigation.navigate('SavedAddresses')} />
      <ListRowToggle icon="moon-outline" title="Dark Mode" value={dark} onChange={setDark} />
      <ListRow icon="log-out-outline" title="Logout" danger onPress={async () => { await auth().signOut(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  avatarWrap: { alignItems: 'center', paddingVertical: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 10 },
  phone: { color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12, marginHorizontal: 16 },
});

function ListRow({ icon, title, onPress, rightText, danger }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress?: () => void; rightText?: string; danger?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Ionicons name={icon} size={18} color={danger ? '#FF6B6B' : colors.textPrimary} />
        <Text style={[rowStyles.title, danger && { color: '#FF6B6B' }]}>{title}</Text>
      </View>
      <View style={rowStyles.right}>
        {rightText ? <Text style={rowStyles.rightText}>{rightText}</Text> : null}
        {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );
}

function ListRowToggle({ icon, title, value, onChange }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Ionicons name={icon} size={18} color={colors.textPrimary} />
        <Text style={rowStyles.title}>{title}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} thumbColor={value ? colors.accent : '#6B727C'} trackColor={{ true: '#3A3A3A', false: '#2A2F36' }} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: colors.textPrimary, fontSize: 16 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightText: { color: colors.textSecondary },
});


