import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";
import { RootState } from '@/store';

interface TimelineStepProps {
  value: number;
  onChange: (value: number) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function TimelineStep({
  value,
  onChange,
  onBack = () => {},
  onNext = () => {},
}: TimelineStepProps) {
  const { goal } = useSelector(selectUser);
  const isMetric = useSelector((state: RootState) => state.user.is_metric);
  const progress = useSharedValue(value);
  const sliderMin = 0.09;
  const sliderMax = 1.36;
  const min = useSharedValue(sliderMin);
  const max = useSharedValue(sliderMax);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    onChange(value);
  }, []);

  // Local state update handler - updates display value but doesn't trigger Redux
  const handleLocalUpdate = (newValue: number) => {
    progress.value = newValue;
    setDisplayValue(newValue);
  };

  // Only trigger parent onChange when sliding completes
  const handleSlideComplete = (finalValue: number) => {
    onChange(finalValue);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={commonStyles.progressBar}>
            <View style={[commonStyles.progressFill, { width: "70%" }]} />
          </View>
        </View>

        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>How fast do you want to reach your goal?</Text>
          <View style={styles.centeredTextContainer}>
            <Text style={styles.centeredText}>
              {goal!.charAt(0).toUpperCase() + goal!.slice(1)} weight speed per week
            </Text>
          </View>

          <Text style={styles.timelineText}>{isMetric ? displayValue.toFixed(1) : (displayValue * 2.20462).toFixed(1)} {isMetric ? 'kg' : 'lbs'}</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.iconsContainer}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="walk" size={32} color="#666666" />
              </View>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="run" size={32} color="#666666" />
              </View>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="bike" size={32} color="#666666" />
              </View>
            </View>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Slider
                progress={progress}
                minimumValue={min}
                maximumValue={max}
                onValueChange={handleLocalUpdate}
                onSlidingComplete={handleSlideComplete}
                renderBubble={() => null}
                renderThumb={() => (
                  <View style={styles.customThumb} />
                )}
                theme={{
                  minimumTrackTintColor: "#000000",
                  maximumTrackTintColor: "#EEEEEE",
                  bubbleBackgroundColor: "#FFFFFF",
                  bubbleTextColor: "#000000"
                }}
                style={[styles.sliderContainerStyle, { height: 60 }]}
              />
            </GestureHandlerRootView>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{(sliderMin * (isMetric ? 1 : 2.20462)).toFixed(1)} {isMetric ? 'kg' : 'lbs'}</Text>
              <Text style={styles.sliderLabel}>{(((sliderMin + sliderMax) / 2) * (isMetric ? 1 : 2.20462)).toFixed(1)} {isMetric ? 'kg' : 'lbs'}</Text>
              <Text style={styles.sliderLabel}>{(sliderMax * (isMetric ? 1 : 2.20462)).toFixed(1)} {isMetric ? 'kg' : 'lbs'}</Text>
            </View>
          </View>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity
            style={buttonStyles.nextButton}
            onPress={onNext}
          >
            <Text style={buttonStyles.nextButtonText}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  timelineText: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 35,
    fontWeight: "bold",
    color: "#000000",
  },
  sliderContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sliderContainerStyle: {
    height: 60,
    paddingVertical: 10,
  },
  rail: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EEEEEE",
  },
  progress: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000000",
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    width: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  customThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredTextContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 10,
  },
  centeredText: {
    textAlign: 'center',
    fontSize: 18,
  },
});

export default TimelineStep;
