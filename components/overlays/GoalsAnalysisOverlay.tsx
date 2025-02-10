import React from "react";
import { View } from "react-native";
import { Text } from "@rneui/themed";
import BaseOverlay from "./BaseOverlay";
import { overlayStyles } from "./styles";

interface GoalsAnalysisOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  currentGoals: {
    daily_calorie_goal: number;
    protein_goal: number;
    carbs_goal: number;
    fats_goal: number;
  };
  newGoals: {
    daily_recommendation: {
      calories: number;
      macros: {
        protein: { value: number; unit: string };
        carbs: { value: number; unit: string };
        fats: { value: number; unit: string };
      };
    };
  };
}

export default function GoalsAnalysisOverlay({
  isVisible,
  onClose,
  onConfirm,
  isLoading = false,
  currentGoals,
  newGoals,
}: GoalsAnalysisOverlayProps) {
  if (!currentGoals || !newGoals?.daily_recommendation) return null;

  const MacroComparison = ({ 
    label, 
    current, 
    new: newValue,
    unit = ""
  }: { 
    label: string; 
    current: number; 
    new: number;
    unit?: string;
  }) => (
    <View style={overlayStyles.macroRow}>
      <Text style={overlayStyles.macroLabel}>{label}</Text>
      <View style={overlayStyles.macroValues}>
        <Text style={overlayStyles.currentValue}>{current}{unit}</Text>
        <Text style={overlayStyles.arrow}>→</Text>
        <Text style={[
          overlayStyles.newValue,
          newValue > current ? overlayStyles.increase : newValue < current ? overlayStyles.decrease : null
        ]}>
          {newValue}{unit}
        </Text>
      </View>
    </View>
  );

  return (
    <BaseOverlay
      isVisible={isVisible}
      onClose={onClose}
      onSave={onConfirm}
      title="Generated Goals"
      isLoading={isLoading}
    >
      <Text style={overlayStyles.description}>
        We've generated new goals based on your profile. Would you like to update to these values?
      </Text>

      <View style={overlayStyles.comparisons}>
        <MacroComparison
          label="Calories"
          current={currentGoals.daily_calorie_goal}
          new={newGoals.daily_recommendation.calories}
        />
        <MacroComparison
          label="Protein"
          current={currentGoals.protein_goal}
          new={newGoals.daily_recommendation.macros.protein.value}
          unit="g"
        />
        <MacroComparison
          label="Carbs"
          current={currentGoals.carbs_goal}
          new={newGoals.daily_recommendation.macros.carbs.value}
          unit="g"
        />
        <MacroComparison
          label="Fats"
          current={currentGoals.fats_goal}
          new={newGoals.daily_recommendation.macros.fats.value}
          unit="g"
        />
      </View>
    </BaseOverlay>
  );
} 