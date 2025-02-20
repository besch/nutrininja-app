import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, setUserData } from "@/store/userSlice";
import { api } from "@/utils/api";
import NumericInputOverlay from "@/components/overlays/NumericInputOverlay";
import GoalsAnalysisOverlay from "@/components/overlays/GoalsAnalysisOverlay";
import { AppDispatch } from "@/store";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { trackNutritionGoalSet } from '@/utils/appsFlyerEvents';

type GoalType = "daily_calorie_goal" | "protein_goal" | "carbs_goal" | "fats_goal";

interface Goal {
  type: GoalType;
  name: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  progress: number;
  unit: string;
}

export default function AdjustGoalsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const [editingGoal, setEditingGoal] = useState<GoalType | null>(null);
  const [showGeneratedGoals, setShowGeneratedGoals] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState<any>(null);

  const goals: Goal[] = [
    {
      type: "daily_calorie_goal",
      name: "Calorie goal",
      value: user.daily_calorie_goal || 2100,
      icon: "flame-outline",
      color: "#000000",
      progress: 0.7,
      unit: "kcal"
    },
    {
      type: "protein_goal",
      name: "Protein goal",
      value: user.protein_goal || 205,
      icon: "flash-outline",
      color: "#FF3B30",
      progress: 0.6,
      unit: "g"
    },
    {
      type: "carbs_goal",
      name: "Carb goal",
      value: user.carbs_goal || 188,
      icon: "leaf-outline",
      color: "#FF9500",
      progress: 0.45,
      unit: "g"
    },
    {
      type: "fats_goal",
      name: "Fat goal",
      value: user.fats_goal || 58,
      icon: "water-outline",
      color: "#007AFF",
      progress: 0.3,
      unit: "g"
    },
  ];

  const updateGoalMutation = useMutation({
    mutationFn: async (updates: any) => {
      const updatedData = await api.user.updateProfile(updates);
      return updatedData;
    },
    onSuccess: (updatedData) => {
      dispatch(setUserData(updatedData));
      setEditingGoal(null);
      // Track nutrition goal updates
      trackNutritionGoalSet({
        daily_calorie_goal: updatedData.daily_calorie_goal,
        protein_goal: updatedData.protein_goal,
        carbs_goal: updatedData.carbs_goal,
        fats_goal: updatedData.fats_goal,
      });
    },
  });

  const generateGoalsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.workout.generatePlan({
        birth_date: user.birth_date,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        target_weight: user.target_weight,
        goal: user.goal,
        workout_frequency: user.workout_frequency,
        diet: user.diet,
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedGoals(data);
      setShowGeneratedGoals(true);
    },
  });

  const handleGoalChange = async (value: number) => {
    if (!editingGoal) return;
    const updates = { [editingGoal]: value };
    updateGoalMutation.mutate(updates);
  };

  const handleConfirmGeneratedGoals = async () => {
    if (!generatedGoals?.daily_recommendation) return;

    const updates = {
      daily_calorie_goal: generatedGoals.daily_recommendation.calories,
      protein_goal: generatedGoals.daily_recommendation.macros.protein.value,
      carbs_goal: generatedGoals.daily_recommendation.macros.carbs.value,
      fats_goal: generatedGoals.daily_recommendation.macros.fats.value,
    };

    updateGoalMutation.mutate(updates);
    setShowGeneratedGoals(false);
    setGeneratedGoals(null);
  };

  const currentGoal = editingGoal ? goals.find(g => g.type === editingGoal) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adjust Goals</Text>
      </View>
      <ScrollView style={styles.content}>
        {goals.map((goal) => (
          <TouchableOpacity 
            key={goal.type} 
            style={styles.goalCard}
            onPress={() => setEditingGoal(goal.type)}
          >
            <View style={styles.progressContainer}>
              <Progress.Circle
                size={60}
                progress={goal.progress}
                thickness={7}
                color={goal.color}
                unfilledColor="#E5E5EA"
                borderWidth={0}
                strokeCap="round"
                animated
              />
              <View
                style={[styles.iconContainer, { backgroundColor: goal.color }]}
              >
                <Ionicons name={goal.icon} size={20} color="#FFF" />
              </View>
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>{goal.name}</Text>
              <Text style={styles.goalValue}>{goal.value} {goal.unit}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Button
          title="Auto Generate Goals"
          variant="outline"
          onPress={() => generateGoalsMutation.mutate()}
          loading={generateGoalsMutation.isPending}
          disabled={generateGoalsMutation.isPending}
          style={[styles.autoGenerateButton, {
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#000",
            borderRadius: 25,
            paddingVertical: 12,
            elevation: 0,
            shadowColor: "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
          }]}
          textStyle={[styles.autoGenerateButtonText, {
            color: "#000",
          }]}
        />
      </ScrollView>

      {currentGoal && (
        <NumericInputOverlay
          isVisible={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={handleGoalChange}
          title={`Update ${currentGoal.name}`}
          initialValue={currentGoal.value}
          unit={currentGoal.unit}
        />
      )}

      <GoalsAnalysisOverlay
        isVisible={showGeneratedGoals}
        onClose={() => {
          setShowGeneratedGoals(false);
          setGeneratedGoals(null);
        }}
        onConfirm={handleConfirmGeneratedGoals}
        isLoading={updateGoalMutation.isPending}
        currentGoals={{
          daily_calorie_goal: user.daily_calorie_goal || 0,
          protein_goal: user.protein_goal || 0,
          carbs_goal: user.carbs_goal || 0,
          fats_goal: user.fats_goal || 0,
        }}
        newGoals={generatedGoals}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    marginTop: 20,
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  progressContainer: {
    position: "relative",
    width: 60,
    height: 60,
    marginRight: 14,
  },
  iconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 2,
  },
  goalValue: {
    fontSize: 26,
    fontWeight: "bold",
  },
  autoGenerateButton: {
    marginTop: 20,
    marginBottom: 32,
  },
  autoGenerateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
