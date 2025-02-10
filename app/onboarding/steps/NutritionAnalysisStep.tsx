import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";
import DotNavigation from "@/components/DotNavigation";

interface NutritionAnalysisStepProps {
  onNext?: () => void;
  onBack?: () => void;
  onNavigate?: (index: number) => void;
}

const NutritionAnalysisStep = ({
  onNext,
  onBack,
  onNavigate,
}: NutritionAnalysisStepProps) => {
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
            source={require("@/assets/images/plate.png")}
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
            In-depth nutrition analyses
          </Text>
          <Text
            style={[
              commonStyles.subtitle,
              { textAlign: "center", lineHeight: 24 },
            ]}
          >
            We will keep your informed about your food choices and their
            nutritional content
          </Text>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <DotNavigation currentIndex={1} onDotPress={onNavigate || (() => {})} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NutritionAnalysisStep;
