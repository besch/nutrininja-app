import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface GoalStepProps {
  value: string;
  onChange: (value: "lose" | "maintain" | "gain") => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function GoalStep({ value, onChange, onBack, onNext }: GoalStepProps) {
  const goals = [
    { label: "Lose Weight", value: "lose" },
    { label: "Maintain", value: "maintain" },
    { label: "Gain Weight", value: "gain" },
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={commonStyles.progressBar}>
            <View style={[commonStyles.progressFill, { width: "48%" }]} />
          </View>
        </View>

        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>What is your goal?</Text>
          <Text style={commonStyles.subtitle}>
            This helps us generate a plan for your calorie intake.
          </Text>

          <View style={commonStyles.optionsContainer}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.value}
                style={[
                  commonStyles.optionButton,
                  value === goal.value && commonStyles.optionButtonSelected,
                ]}
                onPress={() =>
                  onChange(goal.value as "lose" | "maintain" | "gain")
                }
              >
                <Text
                  style={[
                    commonStyles.optionText,
                    value === goal.value && commonStyles.optionTextSelected,
                  ]}
                >
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity
            style={[
              buttonStyles.nextButton,
              !value && buttonStyles.nextButtonDisabled,
            ]}
            onPress={onNext}
            disabled={!value}
          >
            <Text
              style={[
                buttonStyles.nextButtonText,
                !value && buttonStyles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default GoalStep;
