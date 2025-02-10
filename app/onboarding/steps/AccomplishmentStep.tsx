import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons as MCIcon } from "@expo/vector-icons";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface AccomplishmentStepProps {
  value: string;
  onChange: (value: string) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function AccomplishmentStep({
  value,
  onChange,
  onBack,
  onNext,
}: AccomplishmentStepProps) {
  const goals = [
    {
      label: "Eat and live healthier",
      value: "health",
      icon: (selected: boolean) => (
        <MCIcon
          name="apple"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
    {
      label: "Boost my energy and mood",
      value: "energy",
      icon: (selected: boolean) => (
        <MCIcon
          name="weather-sunny"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
    {
      label: "Stay motivated and consistent",
      value: "motivation",
      icon: (selected: boolean) => (
        <MCIcon
          name="arm-flex"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
    {
      label: "Feel better about my body",
      value: "confidence",
      icon: (selected: boolean) => (
        <MCIcon
          name="account"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={commonStyles.progressBar}>
            <View style={[commonStyles.progressFill, { width: "54%" }]} />
          </View>
        </View>

        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>
            What would you like to{"\n"}accomplish?
          </Text>
          <Text style={commonStyles.subtitle}>
            Choose your primary goal
          </Text>

          <View style={commonStyles.optionsContainer}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.value}
                style={[
                  commonStyles.optionButton,
                  value === goal.value && commonStyles.optionButtonSelected,
                ]}
                onPress={() => onChange(goal.value)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {goal.icon(value === goal.value)}
                  <Text
                    style={[
                      commonStyles.optionText,
                      value === goal.value && commonStyles.optionTextSelected,
                    ]}
                  >
                    {goal.label}
                  </Text>
                </View>
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

export default AccomplishmentStep;
