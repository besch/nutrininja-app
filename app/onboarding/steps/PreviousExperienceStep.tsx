import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface PreviousExperienceStepProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function PreviousExperienceStep({
  value,
  onChange,
  onBack,
  onNext,
}: PreviousExperienceStepProps) {
  // Use the value prop directly for styling
  const isNoSelected = value === false;
  const isYesSelected = value === true;

  const handleNoPress = () => {
    onChange(false);
  };

  const handleYesPress = () => {
    onChange(true);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={commonStyles.progressBar}>
            <View style={[commonStyles.progressFill, { width: "8%" }]} />
          </View>
        </View>

        <View style={commonStyles.content}>
          <Text style={[commonStyles.title, { marginBottom: 40 }]}>
            Have you tried other calorie tracking apps?
          </Text>

          <View style={commonStyles.optionsContainer}>
            <Pressable
              style={[
                commonStyles.experienceButton,
                isNoSelected
                  ? commonStyles.experienceButtonSelected
                  : commonStyles.experienceButtonUnselected,
              ]}
              onPress={handleNoPress}
            >
              <View
                style={[
                  commonStyles.experienceIconContainer,
                  isNoSelected
                    ? commonStyles.experienceIconContainerSelected
                    : commonStyles.experienceIconContainerUnselected,
                ]}
              >
                <FontAwesome name="thumbs-down" size={20} color="#000000" />
              </View>
              <Text
                style={[
                  commonStyles.experienceText,
                  isNoSelected
                    ? commonStyles.experienceTextSelected
                    : commonStyles.experienceTextUnselected,
                ]}
              >
                No
              </Text>
            </Pressable>

            <Pressable
              style={[
                commonStyles.experienceButton,
                isYesSelected
                  ? commonStyles.experienceButtonSelected
                  : commonStyles.experienceButtonUnselected,
              ]}
              onPress={handleYesPress}
            >
              <View
                style={[
                  commonStyles.experienceIconContainer,
                  isYesSelected
                    ? commonStyles.experienceIconContainerSelected
                    : commonStyles.experienceIconContainerUnselected,
                ]}
              >
                <FontAwesome name="thumbs-up" size={20} color="#000000" />
              </View>
              <Text
                style={[
                  commonStyles.experienceText,
                  isYesSelected
                    ? commonStyles.experienceTextSelected
                    : commonStyles.experienceTextUnselected,
                ]}
              >
                Yes
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity
            style={[
              buttonStyles.nextButton,
              value === null && buttonStyles.nextButtonDisabled,
            ]}
            onPress={onNext}
            disabled={value === null}
          >
            <Text
              style={[
                buttonStyles.nextButtonText,
                value === null && buttonStyles.nextButtonTextDisabled,
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

export default PreviousExperienceStep;
