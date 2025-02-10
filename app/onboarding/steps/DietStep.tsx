import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons as MCIcon } from "@expo/vector-icons";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface DietStepProps {
  value: string;
  onChange: (value: string) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function DietStep({ value, onChange, onBack, onNext }: DietStepProps) {
  const diets = [
    {
      label: "Classic",
      value: "classic",
      icon: (selected: boolean) => (
        <MCIcon
          name="food"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
    {
      label: "Pescatarian",
      value: "pescatarian",
      icon: (selected: boolean) => (
        <MCIcon
          name="fish"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
    {
      label: "Vegetarian",
      value: "vegetarian",
      icon: (selected: boolean) => (
        <MCIcon
          name="fruit-watermelon"
          size={24}
          color={selected ? "#FFFFFF" : "#000000"}
        />
      ),
    },
    {
      label: "Vegan",
      value: "vegan",
      icon: (selected: boolean) => (
        <MCIcon
          name="leaf"
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
            <View style={[commonStyles.progressFill, { width: "78%" }]} />
          </View>
        </View>

        <View style={commonStyles.content}>
          <Text style={[commonStyles.title, { lineHeight: 40 }]}>
            Do you follow a{"\n"}specific diet?
          </Text>

          <View style={commonStyles.optionsContainer}>
            {diets.map((diet) => (
              <TouchableOpacity
                key={diet.value}
                style={[
                  commonStyles.optionButton,
                  value === diet.value && commonStyles.optionButtonSelected,
                ]}
                onPress={() => onChange(diet.value)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {diet.icon(value === diet.value)}
                  <Text
                    style={[
                      commonStyles.optionText,
                      value === diet.value && commonStyles.optionTextSelected,
                    ]}
                  >
                    {diet.label}
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

export default DietStep;
