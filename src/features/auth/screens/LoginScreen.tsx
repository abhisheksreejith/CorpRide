import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLoginViewModel } from "@/features/auth/viewmodels/useLoginViewModel";
import AppTextField from "@/components/ui/AppTextField";
import AppButton from "@/components/ui/AppButton";
import { colors } from "@/theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { showMessage } from "@/components/ui/Toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import { useGoogleSSO } from "@/features/auth/viewmodels/useGoogleSSO";

export default function LoginScreen() {
  const { state, setEmail, setPassword, submit } =
    useLoginViewModel();
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList>
  >();

  const { promptAsync: promptGoogle, request: googleRequest } = useGoogleSSO(
    "787315371389-37qr8o4d864e4r4eipmle0pt80l4v2ek.apps.googleusercontent.com",
    "787315371389-avsh3o6go9a2fsf4o2vdf4fe7b3iq7h9.apps.googleusercontent.com"
  );

  const onSignIn = React.useCallback(async () => {
    const result = await submit();
    if (result?.user) {
      if (result.isAdmin) {
        showMessage('Admin login successful');
        return;
      }
      if (result.profileCompleted) {
        showMessage('Welcome back');
        return;
      }
      navigation.replace("ProfileSetup");
    }
  }, [navigation, submit]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.content}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>Login to your </Text>
          <Text style={styles.title}>Account</Text>
        </View>
        {/* <View style={{ height: 14 }} /> */}
        <AppTextField
          leftIconName="mail-outline"
          placeholder="john_doe@yourdomain.com"
          value={state.email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppTextField
          leftIconName="lock-closed-outline"
          placeholder="••••••••"
          value={state.password}
          onChangeText={setPassword}
          secureTextEntry
          rightToggleSecure
        />

        {!!state.error && (
          <Text style={styles.errorText}>{state.error}</Text>
        )}
        <AppButton
          title={state.isSubmitting ? "Signing in..." : "Sign in"}
          onPress={onSignIn}
          disabled={state.isSubmitting || !state.email || !state.password}
        />

        <TouchableOpacity
          style={[styles.linkButton, { marginTop: 12 }]}
          disabled={!googleRequest}
          onPress={() => googleRequest && promptGoogle()}
        >
          <Text style={styles.linkText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Forgot the password?</Text>
        </TouchableOpacity>
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
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 18,
  },
  titleWrapper: {
    alignSelf: "flex-start",
    transform: [{ translateY: -40 }],
  },
  title: {
    color: colors.textPrimary,
    fontSize: 38,
    
    fontWeight: "600",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  rememberText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkButton: {
    alignSelf: "center",
  },
  linkText: {
    color: colors.accent,
    fontSize: 14,
  },
  errorText: {
    color: '#FF6B6B',
    alignSelf: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },
  continueText: {
    color: colors.textSecondary,
    alignSelf: "center",
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    width: 68,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signUpRow: {
    flexDirection: "row",
    alignSelf: "center",
  },
  footerText: {
    color: colors.textSecondary,
  },
  signUpText: {
    color: colors.accent,
    fontWeight: "600",
  },
});
