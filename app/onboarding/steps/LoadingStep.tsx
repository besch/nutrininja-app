import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../styles";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, setUserData } from "@/store/userSlice";
import { api } from "@/utils/api";
import { AppDispatch } from "@/store";
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface LoadingStepProps {
  onComplete: () => void;
  isActive: boolean;
}

export function LoadingStep({ onComplete, isActive }: LoadingStepProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);

  const user_data = {
    gender: user.gender,
    height: user.height,
    weight: user.weight,
    target_weight: user.target_weight,
    goal: user.goal,
    workout_frequency: user.workout_frequency,
    accomplishment: user.accomplishment,
    birth_date: user.birth_date,
    pace: user.pace,
    diet: user.diet,
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => api.workout.generatePlan(user_data),
    onSuccess: (workoutPlan) => {
      const { daily_recommendation } = workoutPlan;
      if (daily_recommendation) {
        dispatch(setUserData({
          ...user,
          daily_calorie_goal: daily_recommendation.calories,
          protein_goal: Math.round(daily_recommendation.macros.protein.value),
          carbs_goal: Math.round(daily_recommendation.macros.carbs.value),
          fats_goal: Math.round(daily_recommendation.macros.fats.value),
          workout_plan: workoutPlan,
        }));
        onComplete();
      }
    },
  });

  React.useEffect(() => {
    if (isActive) {
      generatePlanMutation.mutate();
    }
  }, [isActive]);

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.progressBar}>
          <View style={[commonStyles.progressFill, { width: "92%" }]} />
        </View>
      </View>

      <View
        style={[
          commonStyles.content,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text
          style={[commonStyles.title, { textAlign: "center", lineHeight: 40 }]}
        >
          We're setting{"\n"}everything up for you
        </Text>

        <Text
          style={[
            commonStyles.subtitle,
            { textAlign: "center", marginBottom: 48 },
          ]}
        >
          Customizing health plan...
        </Text>

        {generatePlanMutation.isError ? (
          <>
            <Text style={[commonStyles.subtitle, { color: 'red', marginBottom: 24 }]}>
              Something went wrong. Please try again.
            </Text>
            <Button 
              title="Retry" 
              onPress={() => generatePlanMutation.mutate()}
              variant="primary"
            />
          </>
        ) : (
          <View style={{ marginTop: 24 }}>
            <LoadingSpinner />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default LoadingStep;
