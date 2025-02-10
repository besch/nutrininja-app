import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface WorkoutFrequencyStepProps {
  value: string;
  onChange: (value: string) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function WorkoutFrequencyStep({
  value,
  onChange,
  onBack,
  onNext,
}: WorkoutFrequencyStepProps) {
  const options = [
    { label: "0-2 workouts per week", value: "0-2" },
    { label: "3-4 workouts per week", value: "3-4" },
    { label: "5+ workouts per week", value: "5+" },
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={commonStyles.progressBar}>
            <View style={[commonStyles.progressFill, { width: "24%" }]} />
          </View>
        </View>

        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>Workout Frequency</Text>
          <Text style={commonStyles.subtitle}>
            How many workouts per week do you plan to do?
          </Text>

          <View style={commonStyles.optionsContainer}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  commonStyles.optionButton,
                  value === option.value && commonStyles.optionButtonSelected,
                ]}
                onPress={() => onChange(option.value)}
              >
                <Text
                  style={[
                    commonStyles.optionText,
                    value === option.value && commonStyles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
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

export default WorkoutFrequencyStep;
