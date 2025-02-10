import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { colors, typography, spacing, shadows } from "@/styles/theme";

interface MacroProgressProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

const MacroItem: React.FC<MacroProgressProps> = ({
  label,
  current,
  target,
  color,
}) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.macroContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current}/{target}g
        </Text>
      </View>
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

export const MacroProgress: React.FC<{
  proteins: { current: number; target: number };
  carbs: { current: number; target: number };
  fats: { current: number; target: number };
}> = ({ proteins, carbs, fats }) => {
  return (
    <View style={styles.container}>
      <MacroItem
        label="Proteins"
        current={proteins.current}
        target={proteins.target}
        color={colors.primary}
      />
      <MacroItem
        label="Carbs"
        current={carbs.current}
        target={carbs.target}
        color={colors.secondary}
      />
      <MacroItem
        label="Fats"
        current={fats.current}
        target={fats.target}
        color={colors.warning}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    margin: spacing.md,
    ...shadows.medium,
  },
  macroContainer: {
    marginBottom: spacing.md,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  progressBackground: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});
