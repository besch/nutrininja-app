import React, { useState } from "react";
import { View, StyleSheet, Modal } from "react-native";
import { Text } from "@rneui/themed";
import { Button } from "@/components/ui/Button";
import { overlayStyles } from "./styles";
import OverlayHeader from "./OverlayHeader";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface PaceAdjustmentOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (value: number) => Promise<void>;
  initialValue: number;
  goal: "lose" | "maintain" | "gain";
}

export default function PaceAdjustmentOverlay({
  isVisible,
  onClose,
  onSave,
  initialValue,
  goal,
}: PaceAdjustmentOverlayProps) {
  const isMetric = useSelector((state: RootState) => state.user.is_metric);
  const [isLoading, setIsLoading] = useState(false);
  const progress = useSharedValue(initialValue);
  const sliderMin = useSharedValue(0.09);
  const sliderMax = useSharedValue(1.36);
  const [displayValue, setDisplayValue] = useState(initialValue);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(displayValue);
      onClose();
    } catch (error) {
      console.error('Error saving pace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={overlayStyles.overlay}>
        <View style={[overlayStyles.container, styles.container]}>
          <OverlayHeader 
            title="Adjust Weight Change Pace"
            onClose={onClose}
            isDisabled={isLoading}
          />

          <View style={styles.content}>
            <Text style={styles.description}>
              {goal.charAt(0).toUpperCase() + goal.slice(1)} weight speed per week
            </Text>

            <Text style={styles.paceValue}>
              {isMetric ? displayValue.toFixed(1) : (displayValue * 2.20462).toFixed(1)} {isMetric ? 'kg' : 'lbs'}
            </Text>

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
                  minimumValue={sliderMin}
                  maximumValue={sliderMax}
                  onValueChange={(value) => {
                    progress.value = value;
                    setDisplayValue(value);
                  }}
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
                  style={styles.slider}
                />
              </GestureHandlerRootView>

              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>
                  {(0.09 * (isMetric ? 1 : 2.20462)).toFixed(1)} {isMetric ? 'kg' : 'lbs'}
                </Text>
                <Text style={styles.sliderLabel}>
                  {(0.725 * (isMetric ? 1 : 2.20462)).toFixed(1)} {isMetric ? 'kg' : 'lbs'}
                </Text>
                <Text style={styles.sliderLabel}>
                  {(1.36 * (isMetric ? 1 : 2.20462)).toFixed(1)} {isMetric ? 'kg' : 'lbs'}
                </Text>
              </View>
            </View>
          </View>

          <Button
            title="Save"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={overlayStyles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    maxHeight: "80%",
  },
  content: {
    paddingVertical: 20,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  paceValue: {
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
  slider: {
    height: 60,
    paddingVertical: 10,
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
}); 