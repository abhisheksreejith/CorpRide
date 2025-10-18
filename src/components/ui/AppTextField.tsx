import React from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIconName?: keyof typeof Ionicons.glyphMap;
  rightToggleSecure?: boolean;
  testID?: string;
  rightIconName?: keyof typeof Ionicons.glyphMap | undefined;
  onPressRightIcon?: (() => void) | undefined;
  editable?: boolean;
};

export default function AppTextField({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIconName,
  rightToggleSecure,
  testID,
  rightIconName,
  onPressRightIcon,
  editable = true,
}: Props) {
  const [isSecure, setIsSecure] = React.useState(!!secureTextEntry);
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && editable && { borderColor: colors.accent, backgroundColor: colors.accentTint },
          !editable && { opacity: 0.85 },
        ]}
      >
        {leftIconName ? (
          <Ionicons
            name={leftIconName}
            size={18}
            color={focused && editable ? colors.accent : colors.placeholder}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
        />
        {rightToggleSecure ? (
          <TouchableOpacity onPress={() => setIsSecure(prev => !prev)}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={focused && editable ? colors.accent : colors.placeholder}
            />
          </TouchableOpacity>
        ) : rightIconName ? (
          <TouchableOpacity disabled={!onPressRightIcon} onPress={onPressRightIcon}>
            <Ionicons
              name={rightIconName}
              size={18}
              color={focused && editable ? colors.accent : colors.placeholder}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
});


