import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  variant?: "primary" | "secondary" | "success" | "danger";
};

export default function AppButton({
  title,
  onPress,
  disabled,
  style,
  testID,
  variant = "primary",
}: Props) {
  let backgroundColor: string = colors.accent as string;
  let textColor: string = "#1C1C1C";
  if (variant === "secondary") {
    backgroundColor = colors.card;
    textColor = colors.textPrimary;
  } else if (variant === "success") {
    backgroundColor = colors.success;
    textColor = "#FFFFFF";
  } else if (variant === "danger") {
    backgroundColor = colors.danger;
    textColor = "#FFFFFF";
  }
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor },
        disabled && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
