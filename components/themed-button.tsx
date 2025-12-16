// components/themed-button.tsx
import React from "react";
import { StyleSheet, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";

type ButtonProps = TouchableOpacityProps & {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "outline";
};

export function ThemedButton({
  children,
  style,
  textStyle,
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: { backgroundColor: "#2196F3", borderWidth: 0 },
    secondary: { backgroundColor: "#4CAF50", borderWidth: 0 },
    outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#2196F3" },
  } as const;

  return (
    <TouchableOpacity
      style={[styles.button, variantStyles[variant], disabled && styles.disabled, style]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <ThemedText
        style={[
          styles.text,
          variant === "outline" && { color: "#2196F3" },
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    backgroundColor: "#E0E0E0",
  },
  disabledText: {
    color: "#9E9E9E",
  },
});
