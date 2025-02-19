import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { colors, typography, shadows } from "@/styles/theme";

interface CalorieGaugeProps {
  totalCalories: number;
  consumedCalories: number;
  burnedCalories: number;
}

export const CalorieGauge: React.FC<CalorieGaugeProps> = ({
  totalCalories,
  consumedCalories,
  burnedCalories,
}) => {
  const netCalories = consumedCalories - burnedCalories;
  const foodPercentage = Math.min((consumedCalories / totalCalories) * 100, 100);
  const netPercentage = Math.min((netCalories / totalCalories) * 100, 100);
  const remaining = totalCalories - netCalories;

  return (
    <View style={styles.container}>
      <View style={styles.gaugeContainer}>
        <AnimatedCircularProgress
          size={200}
          width={15}
          fill={foodPercentage}
          tintColor={colors.primary}
          backgroundColor={colors.gray[200]}
          rotation={0}
          lineCap="round"
        >
          {() => (
            <AnimatedCircularProgress
              size={170}
              width={15}
              fill={netPercentage}
              tintColor={colors.secondary}
              backgroundColor="transparent"
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
          )}
        </AnimatedCircularProgress>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Food ({consumedCalories} kcal)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
          <Text style={styles.legendText}>Net ({netCalories} kcal)</Text>
        </View>
      </View>
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
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
