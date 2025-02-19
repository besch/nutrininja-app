import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { colors, typography, spacing, shadows } from "@/styles/theme";

interface MacroProgressProps {
  label: string;
  current: number;
  target: number;
  color: string;
  burnedCalories?: number;
}

const MacroItem: React.FC<MacroProgressProps> = ({
  label,
  current,
  target,
  color,
  burnedCalories = 0,
}) => {
  const netCurrent = Math.max(0, current - burnedCalories);
  const percentage = Math.min((netCurrent / target) * 100, 100);

  return (
    <View style={styles.macroContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {netCurrent}/{target}g
          {burnedCalories > 0 && (
            <Text style={styles.burnedText}> (-{burnedCalories})</Text>
          )}
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
  burnedCalories?: number;
}> = ({ proteins, carbs, fats, burnedCalories = 0 }) => {
  // Distribute burned calories proportionally among macros
  const totalMacros = proteins.current + carbs.current + fats.current;
  const proteinRatio = proteins.current / totalMacros;
  const carbsRatio = carbs.current / totalMacros;
  const fatsRatio = fats.current / totalMacros;

  const burnedProteins = Math.round(burnedCalories * proteinRatio * 0.25); // 1g protein = 4 calories
  const burnedCarbs = Math.round(burnedCalories * carbsRatio * 0.25); // 1g carbs = 4 calories
  const burnedFats = Math.round(burnedCalories * fatsRatio * 0.11); // 1g fat = 9 calories

  return (
    <View style={styles.container}>
      <MacroItem
        label="Proteins"
        current={proteins.current}
        target={proteins.target}
        color={colors.primary}
        burnedCalories={burnedProteins}
      />
      <MacroItem
        label="Carbs"
        current={carbs.current}
        target={carbs.target}
        color={colors.secondary}
        burnedCalories={burnedCarbs}
      />
      <MacroItem
        label="Fats"
        current={fats.current}
        target={fats.target}
        color={colors.warning}
        burnedCalories={burnedFats}
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
  burnedText: {
    fontSize: typography.sizes.sm,
    color: colors.secondary,
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
