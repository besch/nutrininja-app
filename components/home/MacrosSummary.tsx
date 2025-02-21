import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface MacroData {
  remaining: number;
  total: number;
}

interface MacrosSummaryProps {
  isLoading: boolean;
  proteins?: MacroData;
  carbs?: MacroData;
  fats?: MacroData;
}

const LoadingMacroCard: React.FC = () => (
  <View style={styles.macroCard}>
    <View style={styles.macroCardContent}>
      <ShimmerPlaceholder style={styles.shimmerValue} width={80} height={24} />
      <ShimmerPlaceholder style={styles.shimmerLabel} width={60} height={18} />
      <View style={styles.macroProgress}>
        <ShimmerPlaceholder style={styles.shimmerCircle} width={60} height={60} />
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
}> = ({ value, label, icon, color, total, isNegative }) => {
  const goalValue = isNegative ? total : (total + value);
  const progressValue = isNegative 
    ? Math.min(1, total ? Math.abs(value) / total : 0)
    : Math.min(1, goalValue ? total / goalValue : 0);

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroCardContent}>
        <Text style={[styles.macroValue, isNegative && styles.negativeValue]}>
          {Math.abs(value)}g
        </Text>
        <Text 
          style={[styles.macroLabel, isNegative && styles.negativeValue]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isNegative ? `${label} over` : `${label} left`}
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
  proteins = { remaining: 0, total: 0 },
  carbs = { remaining: 0, total: 0 },
  fats = { remaining: 0, total: 0 },
}) => {
  // Show shimmer when loading or when all values are in initial state (0)
  const isInitialState = !isLoading && 
    proteins.remaining === 0 && proteins.total === 0 &&
    carbs.remaining === 0 && carbs.total === 0 &&
    fats.remaining === 0 && fats.total === 0;
  const shouldShowShimmer = isLoading || isInitialState;

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
      />
      <MacroCard
        value={carbs.remaining}
        label="Carbs"
        icon="leaf-outline"
        color="#FF9500"
        total={carbs.total}
        isNegative={carbs.remaining < 0}
      />
      <MacroCard
        value={fats.remaining}
        label="Fats"
        icon="water-outline"
        color="#007AFF"
        total={fats.total}
        isNegative={fats.remaining < 0}
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
  },
  macroLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    width: '100%',
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
    borderRadius: 4,
    marginBottom: 4,
  },
  shimmerLabel: {
    borderRadius: 4,
    marginBottom: 12,
  },
  shimmerCircle: {
    borderRadius: 30,
  },
}); 