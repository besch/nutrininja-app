import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { useRouter } from 'expo-router';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface CaloriesSummaryProps {
  isLoading: boolean;
  remainingCalories?: number;
  totalCalories?: number;
  burnedCalories?: number;
}

export const CaloriesSummary: React.FC<CaloriesSummaryProps> = ({
  isLoading,
  remainingCalories = 0,
  totalCalories = 0,
  burnedCalories = 0,
}) => {
  const router = useRouter();

  // Show shimmer when loading or when all values are in initial state (0)
  const isInitialState = !isLoading && totalCalories === 0 && remainingCalories === 0;
  if (isLoading || isInitialState) {
    return (
      <View style={styles.mainCard}>
        <View style={styles.mainCardContent}>
          <View style={styles.caloriesContainer}>
            <ShimmerPlaceholder style={styles.shimmerCalories} width={120} height={40} />
            <ShimmerPlaceholder style={styles.shimmerLabel} width={80} height={20} />
            {burnedCalories > 0 && (
              <ShimmerPlaceholder style={styles.shimmerBurned} width={100} height={20} />
            )}
          </View>
          <View style={styles.circleProgress}>
            <ShimmerPlaceholder style={[styles.shimmerCircle]} width={60} height={60} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.mainCard}
      onPress={() => router.push('/main/calories-details')}
      activeOpacity={0.7}
    >
      <View style={styles.mainCardContent}>
        <View style={styles.caloriesContainer}>
          <Text style={[
            styles.caloriesText,
            remainingCalories < 0 && styles.negativeValue
          ]}>
            {Math.abs(remainingCalories)}
          </Text>
          <Text style={[
            styles.caloriesLabel,
            remainingCalories < 0 && styles.negativeValue
          ]}>
            {remainingCalories < 0 ? 'Calories over' : 'Calories left'}
          </Text>
          {burnedCalories > 0 && (
            <Text style={styles.burnedLabel}>
              {burnedCalories} kcal burned
            </Text>
          )}
        </View>
        <View style={styles.circleProgress}>
          {remainingCalories < 0 ? (
            <Progress.Circle
              size={60}
              progress={Math.min(1, totalCalories ? Math.abs(remainingCalories) / totalCalories : 0)}
              thickness={7}
              color="#FF6B6B"
              unfilledColor="#000"
              borderWidth={0}
              strokeCap="round"
              animated
            />
          ) : (
            <Progress.Circle
              size={60}
              progress={Math.min(1, totalCalories ? (totalCalories - remainingCalories) / totalCalories : 0)}
              thickness={7}
              color="#000"
              unfilledColor="#eee"
              borderWidth={0}
              animated
              strokeCap="round"
            />
          )}
          <View style={styles.circleIcon}>
            <Feather name="activity" size={24} color={remainingCalories < 0 ? "#FF6B6B" : "#000"} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    height: 100,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    height: '100%',
  },
  caloriesContainer: {
    flex: 1,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  caloriesLabel: {
    color: "#666",
    fontSize: 13,
  },
  burnedLabel: {
    color: "#4CAF50",
    fontSize: 13,
    marginTop: 4,
  },
  circleProgress: {
    position: "relative",
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
  shimmerCalories: {
    marginBottom: 8,
    borderRadius: 4,
  },
  shimmerLabel: {
    marginBottom: 4,
    borderRadius: 4,
  },
  shimmerBurned: {
    marginTop: 4,
    borderRadius: 4,
  },
  shimmerCircle: {
    borderRadius: 30,
  },
}); 