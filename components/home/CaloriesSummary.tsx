import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { useRouter } from 'expo-router';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import type { Meal } from '@/types';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface CaloriesSummaryProps {
  isLoading: boolean;
  meals: Meal[];
  burnedCalories: number;
  dailyCalorieGoal?: number;
}

export const CaloriesSummary: React.FC<CaloriesSummaryProps> = ({
  isLoading,
  meals,
  burnedCalories = 0,
  dailyCalorieGoal = 2000,
}) => {
  const router = useRouter();
  const pulseAnim = new Animated.Value(0);

  const { totalCalories, remainingCalories } = useMemo(() => {
    const total = meals
      .filter(meal => meal.analysis_status === 'completed')
      .reduce((acc, meal) => acc + meal.calories, 0);
    
    return {
      totalCalories: total,
      remainingCalories: dailyCalorieGoal - total + burnedCalories
    };
  }, [meals, dailyCalorieGoal, burnedCalories]);

  const shouldShowShimmer = isLoading;

  const progressValue = dailyCalorieGoal > 0 ? totalCalories / dailyCalorieGoal : 0;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (!shouldShowShimmer) {
      Animated.timing(progressAnim, {
        toValue: progressValue,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [progressValue, shouldShowShimmer]);

  if (shouldShowShimmer) {
    return (
      <View style={styles.container}>
        <Animated.View style={[
          styles.animatedBorder,
          {
            opacity: 0,
          },
        ]} />
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <View style={styles.caloriesContainer}>
              <ShimmerPlaceholder 
                style={[styles.caloriesText, styles.shimmerCalories]} 
                width={100}
              />
              <ShimmerPlaceholder 
                style={[styles.caloriesLabel, styles.shimmerLabel]} 
                width={70}
              />
              <ShimmerPlaceholder 
                style={[styles.burnedLabel, styles.shimmerBurned]} 
                width={90}
              />
            </View>
            <View style={styles.circleProgress}>
              <ShimmerPlaceholder 
                style={styles.shimmerCircle}
                width={60} 
                height={60}
                shimmerStyle={{ borderRadius: 30 }}
              />
              <View style={styles.circleIcon}>
                <ShimmerPlaceholder
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.animatedBorder,
        {
          opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0],
          }),
          transform: [{
            scale: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.03],
            }),
          }],
        },
      ]} />
      <TouchableOpacity 
        style={styles.mainCard}
        onPress={() => router.push('/main/calories-details')}
        activeOpacity={0.85}
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
              {totalCalories === 0 && !isLoading ? 'No meals logged' : (remainingCalories < 0 ? 'Calories over' : 'Calories left')}
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
                progress={Math.min(1, Math.abs(remainingCalories) / dailyCalorieGoal)}
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
                progress={Math.min(1, progressValue)}
                thickness={7}
                color="#000"
                unfilledColor="#eee"
                borderWidth={0}
                animated
                strokeCap="round"
              />
            )}
            <View style={styles.circleIcon}>
              <Ionicons 
                name="flame-outline" 
                size={20} 
                color="#FFF" 
                style={{ 
                  backgroundColor: remainingCalories < 0 ? "#FF6B6B" : "#000", 
                  padding: 4, 
                  borderRadius: 14 
                }} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 16,
  },
  animatedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
    zIndex: -1,
  },
  mainCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    height: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  caloriesContainer: {
    flex: 1,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
    height: 36,
  },
  caloriesLabel: {
    color: "#666",
    fontSize: 13,
    height: 16,
    marginBottom: 4,
  },
  burnedLabel: {
    color: "#4CAF50",
    fontSize: 13,
    height: 16,
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
    borderRadius: 8,
  },
  shimmerLabel: {
    borderRadius: 4,
  },
  shimmerBurned: {
    borderRadius: 4,
  },
  shimmerCircle: {
    borderRadius: 30,
  },
}); 