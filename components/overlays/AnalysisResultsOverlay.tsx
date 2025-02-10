import React from "react";
import { View } from "react-native";
import { Text } from "@rneui/themed";
import BaseOverlay from "./BaseOverlay";
import type { Meal } from "@/types";
import { overlayStyles } from "./styles";

interface AnalysisResultsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  currentMeal?: Meal;
  newAnalysis?: Partial<Meal>;
}

export default function AnalysisResultsOverlay({
  isVisible,
  onClose,
  onConfirm,
  isLoading = false,
  currentMeal,
  newAnalysis,
}: AnalysisResultsOverlayProps) {
  if (!currentMeal || !newAnalysis) return null;

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
      title="New Analysis Results"
      isLoading={isLoading}
    >
      <Text style={overlayStyles.description}>
        We've analyzed your meal again. Would you like to update to these new values?
      </Text>

      <View style={overlayStyles.comparisons}>
        <MacroComparison
          label="Calories"
          current={currentMeal.calories}
          new={newAnalysis.calories || 0}
        />
        <MacroComparison
          label="Protein"
          current={currentMeal.proteins}
          new={newAnalysis.proteins || 0}
          unit="g"
        />
        <MacroComparison
          label="Carbs"
          current={currentMeal.carbs}
          new={newAnalysis.carbs || 0}
          unit="g"
        />
        <MacroComparison
          label="Fats"
          current={currentMeal.fats}
          new={newAnalysis.fats || 0}
          unit="g"
        />
      </View>
    </BaseOverlay>
  );
} 