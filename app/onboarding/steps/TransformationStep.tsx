import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";
import DotNavigation from "@/components/DotNavigation";

interface TransformationStepProps {
  onNext?: () => void;
  onBack?: () => void;
  onNavigate?: (index: number) => void;
}

const TransformationStep = ({ onNext, onBack, onNavigate }: TransformationStepProps) => {
  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={[commonStyles.content, { justifyContent: "center" }]}>
          <View style={{ position: "relative" }}>
            <Image
              source={require("@/assets/images/person2.png")}
              style={{
                width: "100%",
                height: 350,
                marginBottom: 32,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
            <View style={styles.goalContainer}>
              <Text style={styles.goalLabel}>Weight Goal</Text>
              <Text style={styles.goalValue}>90 Kg</Text>
            </View>
          </View>
          <Text style={[commonStyles.title, { textAlign: "center" }]}>
            Transform your body
          </Text>
          <Text
            style={[
              commonStyles.subtitle,
              { textAlign: "center", paddingHorizontal: 20 },
            ]}
          >
            Today is the best time to start working toward your dream body
          </Text>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <DotNavigation currentIndex={2} onDotPress={onNavigate || (() => {})} />
          <TouchableOpacity style={buttonStyles.nextButton} onPress={onNext}>
            <Text style={buttonStyles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: "45%",
    marginBottom: 24,
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  goalContainer: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 12,
  },
  goalLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  goalValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
});

export default TransformationStep;
