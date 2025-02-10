import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, FlatList, Text, StyleSheet } from "react-native";
import WheelPicker, { ValueChangedEvent, RenderItemProps } from "@quidone/react-native-wheel-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import commonStyles from "../styles";
import wheelPickerStyles from "../wheelPickerStyles";
import buttonStyles from "../buttonStyles";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';

interface TargetWeightStepProps {
  value: string;
  onChange: (value: string) => void;
  onBack?: () => void;
  onNext?: () => void;
}

interface PickerItem {
  label: string;
  value: number;
}

export function TargetWeightStep({
  value,
  onChange,
  onBack,
  onNext,
}: TargetWeightStepProps) {
  const [isReady, setIsReady] = useState(false);

  const isMetric = useSelector((state: RootState) => state.user.is_metric);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Set initial value and defer WheelPicker rendering
    if (!value) {
      onChange(currentValue.toString());
    }
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleNext = () => {
    if (onNext) onNext();
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  const currentValue = parseInt(value) || 85;
  const minValue = 40;
  const maxValue = 250;

  const values = Array.from({ length: maxValue - minValue + 1 }, (_, i) => {
    const kg = minValue + i;
    return isMetric
      ? { label: `${kg} kg`, value: kg }
      : { label: `${Math.round(kg * 2.20462)} lbs`, value: kg };
  });

  const renderHeader = () => (
    <View style={commonStyles.header}>
      <TouchableOpacity onPress={handleBack} style={commonStyles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <View style={wheelPickerStyles.progressBar}>
        <View style={[wheelPickerStyles.progressFill, { width: "62%" }]} />
      </View>
    </View>
  );

  const renderPicker = () => (
    <View style={commonStyles.content}>
      <Text style={commonStyles.title}>Choose your{"\n"}desired weight</Text>
      {renderWheelPicker()}
    </View>
  );

  const renderWheelPicker = () => {
    if (!isReady) {
      return (
        <View style={[wheelPickerStyles.pickerWrapper, styles.centeredPicker]}>
          <View style={[styles.widePicker, wheelPickerStyles.placeholderPicker]}>
            <View style={wheelPickerStyles.placeholder} />
          </View>
        </View>
      );
    }

    return (
      <View style={[wheelPickerStyles.pickerWrapper, styles.centeredPicker]}>
        <View style={styles.widePicker}>
          <View style={wheelPickerStyles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={values}
              value={currentValue}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={wheelPickerStyles.itemContainer}>
                  <Text style={[wheelPickerStyles.itemText, { fontSize: 20 }]}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                onChange(event.item.value.toString());
              }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={wheelPickerStyles.safeArea}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={[{ key: "content" }]}
          renderItem={() => renderPicker()}
          ListHeaderComponent={renderHeader}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          style={wheelPickerStyles.container}
          contentContainerStyle={{ flexGrow: 1 }}
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
  centeredPicker: {
    alignItems: "center",
    marginTop: 40,
  },
  widePicker: {
    ...wheelPickerStyles.picker,
    width: "90%",
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  }
});

export default TargetWeightStep;
