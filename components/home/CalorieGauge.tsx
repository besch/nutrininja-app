import React from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { colors, typography, shadows } from "@/styles/theme";

interface CalorieGaugeProps {
  totalCalories: number;
  consumedCalories: number;
}

export const CalorieGauge: React.FC<CalorieGaugeProps> = ({
  totalCalories,
  consumedCalories,
}) => {
  const percentage = Math.min((consumedCalories / totalCalories) * 100, 100);
  const remaining = totalCalories - consumedCalories;

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={200}
        width={15}
        fill={percentage}
        tintColor={colors.primary}
        backgroundColor={colors.gray[200]}
        rotation={0}
        lineCap="round"
      >
        {() => (
          <View style={styles.contentContainer}>
            <Text style={styles.remainingText}>{remaining}</Text>
            <Text style={styles.labelText}>calories left</Text>
          </View>
        )}
      </AnimatedCircularProgress>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    ...shadows.medium,
    backgroundColor: colors.white,
    borderRadius: 16,
    margin: 16,
  },
  contentContainer: {
    alignItems: "center",
  },
  remainingText: {
    fontSize: typography.sizes.xxxl,
    color: colors.text,
  },
  labelText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
