import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import commonStyles from "../styles";

interface CompleteStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function CompleteStep({ onBack, onNext }: CompleteStepProps) {
  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={commonStyles.progressBar}>
          <View style={[commonStyles.progressFill, { width: "86%" }]} />
        </View>
      </View>

      <View style={[commonStyles.content, { alignItems: "center" }]}>
        <View style={styles.checkmarkContainer}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.allDoneText}>All done!</Text>
        </View>

        <Text
          style={[commonStyles.title, { textAlign: "center", lineHeight: 40 }]}
        >
          Thank you for{"\n"}trusting us
        </Text>

        <Text
          style={[
            commonStyles.subtitle,
            { textAlign: "center", lineHeight: 24 },
          ]}
        >
          We promise to always keep your{"\n"}personal information private and
          secure.
        </Text>

        <LottieView
          source={require("@/assets/animations/confetti.json")}
          autoPlay
          loop={false}
          style={styles.confetti}
        />

        <TouchableOpacity
          style={[commonStyles.button, styles.button]}
          onPress={onNext}
        >
          <Text style={commonStyles.buttonText}>Create my plan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkmarkContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5A062",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  allDoneText: {
    fontSize: 18,
    color: "#666666",
    fontWeight: "500",
  },
  confetti: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  button: {
    position: "absolute",
    bottom: 32,
  },
});

export default CompleteStep;
