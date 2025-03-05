import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import type { Meal } from '@/types';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface MacrosSummaryProps {
  isLoading: boolean;
  meals: Meal[];
  burnedCalories: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatsGoal?: number;
}

const LoadingMacroCard: React.FC = () => (
  <View style={styles.macroCard}>
    <View style={styles.macroCardContent}>
      <ShimmerPlaceholder 
        style={[styles.macroValue, styles.shimmerValue]} 
        width={80}
      />
      <ShimmerPlaceholder 
        style={[styles.macroLabel, styles.shimmerLabel]} 
        width={60}
      />
      <View style={styles.macroProgress}>
        <ShimmerPlaceholder 
          style={styles.shimmerCircle} 
          width={60} 
          height={60}
          shimmerStyle={{ borderRadius: 30 }}
        />
        <View style={styles.circleIcon}>
          <ShimmerPlaceholder
            style={{ width: 24, height: 24, borderRadius: 12 }}
          />
        </View>
      </View>
    </View>
  </View>
);

const MacroCard: React.FC<{
  value: number;
  label: string;
  icon: string;
  color: string;
  total: number;
  isNegative: boolean;
  isEmpty: boolean;
}> = ({ value, label, icon, color, total, isNegative, isEmpty }) => {
  const goalValue = isNegative ? total : (total + value);
  const progressValue = useMemo(() => {
    // If we have no data yet, return 0 to avoid showing 100% progress
    if (isEmpty || goalValue === 0) return 0;
    
    return isNegative 
      ? Math.min(1, total ? Math.abs(value) / total : 0)
      : Math.min(1, goalValue ? total / goalValue : 0);
  }, [isNegative, total, value, goalValue, isEmpty]);

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroCardContent}>
        <Text style={[styles.macroValue, isNegative && styles.negativeValue]}>
          {Math.round(Math.abs(value))}g
        </Text>
        <Text 
          style={[styles.macroLabel, isNegative && styles.negativeValue]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isEmpty ? 'No data' : (isNegative ? `${label} over` : `${label} left`)}
        </Text>
        <View style={styles.macroProgress}>
          <Progress.Circle
            size={60}
            progress={progressValue}
            thickness={7}
            color={isNegative ? "#FF6B6B" : color}
            unfilledColor="#eee"
            borderWidth={0}
            animated
            strokeCap="round"
          />
          <View style={styles.circleIcon}>
            <Ionicons 
              name={icon as any} 
              size={20} 
              color="#FFF" 
              style={{ backgroundColor: color, padding: 2, borderRadius: 12 }} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export const MacrosSummary: React.FC<MacrosSummaryProps> = ({
  isLoading,
  meals,
  burnedCalories = 0,
  proteinGoal = 0,
  carbsGoal = 0,
  fatsGoal = 0,
}) => {
  const { proteins, carbs, fats } = useMemo(() => {
    const totals = meals
      .filter(meal => meal.analysis_status === 'completed')
      .reduce((acc, meal) => ({
        proteins: acc.proteins + meal.proteins,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }), {
        proteins: 0,
        carbs: 0,
        fats: 0,
      });
    
    // Calculate burned macros based on proportions
    const totalMacros = totals.proteins + totals.carbs + totals.fats;
    const proteinRatio = totalMacros > 0 ? totals.proteins / totalMacros : 0.3;
    const carbsRatio = totalMacros > 0 ? totals.carbs / totalMacros : 0.5;
    const fatsRatio = totalMacros > 0 ? totals.fats / totalMacros : 0.2;

    const burnedProteins = Math.round(burnedCalories * proteinRatio * 0.25); // 1g protein = 4 calories
    const burnedCarbs = Math.round(burnedCalories * carbsRatio * 0.25); // 1g carbs = 4 calories
    const burnedFats = Math.round(burnedCalories * fatsRatio * 0.11); // 1g fat = 9 calories
    
    // Check if we have valid goals
    const hasValidGoals = proteinGoal > 0 && carbsGoal > 0 && fatsGoal > 0;
    
    return {
      proteins: {
        total: totals.proteins,
        remaining: hasValidGoals ? (proteinGoal - totals.proteins + burnedProteins) : 0
      },
      carbs: {
        total: totals.carbs,
        remaining: hasValidGoals ? (carbsGoal - totals.carbs + burnedCarbs) : 0
      },
      fats: {
        total: totals.fats,
        remaining: hasValidGoals ? (fatsGoal - totals.fats + burnedFats) : 0
      }
    };
  }, [meals, burnedCalories, proteinGoal, carbsGoal, fatsGoal]);

  const shouldShowShimmer = isLoading || (proteinGoal <= 0 || carbsGoal <= 0 || fatsGoal <= 0);

  if (shouldShowShimmer) {
    return (
      <View style={styles.macrosContainer}>
        {Array(3).fill(0).map((_, index) => (
          <LoadingMacroCard key={index} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.macrosContainer}>
      <MacroCard
        value={proteins.remaining}
        label="Protein"
        icon="flash-outline"
        color="#FF3B30"
        total={proteins.total}
        isNegative={proteins.remaining < 0}
        isEmpty={proteins.total === 0}
      />
      <MacroCard
        value={carbs.remaining}
        label="Carbs"
        icon="leaf-outline"
        color="#FF9500"
        total={carbs.total}
        isNegative={carbs.remaining < 0}
        isEmpty={carbs.total === 0}
      />
      <MacroCard
        value={fats.remaining}
        label="Fats"
        icon="water-outline"
        color="#007AFF"
        total={fats.total}
        isNegative={fats.remaining < 0}
        isEmpty={fats.total === 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 150,
  },
  macroCardContent: {
    padding: 16,
    height: '100%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    height: 24,
  },
  macroLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    width: '100%',
    height: 18,
  },
  macroProgress: {
    alignItems: "center",
    marginTop: 'auto',
  },
  circleIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  negativeValue: {
    color: '#FF6B6B',
  },
  shimmerValue: {
    borderRadius: 8,
  },
  shimmerLabel: {
    borderRadius: 4,
  },
  shimmerCircle: {
    borderRadius: 30,
  },
}); 