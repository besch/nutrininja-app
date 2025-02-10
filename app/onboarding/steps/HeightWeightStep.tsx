import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Switch, FlatList, Text, StyleSheet } from "react-native";
import WheelPicker, { ValueChangedEvent, RenderItemProps } from "@quidone/react-native-wheel-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import commonStyles from "../styles";
import wheelPickerStyles from "../wheelPickerStyles";
import buttonStyles from "../buttonStyles";
import { useDispatch } from 'react-redux';
import { setUserData } from '@/store/userSlice';
import { AppDispatch } from '@/store';

interface HeightWeightStepProps {
  height: string;
  weight: string;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onBack?: () => void;
  onNext?: () => void;
}

interface PickerItem {
  label: string;
  value: number;
}

const ValuePicker = ({
  label,
  value,
  minValue,
  maxValue,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  onChange: (value: number) => void;
  unit: string;
}) => {
  const values = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => ({ label: `${minValue + i}${unit}`, value: minValue + i })
  );

  return (
    <View style={wheelPickerStyles.picker}>
      <Text style={wheelPickerStyles.label}>{label}</Text>
      <View style={wheelPickerStyles.pickerContainer}>
        <WheelPicker<PickerItem>
          data={values}
          value={value}
          itemHeight={52}
          visibleItemCount={5}
          width="100%"
          keyExtractor={(item) => item.value.toString()}
          renderItem={(props: RenderItemProps<PickerItem>) => (
            <View style={wheelPickerStyles.itemContainer}>
              <Text style={wheelPickerStyles.itemText}>{props.item.label}</Text>
            </View>
          )}
          onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
            onChange(event.item.value);
          }}
        />
      </View>
    </View>
  );
};

const convertToImperial = {
  height: (cm: number) => Math.round(cm / 2.54), // cm to inches
  weight: (kg: number) => Math.round(kg * 2.20462), // kg to lbs
};

const convertToMetric = {
  height: (inches: number) => Math.round(inches * 2.54), // inches to cm
  weight: (lbs: number) => Math.round(lbs / 2.20462), // lbs to kg
};

export function HeightWeightStep({
  height,
  weight,
  onHeightChange,
  onWeightChange,
  onBack,
  onNext,
}: HeightWeightStepProps) {
  const [isMetric, setIsMetric] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleUnitChange = (value: boolean) => {
    setIsMetric(value);
    setIsReady(false); // Temporarily hide pickers
    dispatch(setUserData({ is_metric: value }));
    
    // Re-enable pickers after a short delay
    setTimeout(() => {
      setIsReady(true);
    }, 50);
  };

  useEffect(() => {
    // Set initial values and defer WheelPicker rendering
    const currentHeight = parseInt(height) || 175;
    const currentWeight = parseInt(weight) || 90;
    onHeightChange(currentHeight.toString());
    onWeightChange(currentWeight.toString());

    dispatch(setUserData({ is_metric: false }));

    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (onNext) onNext();
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  // Parse current values
  const currentHeight = parseInt(height) || 175;
  const currentWeight = parseInt(weight) || 90;

  const heightConfig = isMetric
    ? {
        value: currentHeight,
        minValue: 140,
        maxValue: 220,
        unit: " cm",
        onChange: (val: number) => onHeightChange(val.toString()),
      }
    : {
        value: convertToImperial.height(currentHeight),
        minValue: 55,
        maxValue: 87,
        unit: " in",
        onChange: (val: number) =>
          onHeightChange(convertToMetric.height(val).toString()),
      };

  const weightConfig = isMetric
    ? {
        value: currentWeight,
        minValue: 40,
        maxValue: 250,
        unit: " kg",
        onChange: (val: number) => onWeightChange(val.toString()),
      }
    : {
        value: convertToImperial.weight(currentWeight),
        minValue: 88,
        maxValue: 551,
        unit: " lbs",
        onChange: (val: number) =>
          onWeightChange(convertToMetric.weight(val).toString()),
      };

  const renderHeader = () => (
    <View style={commonStyles.header}>
      <TouchableOpacity onPress={handleBack} style={commonStyles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <View style={commonStyles.progressBar}>
        <View style={[commonStyles.progressFill, { width: "40%" }]} />
      </View>
    </View>
  );

  const renderContent = () => (
    <View style={commonStyles.content}>
      <Text style={commonStyles.title}>Height & Weight</Text>
      <Text style={commonStyles.subtitle}>
        This will be used to calibrate your custom plan.
      </Text>

      <View style={wheelPickerStyles.unitToggle}>
        <Text
          style={[
            wheelPickerStyles.unitText,
            !isMetric && wheelPickerStyles.unitTextActive,
          ]}
        >
          Imperial
        </Text>
        <Switch
          value={isMetric}
          onValueChange={handleUnitChange}
          style={{ marginHorizontal: 10 }}
          trackColor={{ false: "#D3D3D3", true: "#000000" }}
          thumbColor="#FFFFFF"
        />
        <Text
          style={[
            wheelPickerStyles.unitText,
            isMetric && wheelPickerStyles.unitTextActive,
          ]}
        >
          Metric
        </Text>
      </View>

      {renderPickers()}
    </View>
  );

  const renderPickers = () => {
    if (!isReady) {
      return (
        <View style={wheelPickerStyles.pickerWrapper}>
          <View style={[wheelPickerStyles.picker, wheelPickerStyles.placeholderPicker]}>
            <Text style={wheelPickerStyles.label}>Height</Text>
            <View style={wheelPickerStyles.placeholder} />
          </View>
          <View style={[wheelPickerStyles.picker, wheelPickerStyles.placeholderPicker]}>
            <Text style={wheelPickerStyles.label}>Weight</Text>
            <View style={wheelPickerStyles.placeholder} />
          </View>
        </View>
      );
    }

    return (
      <View style={wheelPickerStyles.pickerWrapper}>
        <ValuePicker 
          key={`height-${isMetric}`} 
          label="Height" 
          {...heightConfig} 
        />
        <ValuePicker 
          key={`weight-${isMetric}`} 
          label="Weight" 
          {...weightConfig} 
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={wheelPickerStyles.safeArea}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={[{ key: "content" }]}
          renderItem={() => renderContent()}
          ListHeaderComponent={renderHeader}
          scrollEnabled={false}
          style={wheelPickerStyles.container}
        />
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity
            style={[
              buttonStyles.nextButton,
              !isReady && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!isReady}
          >
            <Text style={[
              buttonStyles.nextButtonText,
              !isReady && styles.disabledButtonText
            ]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  }
});

export default HeightWeightStep;
