import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl } from "react-native";
import { Text, Card } from "@rneui/themed";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { api } from "@/utils/api";
import type { WeightCheckin, Meal } from "@/types";
import { useSelector, useDispatch } from "react-redux";
import { selectIsMetric, selectIsLoading, setUnitPreference, setUserData, fetchUserData } from "@/store/userSlice";
import moment from "moment";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import NumericInputOverlay from "@/components/overlays/NumericInputOverlay";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AppDispatch } from "@/store";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get("window").width;

type TimePeriod = '90 Days' | '6 Months' | '1 Year' | 'All time';
type NutritionPeriod = 'This Week' | 'Last Week' | '2 wks. ago' | '3 wks. ago';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

type TimePeriodSelectorProps<T extends string> = {
  periods: T[];
  selected: T;
  onSelect: (period: T) => void;
};

const TimePeriodSelector = <T extends string>({ periods, selected, onSelect }: TimePeriodSelectorProps<T>) => (
  <View style={styles.periodSelector}>
    {periods.map((period) => (
      <TouchableOpacity
        key={period}
        style={[
          styles.periodButton,
          selected === period && styles.selectedPeriod
        ]}
        onPress={() => onSelect(period)}
      >
        <Text style={[
          styles.periodText,
          selected === period && styles.selectedPeriodText
        ]}>
          {period}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const LoadingWeightCard = () => (
  <View style={styles.goalCard}>
    <View>
      <Text style={styles.label}>Goal Weight</Text>
      <View style={{ height: 41 }}>
        <ShimmerPlaceholder style={[styles.shimmerValue, { width: 120, height: 41 }]} />
      </View>
    </View>
    <Button
      title="Update"
      variant="primary"
      style={styles.changeGoalButton}
      textStyle={styles.changeGoalButtonText}
      disabled={true}
      onPress={() => {}}
    />
  </View>
);

const LoadingCurrentWeight = () => (
  <View style={styles.currentWeight}>
    <View style={styles.weightCard}>
      <View style={styles.weightIconContainer}>
        <View style={styles.weightIcon}>
          <Text style={styles.weightIconText}>🏋️</Text>
        </View>
      </View>
      <View style={styles.weightContent}>
        <Text style={styles.label}>Current Weight</Text>
        <View style={{ height: 41 }}>
          <ShimmerPlaceholder style={[styles.shimmerValue, { width: 120, height: 41 }]} />
        </View>
        <Text style={styles.hint}>
          Remember to update this at least once a week so we can adjust your plan to hit your goal
        </Text>
      </View>
    </View>
    <TouchableOpacity 
      style={[styles.updateWeightButton, { opacity: 0.5 }]}
      disabled={true}
    >
      <Text style={styles.updateWeightButtonText}>Update your weight</Text>
    </TouchableOpacity>
  </View>
);

const LoadingProgressSection = () => (
  <View style={styles.progressSection}>
    <Text style={styles.label}>Goal Progress</Text>
    <View style={styles.progressRow}>
      <View style={{ height: 34 }}>
        <ShimmerPlaceholder style={[styles.shimmerValue, { width: 80, height: 34 }]} />
      </View>
      <View style={{ height: 20 }}>
        <ShimmerPlaceholder style={[styles.shimmerStatus, { width: 120, height: 20 }]} />
      </View>
    </View>
  </View>
);

const LoadingChartSection = () => (
  <View style={styles.chartContainer}>
    <ShimmerPlaceholder style={styles.shimmerChart} width={screenWidth - 80} height={220} />
  </View>
);

const LoadingNutritionSection = () => (
  <View>
    <View style={styles.nutritionHeader}>
      <Text style={styles.label}>Nutrition</Text>
      <View style={styles.nutritionProgress}>
        <View style={{ height: 24 }}>
          <ShimmerPlaceholder style={[styles.shimmerValue, { width: 60, height: 24 }]} />
        </View>
        <Text style={styles.progressLabel}>This week vs previous week</Text>
      </View>
    </View>

    <TimePeriodSelector<NutritionPeriod>
      periods={['This Week', 'Last Week', '2 wks. ago', '3 wks. ago']}
      selected={'This Week'}
      onSelect={() => {}}
    />

    <View style={styles.macroDistribution}>
      {['Protein', 'Carbs', 'Fats'].map((label, index) => (
        <View key={index} style={styles.macroItem}>
          <View style={{ height: 30 }}>
            <ShimmerPlaceholder style={[styles.shimmerPercentage, { width: 40, height: 30 }]} />
          </View>
          <Text style={styles.macroLabel}>{label}</Text>
          <View style={{ height: 18 }}>
            <ShimmerPlaceholder style={[styles.shimmerValue, { width: 40, height: 18 }]} />
          </View>
        </View>
      ))}
    </View>

    <View style={styles.chartContainer}>
      <View style={{ height: 220 }}>
        <ShimmerPlaceholder style={[styles.shimmerChart, { width: screenWidth - 80, height: 220 }]} />
      </View>
    </View>

    <View style={styles.caloriesSummary}>
      <View>
        <View style={{ height: 34 }}>
          <ShimmerPlaceholder style={[styles.shimmerValue, { width: 80, height: 34 }]} />
        </View>
        <Text style={styles.label}>Total calories</Text>
      </View>
      <View>
        <View style={{ height: 34 }}>
          <ShimmerPlaceholder style={[styles.shimmerValue, { width: 80, height: 34 }]} />
        </View>
        <Text style={styles.label}>Daily avg.</Text>
      </View>
    </View>
  </View>
);

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('90 Days');
  const [selectedNutritionPeriod, setSelectedNutritionPeriod] = useState<NutritionPeriod>('This Week');
  const [showWeightGoalOverlay, setShowWeightGoalOverlay] = useState(false);
  const [showWeightOverlay, setShowWeightOverlay] = useState(false);
  const isMetric = useSelector(selectIsMetric);
  const isLoading = useSelector(selectIsLoading);
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user data with React Query
  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const data = await api.user.getProfile();
      dispatch(setUserData(data)); // Keep Redux in sync
      return data;
    },
    staleTime: 0
  });

  // Get days to fetch based on selected period
  const getDaysToFetch = () => {
    switch (selectedPeriod) {
      case '90 Days':
        return 90;
      case '6 Months':
        return 180;
      case '1 Year':
        return 365;
      case 'All time':
        return 1000;
      default:
        return 90;
    }
  };

  // Fetch weight history
  const { data: weightData, isLoading: isLoadingWeight } = useQuery({
    queryKey: ['weight-history', selectedPeriod],
    queryFn: async () => {
      const response = await api.weight.getHistory(getDaysToFetch());
      return response;
    },
    staleTime: 0
  });

  const convertWeight = (kg: number) => {
    return isMetric ? Math.round(kg) : Math.round(kg * 2.20462);
  };

  const formatWeight = (kg: number) => {
    const weight = convertWeight(kg);
    return `${weight}${isMetric ? ' kg' : ' lbs'}`;
  };

  // Get start date for nutrition data based on selected period
  const getStartDateForNutrition = () => {
    const now = moment();
    switch (selectedNutritionPeriod) {
      case 'This Week':
        return now.startOf('week');
      case 'Last Week':
        return now.subtract(1, 'week').startOf('week');
      case '2 wks. ago':
        return now.subtract(2, 'weeks').startOf('week');
      case '3 wks. ago':
        return now.subtract(3, 'weeks').startOf('week');
      default:
        return now.startOf('week');
    }
  };

  // Fetch weekly meals data
  const startOfWeek = getStartDateForNutrition();
  const weekDates = Array.from({ length: 7 }, (_, i) => 
    moment(startOfWeek).add(i, 'days').format('YYYY-MM-DD')
  );

  const { data: weeklyMeals = [], isLoading: isLoadingMeals } = useQuery({
    queryKey: ['meals-week', selectedNutritionPeriod],
    queryFn: async () => {
      const mealsPromises = weekDates.map(date => api.meals.getMealsByDate(date));
      const mealsData = await Promise.all(mealsPromises);
      return mealsData;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Ensure we have valid data for charts
  const weightHistory = weightData?.history || [];
  const hasWeightData = weightHistory.length > 0;

  // Calculate daily macros data
  const dailyMacrosData = weekDates.map((date, index) => {
    const dayMeals = weeklyMeals[index] || [];
    if (!Array.isArray(dayMeals)) return { proteins: 0, carbs: 0, fats: 0 };

    return dayMeals.reduce((total: any, meal: Meal) => {
      if (!meal) return total;
      return {
        proteins: total.proteins + (meal.proteins || 0),
        carbs: total.carbs + (meal.carbs || 0),
        fats: total.fats + (meal.fats || 0),
      };
    }, { proteins: 0, carbs: 0, fats: 0 });
  });

  // Calculate calories from macros
  const calculateCaloriesFromMacros = (macros: { proteins: number, carbs: number, fats: number }) => {
    return (macros.proteins * 4) + (macros.carbs * 4) + (macros.fats * 9);
  };

  const dailyCalories = dailyMacrosData.map(macros => calculateCaloriesFromMacros(macros));
  const totalCalories = dailyCalories.reduce((sum, cal) => sum + cal, 0);
  const avgCalories = dailyCalories.length > 0 ? totalCalories / dailyCalories.length : 0;

  // Calculate week-over-week change
  const previousWeekTotal = weeklyMeals
    .slice(0, 7)
    .reduce((total, dayMeals) => {
      if (!Array.isArray(dayMeals)) return total;
      return total + dayMeals.reduce((dayTotal: number, meal: Meal) => 
        dayTotal + (meal?.calories || 0), 0);
    }, 0);

  const weekOverWeekChange = previousWeekTotal > 0 
    ? ((totalCalories - previousWeekTotal) / previousWeekTotal * 100).toFixed(0)
    : '0';

  const macrosChartData = {
    labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    datasets: [
      {
        data: dailyMacrosData.map(d => d.proteins),
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Red for proteins
        strokeWidth: 2,
      },
      {
        data: dailyMacrosData.map(d => d.carbs),
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`, // Blue for carbs
        strokeWidth: 2,
      },
      {
        data: dailyMacrosData.map(d => d.fats),
        color: (opacity = 1) => `rgba(255, 206, 86, ${opacity})`, // Yellow for fats
        strokeWidth: 2,
      },
    ],
  };

  // Calculate macronutrient totals and percentages
  const calculateMacros = (meals: any[]) => {
    const totals = meals.reduce((acc, dayMeals) => {
      if (!Array.isArray(dayMeals)) return acc;
      
      const dayTotals = dayMeals.reduce((dayAcc: any, meal: Meal) => {
        if (!meal) return dayAcc;
        return {
          proteins: dayAcc.proteins + (meal.proteins || 0),
          carbs: dayAcc.carbs + (meal.carbs || 0),
          fats: dayAcc.fats + (meal.fats || 0),
        };
      }, { proteins: 0, carbs: 0, fats: 0 });

      return {
        proteins: acc.proteins + dayTotals.proteins,
        carbs: acc.carbs + dayTotals.carbs,
        fats: acc.fats + dayTotals.fats,
      };
    }, { proteins: 0, carbs: 0, fats: 0 });

    const total = totals.proteins + totals.carbs + totals.fats;
    
    return {
      totals,
      percentages: total > 0 ? {
        proteins: Math.round((totals.proteins / total) * 100),
        carbs: Math.round((totals.carbs / total) * 100),
        fats: Math.round((totals.fats / total) * 100),
      } : { proteins: 0, carbs: 0, fats: 0 }
    };
  };

  const macros = calculateMacros(weeklyMeals);

  const calculateProgress = () => {
    if (!userData?.weight || !userData?.target_weight) return 0;
    
    // If current weight equals target, we're at 100%
    if (userData.weight === userData.target_weight) return 100;
    
    // Get the starting weight from weight history, or use current weight if no history
    const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : userData.weight;
    const totalChangeNeeded = Math.abs(startWeight - userData.target_weight);
    
    // Calculate how much progress we've made
    const progressMade = Math.abs(startWeight - userData.weight);
    
    // Calculate percentage, capped at 100
    const percentage = Math.min((progressMade / totalChangeNeeded) * 100, 100);
    
    return percentage.toFixed(1);
  };

  const getGoalStatus = () => {
    if (!userData?.weight || !userData?.target_weight) return '';
    
    const difference = Math.abs(userData.weight - userData.target_weight);
    if (difference <= 0.5) return 'Goal achieved';
    
    return userData.weight > userData.target_weight ? 'Weight loss needed' : 'Weight gain needed';
  };

  const regenerateWorkoutPlanMutation = useMutation({
    mutationFn: async (userData: any) => {
      // Generate new workout plan
      const workoutPlan = await api.workout.generatePlan(userData);
      
      // Update user data with new workout plan and goals
      const finalData = await api.user.updateProfile({
        user_id: userData?.id,
        workout_plan: workoutPlan,
        daily_calorie_goal: workoutPlan.daily_recommendation.calories,
        protein_goal: workoutPlan.daily_recommendation.macros.protein.value,
        carbs_goal: workoutPlan.daily_recommendation.macros.carbs.value,
        fats_goal: workoutPlan.daily_recommendation.macros.fats.value,
      });

      return finalData;
    },
    onSuccess: (updatedData) => {
      dispatch(setUserData(updatedData));
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['daily-progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const handleWeightGoalUpdate = async (newGoal: number) => {
    setIsUpdating(true);
    try {
      const weightInKg = isMetric ? newGoal : newGoal / 2.20462;
      
      // Update profile with the new goal weight
      await api.user.updateProfile({ target_weight: weightInKg });
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['weight-history'] });
      
      setShowWeightGoalOverlay(false);

      // Regenerate workout plan in the background
      regenerateWorkoutPlanMutation.mutate({
        birth_date: userData?.birth_date,
        gender: userData?.gender,
        height: userData?.height,
        weight: userData?.weight,
        target_weight: weightInKg,
        goal: userData?.goal,
        workout_frequency: userData?.workout_frequency,
        diet: userData?.diet,
        pace: userData?.pace,
      });
    } catch (error) {
      console.error('Error updating weight goal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate all queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['weight-history'] }),
        queryClient.invalidateQueries({ queryKey: ['meals'] })
      ]);

      // Refetch all queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['user-profile'] }),
        queryClient.refetchQueries({ queryKey: ['weight-history'] }),
        queryClient.refetchQueries({ queryKey: ['meals'] })
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const handleUnitChange = async (value: boolean) => {
    try {
      await dispatch(setUnitPreference(value)).unwrap();
    } catch (error) {
      console.error('Error updating unit preference:', error);
    }
  };

  const handleWeightCheckin = async (weight: number) => {
    setIsUpdating(true);
    try {
      const weightInKg = isMetric ? weight : weight / 2.20462;
      
      // First create a weight check-in
      await api.weight.checkIn(Number(weightInKg.toFixed(1)), moment().format('YYYY-MM-DD'));
      
      // Then update the profile
      await api.user.updateProfile({ weight: weightInKg });
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['weight-history'] });
      
      setShowWeightOverlay(false);

      // Regenerate workout plan in the background
      regenerateWorkoutPlanMutation.mutate({
        birth_date: userData?.birth_date,
        gender: userData?.gender,
        height: userData?.height,
        weight: weightInKg,
        target_weight: userData?.target_weight,
        goal: userData?.goal,
        workout_frequency: userData?.workout_frequency,
        diet: userData?.diet,
        pace: userData?.pace,
      });
    } catch (error) {
      console.error('Error checking in weight:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Use userData instead of user from Redux
  const user = userData || {};

  if (isLoading || isLoadingWeight || isLoadingMeals) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading || isUpdating}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <Text h3 style={styles.title}>Analytics</Text>
        
        <Card containerStyle={styles.card}>
          <LoadingWeightCard />
          <LoadingCurrentWeight />
          <LoadingProgressSection />
          <TimePeriodSelector<TimePeriod>
            periods={['90 Days', '6 Months', '1 Year', 'All time']}
            selected={'90 Days'}
            onSelect={() => {}}
          />
          <View style={styles.chartContainer}>
            <ShimmerPlaceholder style={[styles.shimmerChart, { width: screenWidth - 80, height: 220 }]} />
          </View>
        </Card>

        <Card containerStyle={styles.card}>
          <LoadingNutritionSection />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || isLoading || isUpdating}
          onRefresh={onRefresh}
          tintColor="#000"
        />
      }
    >
      <Text h3 style={styles.title}>
        Analytics
      </Text>
      
      {/* Weight Goal Section */}
      <Card containerStyle={styles.card}>
        <View style={styles.goalCard}>
          <View>
            <Text style={styles.label}>Goal Weight</Text>
            <Text h3>{user.target_weight ? formatWeight(user.target_weight) : '--'}</Text>
          </View>
          <Button
            title="Update"
            variant="primary"
            style={styles.changeGoalButton}
            textStyle={styles.changeGoalButtonText}
            onPress={() => setShowWeightGoalOverlay(true)}
          />
        </View>

        {/* Current Weight Section */}
        <View style={styles.currentWeight}>
          <View style={styles.weightCard}>
            <View style={styles.weightIconContainer}>
              <View style={styles.weightIcon}>
                <Text style={styles.weightIconText}>🏋️</Text>
              </View>
            </View>
            <View style={styles.weightContent}>
              <Text style={styles.label}>Current Weight</Text>
              <Text h3>{user.weight ? formatWeight(user.weight) : '--'}</Text>
              <Text style={styles.hint}>
                Remember to update this at least once a week so we can adjust your plan to hit your goal
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.updateWeightButton}
            onPress={() => setShowWeightOverlay(true)}
          >
            <Text style={styles.updateWeightButtonText}>Update your weight</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.label}>Goal Progress</Text>
          <View style={styles.progressRow}>
            <Text h4>{calculateProgress()}%</Text>
            <Text style={styles.goalStatus}>{getGoalStatus()}</Text>
          </View>
        </View>

        <TimePeriodSelector<TimePeriod>
          periods={['90 Days', '6 Months', '1 Year', 'All time']}
          selected={selectedPeriod}
          onSelect={setSelectedPeriod}
        />

        <View style={styles.chartContainer}>
          {isLoadingWeight ? (
            <View style={styles.chartLoadingContainer}>
              <LoadingSpinner />
            </View>
          ) : hasWeightData ? (
            <LineChart
              width={screenWidth - 80}
              height={220}
              spacing={24}
              hideRules
              data={weightHistory.map((d: WeightCheckin) => ({
                value: convertWeight(d.weight),
                label: moment(d.check_in_date).format('D'),
                dataPointText: formatWeight(d.weight)
              }))}
              color="#2089DC"
              thickness={2}
              maxValue={Math.max(...weightHistory.map((d: WeightCheckin) => convertWeight(d.weight))) * 1.1}
              noOfSections={4}
              yAxisColor="#666"
              xAxisColor="#666"
              yAxisTextStyle={{ color: '#666', fontSize: 12 }}
              xAxisLabelTextStyle={{ color: '#666', fontSize: 12 }}
              yAxisThickness={1}
              xAxisThickness={1}
              dataPointsColor="#2089DC"
              dataPointsRadius={4}
              curved
              isAnimated
              initialSpacing={10}
              endSpacing={10}
              animationDuration={500}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No weight data available</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Nutrition Section */}
      <Card containerStyle={styles.card}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.label}>Nutrition</Text>
          <View style={styles.nutritionProgress}>
            <Text style={[
              styles.progressValue,
              { color: Number(weekOverWeekChange) >= 0 ? '#4CAF50' : '#f44336' }
            ]}>
              {weekOverWeekChange}%
            </Text>
            <Text style={styles.progressLabel}>This week vs previous week</Text>
          </View>
        </View>

        <TimePeriodSelector<NutritionPeriod>
          periods={['This Week', 'Last Week', '2 wks. ago', '3 wks. ago']}
          selected={selectedNutritionPeriod}
          onSelect={setSelectedNutritionPeriod}
        />

        {/* Macronutrient Distribution */}
        <View style={styles.macroDistribution}>
          <View style={styles.macroItem}>
            <Text style={styles.macroPercentage}>{macros.percentages.proteins}%</Text>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{Math.round(macros.totals.proteins)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroPercentage}>{macros.percentages.carbs}%</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{Math.round(macros.totals.carbs)}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroPercentage}>{macros.percentages.fats}%</Text>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>{Math.round(macros.totals.fats)}g</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {isLoadingMeals ? (
            <View style={styles.chartLoadingContainer}>
              <LoadingSpinner />
            </View>
          ) : (
            <>
              <BarChart
                width={screenWidth - 80}
                height={220}
                noOfSections={4}
                spacing={24}
                hideRules
                stackData={weekDates.map((date, index) => ({
                  label: moment(date).format('dd')[0],
                  stacks: [
                    {
                      value: dailyMacrosData[index].proteins * 4,
                      color: '#FF6B6B',
                      marginBottom: 2
                    },
                    {
                      value: dailyMacrosData[index].carbs * 4,
                      color: '#FFB86C',
                      marginBottom: 2
                    },
                    {
                      value: dailyMacrosData[index].fats * 9,
                      color: '#4ECDC4',
                      marginBottom: 2
                    }
                  ]
                }))}
                xAxisLabelTextStyle={{ color: '#666', fontSize: 12, textAlign: 'center', width: 30 }}
                yAxisTextStyle={{ color: '#666', fontSize: 12 }}
                maxValue={Math.max(...dailyCalories) * 1.2}
                isAnimated
                animationDuration={500}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisColor={'#666'}
                xAxisColor={'#666'}
                barBorderRadius={0}
                horizontal={false}
                initialSpacing={24}
                endSpacing={24}
              />
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.legendText}>Proteins</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FFB86C' }]} />
                  <Text style={styles.legendText}>Carbs</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
                  <Text style={styles.legendText}>Fats</Text>
                </View>
              </View>

              <View style={styles.caloriesSummary}>
                <View>
                  <Text h4>{Math.round(totalCalories)}</Text>
                  <Text style={styles.label}>Total calories</Text>
                </View>
                <View>
                  <Text h4>{Math.round(avgCalories)}</Text>
                  <Text style={styles.label}>Daily avg.</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Card>

      <NumericInputOverlay
        isVisible={showWeightGoalOverlay}
        onClose={() => setShowWeightGoalOverlay(false)}
        onSave={handleWeightGoalUpdate}
        title="Change Goal Weight"
        initialValue={user.target_weight || 0}
        unit={isMetric ? "kg" : "lbs"}
      />

      <NumericInputOverlay
        isVisible={showWeightOverlay}
        onClose={() => setShowWeightOverlay(false)}
        onSave={handleWeightCheckin}
        title="Weight Check-in"
        subtitle={moment().format('MMM D, YYYY')}
        initialValue={user.weight ? (isMetric ? user.weight : user.weight * 2.20462) : 0}
        unit={isMetric ? "kg" : "lbs"}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#000",
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  changeGoalButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeGoalButtonText: {
    fontSize: 14,
  },
  currentWeight: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
  },
  weightCard: {
    flexDirection: 'row',
    padding: 16,
  },
  weightIconContainer: {
    marginRight: 16,
  },
  weightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5D1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightIconText: {
    fontSize: 24,
  },
  weightContent: {
    flex: 1,
  },
  updateWeightButton: {
    backgroundColor: '#000',
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  updateWeightButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  progressSection: {
    marginVertical: 16,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalStatus: {
    color: "#666",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  nutritionProgress: {
    alignItems: "flex-end",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
  },
  caloriesSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  selectedPeriod: {
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  periodText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  selectedPeriodText: {
    color: '#000',
    fontWeight: '500',
  },
  macroDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2089DC',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  macroValue: {
    fontSize: 12,
    color: '#999',
  },
  chartLoadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  spinnerText: {
    color: '#2089DC',
    fontSize: 16,
    fontWeight: '500',
  },
  spinnerIndicator: {
    transform: [{ scale: 1.5 }],
    color: '#2089DC',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  spinnerContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#f3f3f3',
    borderTopColor: '#2089DC',
  },
  chartContainer: {
    minHeight: 220,
  },
  shimmerValue: {
    borderRadius: 4,
  },
  shimmerButton: {
    borderRadius: 20,
  },
  shimmerHint: {
    borderRadius: 4,
    marginTop: 4,
  },
  shimmerUpdateButton: {
    borderRadius: 16,
  },
  shimmerChart: {
    borderRadius: 8,
  },
  shimmerStatus: {
    borderRadius: 4,
  },
  shimmerPercentage: {
    borderRadius: 4,
  },
  shimmerLabel: {
    borderRadius: 4,
    marginVertical: 4,
  },
});
