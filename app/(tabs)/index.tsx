import React, { useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import moment, { Moment } from "moment";
import { AddFoodOverlay } from "@/components/AddFoodOverlay";
import { api } from "@/utils/api";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCameraPermissions } from "expo-camera";
import { useSelector, useDispatch } from "react-redux";
import { selectIsMetric } from "@/store/userSlice";
import { selectPendingMeals } from '@/store/analysisSlice';
import { useSelectedDate, setSelectedDate } from '@/store/userSlice';
import type { Meal } from "@/types";
import {
  Header,
  CalendarStrip,
  CaloriesSummary,
  MacrosSummary,
  RecentMeals
} from '@/components/home';
import { checkAndRequestRating } from '@/utils/rating';

export default function HomeScreen() {
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [minDate, setMinDate] = useState(moment().subtract(10, "days"));
  const [maxDate, setMaxDate] = useState(moment().add(10, "days"));
  const isMetric = useSelector(selectIsMetric);
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const pendingMeals = useSelector(selectPendingMeals);
  const selectedDate = useSelectedDate();

  const dateStr = useMemo(() => selectedDate.format('YYYY-MM-DD'), [selectedDate]);

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ['meals', dateStr],
    queryFn: () => api.meals.getMealsByDate(dateStr),
    refetchInterval: (query) => {
      const data = query.state.data as Meal[] | undefined;
      return data?.some(meal => meal.analysis_status === 'pending') ? 2000 : false;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const { data: weightData } = useQuery({
    queryKey: ['weight', dateStr],
    queryFn: () => api.weight.getByDate(dateStr),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const calculateDailyTotals = useCallback((mealsData: Meal[]) => {
    return mealsData
      .filter(meal => meal.analysis_status === 'completed')
      .reduce((acc, meal) => ({
        calories: acc.calories + meal.calories,
        proteins: acc.proteins + meal.proteins,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }), {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      });
  }, []);

  const dailyTotals = useMemo(() => calculateDailyTotals(meals), [meals, calculateDailyTotals]);

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', dateStr, dailyTotals],
    queryFn: async () => {
      const progressResponse = await api.user.getDailyProgress();
      if (!progressResponse || !progressResponse.goals) {
        throw new Error('Invalid progress response');
      }

      return {
        ...progressResponse,
        progress: {
          remainingCalories: (progressResponse.goals.dailyCalorieGoal || 0) - dailyTotals.calories,
          remainingProteins: (progressResponse.goals.proteinGoal || 0) - dailyTotals.proteins,
          remainingCarbs: (progressResponse.goals.carbsGoal || 0) - dailyTotals.carbs,
          remainingFats: (progressResponse.goals.fatsGoal || 0) - dailyTotals.fats,
          totalCalories: dailyTotals.calories,
          totalProteins: dailyTotals.proteins,
          totalCarbs: dailyTotals.carbs,
          totalFats: dailyTotals.fats,
        }
      };
    },
    enabled: !mealsLoading,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const summaryProps = useMemo(() => ({
    isLoading: mealsLoading,
    remainingCalories: progressData?.progress?.remainingCalories,
    totalCalories: progressData?.progress?.totalCalories
  }), [mealsLoading, progressData?.progress?.remainingCalories, progressData?.progress?.totalCalories]);

  const macroProps = useMemo(() => ({
    isLoading: mealsLoading,
    proteins: {
      remaining: progressData?.progress?.remainingProteins || 0,
      total: progressData?.progress?.totalProteins || 0
    },
    carbs: {
      remaining: progressData?.progress?.remainingCarbs || 0,
      total: progressData?.progress?.totalCarbs || 0
    },
    fats: {
      remaining: progressData?.progress?.remainingFats || 0,
      total: progressData?.progress?.totalFats || 0
    }
  }), [
    mealsLoading,
    progressData?.progress?.remainingProteins,
    progressData?.progress?.totalProteins,
    progressData?.progress?.remainingCarbs,
    progressData?.progress?.totalCarbs,
    progressData?.progress?.remainingFats,
    progressData?.progress?.totalFats
  ]);

  const handleDateSelected = useCallback((date: Moment) => {
    dispatch(setSelectedDate(date.format('YYYY-MM-DD')));
  }, [dispatch]);

  const handleCalendarEndReached = useCallback((end: 'left' | 'right') => {
    if (end === 'left') {
      setMinDate(prev => prev.clone().subtract(10, "days"));
    } else {
      setMaxDate(prev => prev.clone().add(10, "days"));
    }
  }, []);

  const handleAddMeal = useCallback(async () => {
    await requestPermission();

    router.push({
      pathname: "/main/camera",
      params: { selectedDate: selectedDate.format('YYYY-MM-DD') }
    });
  }, [router, selectedDate, permission, requestPermission]);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleWeightCheckin = useCallback(async (weight: number) => {
    // Convert from lbs to kg if using imperial
    const weightInKg = isMetric ? weight : weight / 2.20462;
    await api.weight.checkIn(Number(weightInKg.toFixed(1)), selectedDate.format('YYYY-MM-DD'));
    queryClient.invalidateQueries({ queryKey: ['weight', selectedDate.format('YYYY-MM-DD')] });
  }, [selectedDate, queryClient, isMetric]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['meals', dateStr] }),
      queryClient.invalidateQueries({ queryKey: ['weight', dateStr] }),
      queryClient.invalidateQueries({ queryKey: ['progress'] }),
    ]);
    setRefreshing(false);
  }, [queryClient, dateStr]);

  const handleMealPress = useCallback((id: string) => {
    router.push({
      pathname: "/main/food-details",
      params: { id }
    });
  }, [router]);

  // Add effect to check for completed analyses and trigger rating
  useEffect(() => {
    if (!mealsLoading && meals.length > 0) {
      const hasCompletedAnalyses = meals.some((meal: Meal) => 
        meal.analysis_status === 'completed' && 
        meal.created_at && 
        moment(meal.created_at).isAfter(moment().subtract(5, 'minutes'))
      );

      if (hasCompletedAnalyses) {
        checkAndRequestRating();
      }
    }
  }, [meals, mealsLoading]);

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <Header />

        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelected={handleDateSelected}
          minDate={minDate}
          maxDate={maxDate}
          onCalendarEndReached={handleCalendarEndReached}
          dailyCalorieGoal={progressData?.goals?.dailyCalorieGoal}
        />

        <CaloriesSummary {...summaryProps} />

        <MacrosSummary {...macroProps} />

        <RecentMeals
          meals={meals}
          isLoading={mealsLoading}
          pendingMeals={pendingMeals}
          onMealPress={handleMealPress}
        />
      </ScrollView>

      <AddFoodOverlay visible={showMenu} onClose={handleCloseMenu} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
