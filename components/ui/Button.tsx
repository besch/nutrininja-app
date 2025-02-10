import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { colors, typography, spacing } from "@/styles/theme";
import { LoadingDots } from "./LoadingDots";

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getLoadingColor = () => {
    if (disabled) {
      return "#8E8E93";
    }
    if (variant === "outline") {
      return colors.primary;
    }
    return colors.white;
  };

  const getDotSize = () => {
    switch (size) {
      case "small":
        return 4;
      case "large":
        return 6;
      default:
        return 5;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        loading && styles.loading,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <LoadingDots color={getLoadingColor()} size={getDotSize()} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "outline" && styles.outlineText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 44,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  disabled: {
    backgroundColor: "#E5E5EA",
    borderColor: "#E5E5EA",
  },
  loading: {
    opacity: 0.9,
  },
  text: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  outlineText: {
    color: colors.primary,
  },
  disabledText: {
    color: "#8E8E93",
  },
});
