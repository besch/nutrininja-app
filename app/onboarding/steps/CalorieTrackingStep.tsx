import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";
import DotNavigation from "@/components/DotNavigation";

interface CalorieTrackingStepProps {
  onNext?: () => void;
  onNavigate?: (index: number) => void;
}

const CalorieTrackingStep = ({ onNext, onNavigate }: CalorieTrackingStepProps) => {
  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View
          style={[
            commonStyles.content,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Image
            source={require("@/assets/images/scan.png")}
            style={{
              width: "100%",
              height: 350,
              marginBottom: 32,
              borderRadius: 16,
            }}
          />
          <Text
            style={[
              commonStyles.title,
              { textAlign: "center", fontSize: 28, marginBottom: 16 },
            ]}
          >
            Calorie tracking made easy
          </Text>
          <Text
            style={[
              commonStyles.subtitle,
              { textAlign: "center", lineHeight: 24 },
            ]}
          >
            Just snap a quick photo of your meal and we'll do the rest
          </Text>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <DotNavigation currentIndex={0} onDotPress={onNavigate || (() => {})} />
          <TouchableOpacity style={buttonStyles.nextButton} onPress={onNext}>
            <Text style={buttonStyles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CalorieTrackingStep;
