/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { colors } from "@/theme/colors";

export const showMessage = (
  message: string,
  type: "success" | "error" = "success"
) => {
  Toast.show({
    type,
    text1: message,
    visibilityTime: 3000,
    autoHide: true,
    position: "bottom",
    bottomOffset: Platform.OS === "android" ? 110 : 95,
  });
};

const BaseToast = ({
  text1,
  type,
}: {
  text1: string;
  type: "success" | "error";
}) => {
  const isError = type === "error";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isError ? colors.danger : colors.success },
      ]}
    >
      <Text style={[styles.textPadding]}>{text1}</Text>
    </View>
  );
};

const toastConfig = {
  success: (props: any) => <BaseToast {...props} type="success" />,
  error: (props: any) => <BaseToast {...props} type="error" />,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 8,
    elevation: 5,
    flexDirection: "row",
    marginTop: Platform.OS === "android" ? 10 : 20,
    padding: 10,
    shadowColor: colors.background,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: "90%",
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    marginRight: 13,
    width: 24,
  },
  textPadding: {
    flex: 1,
    flexWrap: "wrap",
  },
});

export default toastConfig;
