import React, { useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import moment, { Moment } from "moment";
import { api } from "@/utils/api";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from "react-redux";
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
  const [refreshing, setRefreshing] = useState(false);
  const [minDate, setMinDate] = useState(moment().subtract(10, "days"));
  const [maxDate, setMaxDate] = useState(moment().add(10, "days"));
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: activitiesData = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', dateStr],
    queryFn: () => api.activities.getActivities(dateStr),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const burnedCalories = useMemo(() => {
    return activitiesData.reduce((total: number, activity: { calories_burned: number }) => 
      total + (activity.calories_burned || 0), 0);
  }, [activitiesData]);

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['progress', dateStr],
    queryFn: async () => {
      const progressResponse = await api.user.getDailyProgress(dateStr);
      if (!progressResponse || !progressResponse.goals) {
        throw new Error('Invalid progress response');
      }
      return progressResponse;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const summaryProps = useMemo(() => ({
    isLoading: mealsLoading || activitiesLoading,
    meals,
    burnedCalories,
    dailyCalorieGoal: progressData?.goals?.dailyCalorieGoal,
  }), [
    mealsLoading,
    activitiesLoading,
    meals,
    burnedCalories,
    progressData?.goals?.dailyCalorieGoal,
  ]);

  const macroProps = useMemo(() => ({
    isLoading: mealsLoading || activitiesLoading,
    meals,
    burnedCalories,
    proteinGoal: progressData?.goals?.proteinGoal,
    carbsGoal: progressData?.goals?.carbsGoal,
    fatsGoal: progressData?.goals?.fatsGoal,
  }), [
    mealsLoading,
    activitiesLoading,
    meals,
    burnedCalories,
    progressData?.goals?.proteinGoal,
    progressData?.goals?.carbsGoal,
    progressData?.goals?.fatsGoal,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['meals', dateStr] }),
      queryClient.invalidateQueries({ queryKey: ['activities', dateStr] }),
      queryClient.invalidateQueries({ queryKey: ['weight', dateStr] }),
      queryClient.invalidateQueries({ queryKey: ['progress', dateStr] }),
    ]);
    setRefreshing(false);
  }, [queryClient, dateStr]);

  const handleMealPress = useCallback((id: string) => {
    router.push({
      pathname: "/main/food-details",
      params: { id }
    });
  }, [router]);

  useEffect(() => {
    if (!mealsLoading && meals.length > 0) {
      const hasCompletedAnalysis = meals.some((meal: Meal) => 
        meal.analysis_status === 'completed'
      );

      if (hasCompletedAnalysis) {
        checkAndRequestRating();
      }
    }
  }, [meals, mealsLoading]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['activities', dateStr] });
    queryClient.invalidateQueries({ queryKey: ['progress', dateStr] });
  }, [dateStr, queryClient]);

  return (
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

      <MacrosSummary {...macroProps} key={dateStr} />

      <RecentMeals
        meals={meals}
        isLoading={mealsLoading}
        pendingMeals={pendingMeals}
        onMealPress={handleMealPress}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
